import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser client — for client components (sign in/up, session reads).
 * Uses the publishable (anon) key; safe in the browser once RLS is enabled.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createSupabaseBrowserClient() {
  return createBrowserClient(URL, ANON);
}
