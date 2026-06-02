"use client";

/**
 * Client auth — Supabase Auth, exposed through the same surface the app already
 * uses (`signIn.email`, `signUp.email`, `signOut`, `useSession`) so call sites
 * didn't need to change when we moved off Better Auth.
 */

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./supabase/client";

const supabase = createSupabaseBrowserClient();

export type SessionUser = { id: string; email: string; name: string };

function mapUser(u: User | null | undefined): SessionUser | undefined {
  if (!u) return undefined;
  const name = (u.user_metadata?.name as string | undefined) ?? u.email ?? "Member";
  return { id: u.id, email: u.email ?? `anon-${u.id}@grid.local`, name };
}

/** Mirrors Better Auth's `useSession()` shape: `{ data: { user }, isPending }`. */
export function useSession() {
  const [data, setData] = useState<{ user: SessionUser | undefined } | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setData(user ? { user: mapUser(user) } : null);
      setIsPending(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setData(session?.user ? { user: mapUser(session.user) } : null);
      setIsPending(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { data, isPending };
}

export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error: error ? { message: error.message } : null };
  },
};

export const signUp = {
  email: async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { data, error: error ? { message: error.message } : null };
  },
};

export async function signOut() {
  await supabase.auth.signOut();
}
