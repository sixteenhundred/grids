/**
 * RLS isolation test (rule 9). Proves a user can only read/write their OWN
 * rows via the Supabase API, that anon sees nothing, and that server-only
 * tables are denied to the API. Creates two throwaway users and DELETES them
 * (no test data left). Exits non-zero on failure.
 *
 * Run with the project env loaded, e.g.:
 *   set -a; source .env.local; set +a; node scripts/test-rls.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *           SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL (direct).
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

const mk = async (tag) => {
  const email = `rls-${tag}-${Date.now()}@example.com`;
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
await sql`insert into public.profile (id,user_id,role,bio,created_at,updated_at)
  values (${"pf_" + A.id}, ${A.id}, 'creative', 'A-private-bio', now(), now())
  on conflict (user_id) do nothing`;

const ca = await authed(A);
const cb = await authed(B);
const canon = createClient(URL, ANON, { auth: { persistSession: false } });

const aOwn = await ca.from("profile").select("user_id");
const bSeesA = await cb.from("profile").select("user_id");
const anonSees = await canon.from("profile").select("user_id");
const bUpdateA = await cb.from("profile").update({ bio: "hacked" }).eq("user_id", A.id).select();
const flagAnon = await canon.from("feature_flag").select("key");

await admin.auth.admin.deleteUser(A.id);
await admin.auth.admin.deleteUser(B.id);
const leftover = await sql`select count(*)::int c from public.profile where user_id in (${A.id}, ${B.id})`;
await sql.end();

const checks = {
  "A reads own row": (aOwn.data?.length ?? 0) === 1,
  "B cannot read A's row": (bSeesA.data?.length ?? 0) === 0,
  "anon reads nothing": (anonSees.data?.length ?? 0) === 0,
  "B cannot update A's row": (bUpdateA.data?.length ?? 0) === 0,
  "feature_flag denied to anon": (flagAnon.data?.length ?? 0) === 0,
  "test users cleaned up": leftover[0].c === 0,
};
const pass = Object.values(checks).every(Boolean);
for (const [k, v] of Object.entries(checks)) console.log(`${v ? "PASS" : "FAIL"}  ${k}`);
console.log(pass ? "\nRLS ISOLATION: PASS" : "\nRLS ISOLATION: FAIL");
process.exit(pass ? 0 : 1);
