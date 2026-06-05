/**
 * Entitlement forge-proof test (SECURITY_AUDIT #1). Proves an authenticated user
 * CANNOT insert a purchase / academy_enrollment / lesson_progress row via the
 * public PostgREST API (those rows are proof of payment/access — only the server
 * writes them), while still being able to READ their own. Creates one throwaway
 * user and deletes it. Exits non-zero on failure.
 *
 * Run: set -a; source .env.local; set +a; node scripts/test-entitlement-rls.mjs
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DBU = process.env.DATABASE_URL;
if (!URL || !ANON || !SVC || !DBU) {
  console.error("Missing env");
  process.exit(2);
}

const admin = createClient(URL, SVC, { auth: { persistSession: false } });
const sql = postgres(DBU, { ssl: "require" });

const email = `forge-${Date.now()}@example.com`;
const password = `Tst${Math.random().toString(36).slice(2)}A9!`;
const { data, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (cErr) throw cErr;
const uid = data.user.id;

const c = createClient(URL, ANON, { auth: { persistSession: false } });
await c.auth.signInWithPassword({ email, password });

const p = await c.from("purchase").insert({ id: "pf_" + Date.now(), user_id: uid, product_id: "x" }).select();
const e = await c.from("academy_enrollment").insert({ id: "ef_" + Date.now(), user_id: uid, academy_id: "x" }).select();
const l = await c.from("lesson_progress").insert({ id: "lf_" + Date.now(), user_id: uid, lesson_id: "x" }).select();
const ownRead = await c.from("purchase").select("id"); // own-row SELECT must still work (0 rows, no error)
const forgedRows = await sql`select count(*)::int c from purchase where user_id=${uid}`;

await admin.auth.admin.deleteUser(uid);
await sql.end();

const denied = (x) => (x.data?.length ?? 0) === 0 && !!x.error;
const checks = {
  "purchase insert denied": denied(p),
  "enrollment insert denied": denied(e),
  "lesson_progress insert denied": denied(l),
  "own-row SELECT still allowed": !ownRead.error,
  "no forged purchase row persisted": forgedRows[0].c === 0,
};
const pass = Object.values(checks).every(Boolean);
for (const [k, v] of Object.entries(checks)) console.log(`${v ? "PASS" : "FAIL"}  ${k}`);
console.log(pass ? "\nENTITLEMENT FORGE-PROOF: PASS" : "\nENTITLEMENT FORGE-PROOF: FAIL");
process.exit(pass ? 0 : 1);
