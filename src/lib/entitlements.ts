import "server-only";

/**
 * Server-side entitlements — the single source of truth for feature access.
 *
 * A user's plan lives in the `subscription` table (written by the Stripe webhook
 * in Phase 3; defaults to "free"). `canAccessFeature` is enforced on the SERVER
 * (protected routes/actions) AND mirrored on the client (nav hiding). During the
 * demo (DEMO_MODE) everything is unlocked; at launch this enforces the tier.
 *
 * Integration point: POST /api/webhooks/stripe → upsert subscription → nav
 * re-renders from entitlements on next load. (Phase 3.)
 */
import { eq } from "drizzle-orm";
import { db } from "./db";
import { subscription } from "./db/schema";
import { DEMO_MODE } from "./client/config";
import { FEATURE_PLAN, planRank, type PlanId } from "./plans";
import { FEATURE_MIN_PLAN, clientPlanRank, type ClientPlanId } from "./client/config";

export type Entitlement = { plan: string; status: string };

export async function getEntitlement(userId: string): Promise<Entitlement> {
  try {
    const [row] = await db
      .select({ plan: subscription.plan, status: subscription.status })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);
    return row ?? { plan: "free", status: "active" };
  } catch {
    return { plan: "free", status: "active" };
  }
}

/**
 * Whether `userId` may use feature `key`. Free/ungated features → always true.
 * Creator features map via plans.ts; client features via client/config.ts.
 */
export async function canAccessFeature(userId: string, key: string): Promise<boolean> {
  if (DEMO_MODE) return true; // demo: everything unlocked
  const { plan } = await getEntitlement(userId);

  const creatorNeed = (FEATURE_PLAN as Record<string, PlanId>)[key];
  if (creatorNeed) return planRank(plan as PlanId) >= planRank(creatorNeed);

  const clientNeed = (FEATURE_MIN_PLAN as Record<string, ClientPlanId>)[key];
  if (clientNeed) return clientPlanRank(plan as ClientPlanId) >= clientPlanRank(clientNeed);

  return true; // not a gated feature
}
