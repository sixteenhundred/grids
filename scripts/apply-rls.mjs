/**
 * Apply supabase/rls.sql to the database in DATABASE_URL (use the DIRECT
 * connection string). Idempotent. Usage:
 *   DATABASE_URL='postgresql://…?sslmode=require' node scripts/apply-rls.mjs
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });
const ddl = readFileSync(new URL("../supabase/rls.sql", import.meta.url), "utf8");
await sql.unsafe(ddl);

const rls = await sql`
  select relname from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  order by relname`;
const pols = await sql`select tablename, policyname from pg_policies where schemaname='public' order by tablename, policyname`;

console.log("RLS enabled on:", rls.map((r) => r.relname).join(", "));
console.log("policies:", pols.length, "→", pols.map((p) => `${p.tablename}.${p.policyname}`).join(", "));
await sql.end();
