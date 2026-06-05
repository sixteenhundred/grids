import "server-only";

/**
 * Consent enforcement (Objective 1). The `consent` table stores per-user
 * cookies / AI / marketing flags; this is the single server-side gate any
 * data use that REQUIRES consent (marketing communications, AI-improvement /
 * personalisation use of personal data) must pass before processing.
 *
 * Fail CLOSED: an absent row or a read error means "not granted", so we never
 * process on an assumed-yes. (Note: processing a user's input to deliver a
 * feature they actively requested — e.g. generating their campaign — is a
 * separate lawful basis and is disclosed in the privacy policy, not gated here.)
 */
import { eq } from "drizzle-orm";
import { db } from "./db";
import { consent } from "./db/schema";

export type ConsentKind = "cookies" | "ai" | "marketing";

/** True only if the user has explicitly granted consent for `kind`. */
export async function hasConsent(userId: string, kind: ConsentKind): Promise<boolean> {
  try {
    const row = await db
      .select({ cookies: consent.cookies, ai: consent.ai, marketing: consent.marketing })
      .from(consent)
      .where(eq(consent.userId, userId))
      .limit(1)
      .then((r) => r[0]);
    return !!row?.[kind];
  } catch {
    return false; // no provable consent → treat as not granted
  }
}

/** Throw unless the user has granted consent for `kind`. */
export async function requireConsent(userId: string, kind: ConsentKind): Promise<void> {
  if (!(await hasConsent(userId, kind))) {
    throw new Error(`This requires your ${kind} consent — manage it in Account → Consent.`);
  }
}
