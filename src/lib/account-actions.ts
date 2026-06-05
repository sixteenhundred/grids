"use server";

/**
 * Account data-rights actions (privacy/your-controls + rights/overview):
 *   - exportMyData     → machine-readable JSON copy of the caller's data
 *   - deleteMyAccount  → deletes the caller's auth user (cascades all their data)
 *   - get/setMyConsent → cookies / AI / marketing consent, withdrawable
 *
 * Every request writes an append-only `audit_event` (the published promise:
 * "every request creates an immutable audit event"). Audit rows survive account
 * deletion (user_id → null) so the request stays provable.
 *
 * A user can only ever act on their OWN account (requireUser + self-scoped).
 */

import { and, eq, or } from "drizzle-orm";
import { requireUser } from "./security/auth-guard";
import { enforceRateLimit } from "./security/rate-guard";
import { ensureUserRow } from "./demo-user";
import { removeUserObjects } from "./services/storage.service";
import { createSupabaseAdminClient } from "./supabase/server";
import { db } from "./db";
import {
  user,
  profile,
  shop,
  product,
  purchase,
  academy,
  academyEnrollment,
  learningPath,
  lesson,
  lessonProgress,
  subscription,
  usage,
  contract,
  contractVersion,
  review,
  dispute,
  portfolioItem,
  creatorPackage,
  consent,
  waitlist,
  auditEvent,
} from "./db/schema";

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Append an immutable audit event (best-effort; never blocks the action). */
async function logAudit(userId: string | null, action: string, detail?: unknown): Promise<void> {
  try {
    await db.insert(auditEvent).values({
      id: genId("ae"),
      userId,
      action,
      detail: (detail ?? null) as object | null,
    });
  } catch {
    /* never block the user action on audit write */
  }
}

/** A full, machine-readable copy of the caller's data (right of access/export). */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const u = await requireUser();
  await enforceRateLimit("sensitive", u.id);
  const byUser = <T>(p: Promise<T>) => p;

  const [
    userRow,
    profileRows,
    shopRows,
    productRows,
    purchaseRows,
    academyRows,
    enrollmentRows,
    pathRows,
    lessonRows,
    progressRows,
    subscriptionRows,
    usageRows,
    contractRows,
    versionRows,
    reviewRows,
    disputeRows,
    portfolioRows,
    packageRows,
    consentRows,
    waitlistRows,
  ] = await Promise.all([
    byUser(db.select().from(user).where(eq(user.id, u.id))),
    db.select().from(profile).where(eq(profile.userId, u.id)),
    db.select().from(shop).where(eq(shop.userId, u.id)),
    db.select().from(product).where(eq(product.userId, u.id)),
    db.select().from(purchase).where(eq(purchase.userId, u.id)),
    db.select().from(academy).where(eq(academy.userId, u.id)),
    db.select().from(academyEnrollment).where(eq(academyEnrollment.userId, u.id)),
    db.select().from(learningPath).where(eq(learningPath.userId, u.id)),
    db.select().from(lesson).where(eq(lesson.userId, u.id)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, u.id)),
    db.select().from(subscription).where(eq(subscription.userId, u.id)),
    db.select().from(usage).where(eq(usage.userId, u.id)),
    db.select().from(contract).where(or(eq(contract.creatorId, u.id), eq(contract.clientId, u.id))),
    db.select().from(contractVersion).where(eq(contractVersion.editorId, u.id)),
    db.select().from(review).where(or(eq(review.authorId, u.id), eq(review.subjectId, u.id))),
    db.select().from(dispute).where(eq(dispute.openedById, u.id)),
    db.select().from(portfolioItem).where(eq(portfolioItem.userId, u.id)),
    db.select().from(creatorPackage).where(eq(creatorPackage.userId, u.id)),
    db.select().from(consent).where(eq(consent.userId, u.id)),
    db.select().from(waitlist).where(eq(waitlist.email, u.email)),
  ]);

  await logAudit(u.id, "data_export");

  return {
    exportedAt: new Date().toISOString(),
    account: userRow[0] ?? { id: u.id, email: u.email },
    profile: profileRows,
    shop: shopRows,
    products: productRows,
    purchases: purchaseRows,
    academy: academyRows,
    enrollments: enrollmentRows,
    learningPaths: pathRows,
    lessons: lessonRows,
    lessonProgress: progressRows,
    subscription: subscriptionRows,
    usage: usageRows,
    contracts: contractRows,
    contractVersions: versionRows,
    reviews: reviewRows,
    disputes: disputeRows,
    portfolio: portfolioRows,
    packages: packageRows,
    consent: consentRows,
    waitlist: waitlistRows,
  };
}

/**
 * Permanently delete the caller's account. Deletes the Supabase auth user, which
 * (via the mirror trigger + FK cascades) removes their public data. Append-only
 * audit rows are retained with user_id nulled. Irreversible — the UI confirms.
 */
export async function deleteMyAccount(): Promise<{ ok: boolean }> {
  const u = await requireUser();
  await enforceRateLimit("sensitive", u.id);
  // Log BEFORE deleting (the row is retained; user_id is set null by the cascade).
  await logAudit(u.id, "account_deletion_requested");
  // Erase the user's stored objects — the auth-user delete cascades DB rows but
  // NOT storage objects (#6).
  await removeUserObjects(u.id);
  // Explicitly remove the public.user row so ALL child data cascades, regardless
  // of whether the auth.users→public.user mirror trigger handles DELETE (#6).
  await db.delete(user).where(eq(user.id, u.id));
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(u.id);
  if (error) return { ok: false };
  return { ok: true };
}

export type ConsentState = { cookies: boolean; ai: boolean; marketing: boolean };

export async function getMyConsent(): Promise<ConsentState> {
  const u = await requireUser();
  await enforceRateLimit("read", u.id);
  const row = await db.select().from(consent).where(eq(consent.userId, u.id)).limit(1).then((r) => r[0]);
  return { cookies: row?.cookies ?? false, ai: row?.ai ?? false, marketing: row?.marketing ?? false };
}

export async function setMyConsent(next: ConsentState): Promise<void> {
  const u = await requireUser();
  await enforceRateLimit("write", u.id);
  await ensureUserRow(u); // consent.userId → user.id FK must resolve for new users (#15)
  const value = {
    cookies: !!next.cookies,
    ai: !!next.ai,
    marketing: !!next.marketing,
    updatedAt: new Date(),
  };
  await db
    .insert(consent)
    .values({ userId: u.id, ...value })
    .onConflictDoUpdate({ target: consent.userId, set: value });
  await logAudit(u.id, "consent_updated", value);
}
