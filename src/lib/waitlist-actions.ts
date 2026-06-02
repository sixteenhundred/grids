"use server";

/**
 * Waitlist signups → `waitlist` table (Supabase Postgres). After a new signup
 * we fire two emails (non-blocking, best-effort): a confirmation to the signer
 * and a notification to our inbox. Email no-ops cleanly until Resend keys are
 * set, so the signup itself never fails on email.
 */

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { waitlist } from "./db/schema";
import { getServerEnv } from "./env";
import { rateLimit } from "./security/rate-limit";
import { sendEmail } from "./services/email.service";
import { waitlistConfirmation, waitlistNotification } from "./email-templates";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254; // RFC 5321 practical maximum
const memEmails = new Set<string>();

function notifyAddress(): string | null {
  const env = getServerEnv();
  if (env.WAITLIST_NOTIFY_EMAIL) return env.WAITLIST_NOTIFY_EMAIL;
  const firstAdmin = env.ADMIN_EMAILS?.split(",")[0]?.trim();
  return firstAdmin || null;
}

/** Build the no-login unsubscribe link (opaque token only — no email in URL). */
function unsubscribeUrl(token: string): string {
  const base = getServerEnv().NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api/unsubscribe?t=${encodeURIComponent(token)}`;
}

async function sendSignupEmails(email: string, token: string): Promise<void> {
  const conf = waitlistConfirmation(unsubscribeUrl(token));
  await sendEmail({ to: email, subject: conf.subject, html: conf.html }).catch(() => {});
  const to = notifyAddress();
  if (to) {
    const note = waitlistNotification(email, new Date().toISOString());
    await sendEmail({ to, subject: note.subject, html: note.html }).catch(() => {});
  }
}

/** Best-effort client IP from proxy headers (for the public rate-limit). */
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
}

export async function joinWaitlist(
  rawEmail: string,
): Promise<{ ok: boolean; message: string; already?: boolean }> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL || !EMAIL.test(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }

  // Abuse guard: cap signups per IP (public, unauthenticated endpoint).
  const ip = await clientIp();
  if (!rateLimit(`waitlist:${ip}`, { limit: 8, windowMs: 10 * 60_000 }).ok) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }

  try {
    const existing = await db
      .select({ id: waitlist.id, token: waitlist.unsubscribeToken, unsubscribedAt: waitlist.unsubscribedAt })
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1)
      .then((r) => r[0]);
    if (existing) {
      // Re-joining after unsubscribing re-grants consent (explicit opt-in).
      if (existing.unsubscribedAt) {
        await db.update(waitlist).set({ unsubscribedAt: null }).where(eq(waitlist.id, existing.id));
        await sendSignupEmails(email, existing.token ?? "");
        return { ok: true, message: "You're back on the list." };
      }
      return { ok: true, already: true, message: "You're already on the list." };
    }
    const id = `wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const token = `unsub_${randomBytes(24).toString("hex")}`;
    await db.insert(waitlist).values({ id, email, unsubscribeToken: token }).onConflictDoNothing();
    await sendSignupEmails(email, token); // best-effort; never blocks the signup
    return { ok: true, message: "You're on the list." };
  } catch {
    if (memEmails.has(email)) {
      return { ok: true, already: true, message: "You're already on the list." };
    }
    memEmails.add(email);
    return { ok: true, message: "You're on the list." };
  }
}
