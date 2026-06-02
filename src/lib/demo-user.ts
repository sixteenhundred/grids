/**
 * Mirror-row helper.
 *
 * Supabase `auth.users` is the source of truth; a DB trigger mirrors each into
 * `public.user` so FK-backed inserts (shop, academy, …) resolve. This is a
 * belt-and-suspenders upsert for the *current* caller, in case an action runs
 * before the trigger row is visible. Server-only.
 */
import { db } from "./db";
import { user } from "./db/schema";

const ensured = new Set<string>();

export async function ensureUserRow(u: { id: string; email: string; name: string }): Promise<void> {
  if (ensured.has(u.id)) return;
  await db
    .insert(user)
    .values({ id: u.id, name: u.name, email: u.email, emailVerified: true })
    .onConflictDoNothing();
  ensured.add(u.id);
}
