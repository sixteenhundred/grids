/**
 * Vault RLS + can() isolation test (Phase A). Proves, against the live DB:
 *   - a vault member reads their vault/files via the API; a non-member and anon
 *     see nothing;
 *   - a user CANNOT forge a vault_permission for themselves via the API (no
 *     insert grant) — the SECURITY_AUDIT #1 class cannot recur on vault data;
 *   - server-only tables (domain_event, vault_invite) are denied to the API;
 *   - the can() role→action mapping resolves correctly from the DB.
 * Creates two throwaway users + a vault and DELETES everything (Rule 3). Exits
 * non-zero on any failure.
 *
 * Run: set -a; source .env.local; set +a; node scripts/test-vault.mjs
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DBU = process.env.DATABASE_URL;
if (!URL || !ANON || !SVC || !DBU) {
  console.error("Missing env (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL)");
  process.exit(2);
}

const admin = createClient(URL, SVC, { auth: { persistSession: false } });
const sql = postgres(DBU, { ssl: "require" });

// --- can() logic mirror (keep in sync with src/lib/security/vault-guard.ts) ---
const RANK = { viewer: 0, contributor: 1, editor: 2, admin: 3, owner: 4 };
const REQUIRED = {
  view: "viewer", download: "viewer", upload: "contributor", delete: "editor",
  move: "editor", archive: "admin", share: "admin", invite: "admin", transfer: "owner",
};
const can = (role, action) => role != null && RANK[role] >= RANK[REQUIRED[action]];
const roleOn = async (uid, vid) => {
  const r = await sql`select role from public.vault_permission where vault_id=${vid} and user_id=${uid} limit 1`;
  return r[0]?.role ?? null;
};

const mk = async (tag) => {
  const email = `vault-${tag}-${Date.now()}@example.com`;
  const password = `Tst${Math.random().toString(36).slice(2)}A9!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return { id: data.user.id, email, password };
};
const authed = async (u) => {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email: u.email, password: u.password });
  return c;
};

const A = await mk("a");
const B = await mk("b");

const vid = "vlt_test_" + Date.now().toString(36);
const fid = "file_test_" + Date.now().toString(36);

// Server-side writes (Drizzle/postgres bypasses RLS — exactly what the app does).
await sql`insert into public.vault (id,type,owner_id,name,status,created_at,updated_at)
  values (${vid},'content',${A.id},'Test Content Vault','active',now(),now())`;
await sql`insert into public.vault_permission (id,vault_id,user_id,role,created_at)
  values (${"vp_" + vid + "_a"}, ${vid}, ${A.id}, 'owner', now())`;
await sql`insert into public.file (id,vault_id,storage_key,provider,filename,mime_type,size,uploaded_by,status,created_at,updated_at)
  values (${fid}, ${vid}, ${"files/" + fid}, 'supabase', 'deliverable.zip', 'application/zip', 1024, ${A.id}, 'ready', now(), now())`;
await sql`insert into public.domain_event (id,type,payload,attempts,created_at)
  values (${"evt_test_" + Date.now().toString(36)}, 'VaultCreated', ${sql.json({ vaultId: vid })}, 0, now())`;
await sql`insert into public.vault_invite (id,vault_id,email,role,token,invited_by,status,created_at)
  values (${"vi_test_" + Date.now().toString(36)}, ${vid}, 'invitee@example.com', 'viewer', ${"tok_" + Math.random().toString(36).slice(2)}, ${A.id}, 'pending', now())`;

const ca = await authed(A);
const cb = await authed(B);
const canon = createClient(URL, ANON, { auth: { persistSession: false } });

const aRole = await roleOn(A.id, vid);
const bRoleBefore = await roleOn(B.id, vid);

const aSeesVault = await ca.from("vault").select("id").eq("id", vid);
const bSeesVaultBefore = await cb.from("vault").select("id").eq("id", vid);
const anonSeesVault = await canon.from("vault").select("id").eq("id", vid);
const aSeesFile = await ca.from("file").select("id").eq("id", fid);
const bSeesFileBefore = await cb.from("file").select("id").eq("id", fid);

// Forgery: B grants THEMSELVES owner on A's vault via the API → must be denied.
const forge = await cb
  .from("vault_permission")
  .insert({ id: "vp_forge_" + Date.now().toString(36), vault_id: vid, user_id: B.id, role: "owner" })
  .select();
const forged = await sql`select count(*)::int c from public.vault_permission where vault_id=${vid} and user_id=${B.id}`;

// Server-only tables denied to the API surface.
const anonEvents = await canon.from("domain_event").select("id");
const bInvites = await cb.from("vault_invite").select("id").eq("vault_id", vid);

// Grant B viewer (server-side), then B should READ the vault/file but not act on it.
await sql`insert into public.vault_permission (id,vault_id,user_id,role,created_at)
  values (${"vp_" + vid + "_b"}, ${vid}, ${B.id}, 'viewer', now())`;
const bRoleAfter = await roleOn(B.id, vid);
const bSeesVaultAfter = await cb.from("vault").select("id").eq("id", vid);
const bSeesFileAfter = await cb.from("file").select("id").eq("id", fid);

// Cleanup (delete vault cascades file/permission/invite; delete the throwaway users).
await sql`delete from public.vault where id=${vid}`;
await admin.auth.admin.deleteUser(A.id);
await admin.auth.admin.deleteUser(B.id);
const leftover = await sql`select
  (select count(*)::int from public.vault where id=${vid})
  + (select count(*)::int from public.file where id=${fid})
  + (select count(*)::int from public.vault_permission where vault_id=${vid}) as c`;
await sql.end();

const checks = {
  "owner role resolves from DB": aRole === "owner",
  "owner can transfer (rank)": can(aRole, "transfer") === true,
  "owner can download": can(aRole, "download") === true,
  "non-member has no role": bRoleBefore === null,
  "non-member can do nothing": can(bRoleBefore, "view") === false,
  "A reads own vault (API)": (aSeesVault.data?.length ?? 0) === 1,
  "B cannot read vault before grant": (bSeesVaultBefore.data?.length ?? 0) === 0,
  "anon cannot read vault": (anonSeesVault.data?.length ?? 0) === 0,
  "A reads own file (API)": (aSeesFile.data?.length ?? 0) === 1,
  "B cannot read file before grant": (bSeesFileBefore.data?.length ?? 0) === 0,
  "forged self-grant denied": (forge.data?.length ?? 0) === 0 && forged[0].c === 0,
  "domain_event denied to anon": (anonEvents.data?.length ?? 0) === 0,
  "vault_invite denied to API": (bInvites.data?.length ?? 0) === 0,
  "viewer role resolves after grant": bRoleAfter === "viewer",
  "viewer views but cannot upload/transfer":
    can(bRoleAfter, "view") === true && can(bRoleAfter, "upload") === false && can(bRoleAfter, "transfer") === false,
  "member reads vault after grant (API)": (bSeesVaultAfter.data?.length ?? 0) === 1,
  "member reads file after grant (API)": (bSeesFileAfter.data?.length ?? 0) === 1,
  "test data cleaned up": leftover[0].c === 0,
};
const pass = Object.values(checks).every(Boolean);
for (const [k, v] of Object.entries(checks)) console.log(`${v ? "PASS" : "FAIL"}  ${k}`);
console.log(pass ? "\nVAULT RLS + can(): PASS" : "\nVAULT RLS + can(): FAIL");
process.exit(pass ? 0 : 1);
