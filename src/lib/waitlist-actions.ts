"use server";

/**
 * Waitlist signups → `waitlist` table (Supabase Postgres). After a new signup
 * we fire two emails (non-blocking, best-effort): a confirmation to the signer
 * and a notification to our inbox. Email no-ops cleanly until Resend keys are
 * set, so the signup itself never fails on email.
 */

import { eq } from "drizzle-orm";
import { db } from "./db";
import { waitlist } from "./db/schema";
import { getServerEnv } from "./env";
import { sendEmail } from "./services/email.service";
import { waitlistConfirmation, waitlistNotification } from "./email-templates";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const memEmails = new Set<string>();

function notifyAddress(): string | null {
  const env = getServerEnv();
  if (env.WAITLIST_NOTIFY_EMAIL) return env.WAITLIST_NOTIFY_EMAIL;
  const firstAdmin = env.ADMIN_EMAILS?.split(",")[0]?.trim();
  return firstAdmin || null;
}

async function sendSignupEmails(email: string): Promise<void> {
  const conf = waitlistConfirmation();
  await sendEmail({ to: email, subject: conf.subject, html: conf.html }).catch(() => {});
  const to = notifyAddress();
  if (to) {
    const note = waitlistNotification(email, new Date().toISOString());
    await sendEmail({ to, subject: note.subject, html: note.html }).catch(() => {});
  }
}

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
    await sendSignupEmails(email); // best-effort; never blocks the signup
    return { ok: true, message: "You're on the list." };
  } catch {
    if (memEmails.has(email)) {
      return { ok: true, already: true, message: "You're already on the list." };
    }
    memEmails.add(email);
    return { ok: true, message: "You're on the list." };
  }
}
