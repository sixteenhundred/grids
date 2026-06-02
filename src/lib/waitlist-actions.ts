"use server";

/**
 * Waitlist signups → `waitlist` table (Supabase Postgres). If the DB is
 * unreachable it falls back to an in-memory set so the page still confirms for
 * the current instance. Email side-effects (confirmation + admin notice) are
 * wired in Phase 1.
 */

import { eq } from "drizzle-orm";
import { db } from "./db";
import { waitlist } from "./db/schema";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const memEmails = new Set<string>();

export async function joinWaitlist(
  rawEmail: string,
): Promise<{ ok: boolean; message: string; already?: boolean }> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }

  try {
    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1);
    if (existing.length > 0) {
      return { ok: true, already: true, message: "You're already on the list." };
    }
    const id = `wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(waitlist).values({ id, email }).onConflictDoNothing();
    return { ok: true, message: "You're on the list." };
  } catch {
    // No database — confirm against the in-memory set for this instance.
    if (memEmails.has(email)) {
      return { ok: true, already: true, message: "You're already on the list." };
    }
    memEmails.add(email);
    return { ok: true, message: "You're on the list." };
  }
}
