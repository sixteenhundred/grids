import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase clients (server side).
 *
 * - `createSupabaseServerClient()` — cookie-bound, respects RLS; use for the
 *   signed-in user's requests (reads `auth.uid()` in policies).
 * - `createSupabaseAdminClient()` — service-role, BYPASSES RLS; server-only,
 *   use sparingly for privileged/admin/webhook work. Never expose to the client.
 *
 * Auth wiring (login/signup/guards) is swapped onto these in the next step.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (read-only cookies) — safe to ignore;
          // session refresh is handled in middleware.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
