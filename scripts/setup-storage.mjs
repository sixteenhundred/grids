/**
 * One-time (idempotent) Supabase Storage setup: create the private `uploads`
 * bucket and a storage RLS policy scoping objects to the owner's uid folder.
 * Server uploads use the service role (bypass RLS) via the quota-gated service.
 *
 * Run: set -a; source .env.local; set +a; node scripts/setup-storage.mjs
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL.
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DBU = process.env.DATABASE_URL;
if (!URL || !SVC || !DBU) {
  console.error("Missing env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL)");
  process.exit(2);
}

const admin = createClient(URL, SVC, { auth: { persistSession: false } });

// No per-bucket fileSizeLimit: Supabase caps it at the project's global limit
// (plan-dependent). Our logical 5 GB/file + 50 GB/profile caps live in quota.ts.
const { error: bErr } = await admin.storage.createBucket("uploads", { public: false });
if (bErr && !/already exists|exists/i.test(bErr.message)) {
  console.error("createBucket failed:", bErr.message);
  process.exit(1);
}
console.log(bErr ? "bucket 'uploads' already exists" : "bucket 'uploads' created (private)");

// Vault bucket: private, service-role-only. No storage RLS policy — vault objects
// are never addressed by the browser; access is a server-minted signed URL after
// a can() check (VAULT_ARCHITECTURE.md §2/§11).
const { error: vErr } = await admin.storage.createBucket("vaults", { public: false });
if (vErr && !/already exists|exists/i.test(vErr.message)) {
  console.error("createBucket 'vaults' failed:", vErr.message);
  process.exit(1);
}
console.log(vErr ? "bucket 'vaults' already exists" : "bucket 'vaults' created (private)");

// Owner-scoped policy on storage.objects (files live under `${uid}/…`).
const sql = postgres(DBU, { ssl: "require" });
await sql.unsafe(`
  drop policy if exists uploads_own on storage.objects;
  create policy uploads_own on storage.objects for all to authenticated
    using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (auth.uid())::text)
    with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = (auth.uid())::text);
`);
const pol = await sql`select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname='uploads_own'`;
console.log("storage.objects policy uploads_own:", pol.length ? "present" : "MISSING");
await sql.end();
