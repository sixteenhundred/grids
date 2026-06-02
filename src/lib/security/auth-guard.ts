/**
 * Route/action auth guards (SERVER-ONLY).
 *
 * Reads the Supabase Auth session (cookie-bound). Use in API routes and server
 * actions that need the caller's identity. The returned `id` is the Supabase
 * `auth.uid()`, which is mirrored into `public.user` by a DB trigger so FK-backed
 * inserts resolve.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export type AuthedUser = { id: string; email: string; name: string };

export class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Current caller from the Supabase session, or null. */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? "Member";
  return {
    id: user.id,
    email: user.email ?? `anon-${user.id}@grid.local`,
    name,
  };
}

/** Require any authenticated caller; throws AuthError(401) otherwise. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Authentication required.");
  return user;
}

/** Require an admin caller; throws AuthError(401/403) otherwise. */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) throw new AuthError(403, "Admin access required.");
  return user;
}

/** Translate an AuthError (or anything unexpected) into a safe NextResponse. */
export function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
