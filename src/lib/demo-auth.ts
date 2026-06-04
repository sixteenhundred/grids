"use server";

/**
 * Guest / demo session over Supabase Auth.
 *
 * "Continue as guest" now creates a real **anonymous** Supabase user (enable
 * Anonymous sign-ins in the Supabase dashboard). That gives guests a genuine
 * `auth.uid()` so RLS and FK-backed writes work — no hard-coded demo account.
 * Function names are unchanged so existing callers keep working.
 */

import { createSupabaseServerClient } from "./supabase/server";
import { enforceRateLimit } from "./security/rate-guard";

export async function guestLogin(): Promise<{ ok: boolean }> {
  await enforceRateLimit("auth");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInAnonymously();
  return { ok: !error };
}

export async function demoLogout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut().catch(() => {});
}

export async function hasDemoSession(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user?.is_anonymous;
}
