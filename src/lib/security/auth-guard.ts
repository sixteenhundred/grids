/**
 * Route/action auth guards (SERVER-ONLY — imports next/headers).
 *
 * Mirrors the existing `auth.api.getSession({ headers })` + demo-session
 * fallback + isAdminEmail() pattern used across the server actions, so behavior
 * stays consistent. Use in API routes and server actions that need a caller.
 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasDemoSession } from "@/lib/demo-auth";
import { DEMO_USER } from "@/lib/demo";
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

/** Current caller (real Better Auth session or demo fallback), or null. */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session?.user) return { id: session.user.id, email: session.user.email, name: session.user.name };
  if (await hasDemoSession()) return { id: DEMO_USER.id, email: DEMO_USER.email, name: DEMO_USER.name };
  return null;
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
