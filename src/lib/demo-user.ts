/**
 * Demo user persistence.
 *
 * The demo user (see `DEMO_USER`) is a non-blocking auth fallback that normally
 * never touches the database. But per-user features (shop, academy, …) insert
 * rows whose `user_id` is a FOREIGN KEY into `user`, so seeding those for the
 * demo user fails the constraint unless a matching `user` row exists.
 *
 * This idempotently inserts that row. Server-only — imported solely by server
 * actions; never import it into client code.
 */
import { db } from "./db";
import { user } from "./db/schema";
import { DEMO_USER } from "./demo";

let ensured = false; // skip the DB round-trip after the first success this process

export async function ensureDemoUserRow(): Promise<void> {
  if (ensured) return;
  await db
    .insert(user)
    .values({
      id: DEMO_USER.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      emailVerified: true,
    })
    .onConflictDoNothing();
  ensured = true;
}
