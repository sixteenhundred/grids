/**
 * Client subscription — demo config + plan-based feature gating.
 *
 * DEMO MODE: everything is accessible so the full Free → Agency → Enterprise
 * experience can be demoed. Flip DEMO_MODE to false (later) and canAccessFeature
 * will start enforcing plan tiers; FeatureGate then shows UpgradePrompt instead
 * of the feature. No payment logic is wired — these are the integration points.
 */

import type { ClientPlanId } from "@/lib/client-plans";

export { type ClientPlanId } from "@/lib/client-plans";

/** Master switch. true → all routes/actions open, demo states shown. */
export const DEMO_MODE = true;

export const CLIENT_PLAN_ORDER: ClientPlanId[] = ["free", "agency", "enterprise"];
export const clientPlanRank = (p: ClientPlanId) => CLIENT_PLAN_ORDER.indexOf(p);

/** Gateable client features. `core` is always free. */
export type ClientFeature =
  | "core"
  | "company-profile"
  | "jobs"
  | "projects"
  | "files"
  | "marketing-advisor"
  | "performance"
  | "creative-concierge"
  | "increased-storage"
  | "departments"
  | "tasks"
  | "team-workload"
  | "asset-library"
  | "internal-messages"
  | "approval-workflows"
  | "massive-storage"
  | "enhanced-job-visibility";

/** The minimum plan each feature requires once paywalls are switched on. */
export const FEATURE_MIN_PLAN: Record<ClientFeature, ClientPlanId> = {
  core: "free",
  "company-profile": "free",
  jobs: "free",
  projects: "free",
  files: "free",
  "marketing-advisor": "agency",
  performance: "agency",
  "creative-concierge": "agency",
  "increased-storage": "agency",
  departments: "enterprise",
  tasks: "enterprise",
  "team-workload": "enterprise",
  "asset-library": "enterprise",
  "internal-messages": "enterprise",
  "approval-workflows": "enterprise",
  "massive-storage": "enterprise",
  "enhanced-job-visibility": "enterprise",
};

/** Convenience: features grouped by the plan that introduces them. */
export const PLAN_FEATURES: Record<ClientPlanId, ClientFeature[]> = {
  free: (Object.keys(FEATURE_MIN_PLAN) as ClientFeature[]).filter((f) => FEATURE_MIN_PLAN[f] === "free"),
  agency: (Object.keys(FEATURE_MIN_PLAN) as ClientFeature[]).filter((f) => FEATURE_MIN_PLAN[f] === "agency"),
  enterprise: (Object.keys(FEATURE_MIN_PLAN) as ClientFeature[]).filter((f) => FEATURE_MIN_PLAN[f] === "enterprise"),
};

/**
 * The single gate used everywhere. In demo mode it always returns true.
 * In launch mode it compares the active plan against the feature's tier.
 */
export function canAccessFeature(plan: ClientPlanId, feature: ClientFeature): boolean {
  if (DEMO_MODE) return true;
  return clientPlanRank(plan) >= clientPlanRank(FEATURE_MIN_PLAN[feature]);
}

/** Plan label shown on a feature when it sits above Free ("Agency"/"Enterprise"). */
export function featureBadge(feature: ClientFeature): "Agency" | "Enterprise" | null {
  const p = FEATURE_MIN_PLAN[feature];
  if (p === "agency") return "Agency";
  if (p === "enterprise") return "Enterprise";
  return null;
}

export const planName = (p: ClientPlanId) => ({ free: "Free", agency: "Agency", enterprise: "Enterprise" }[p]);

/* -------------------------------------------------------------------------- */
/*  localStorage keys (demo persistence)                                       */
/* -------------------------------------------------------------------------- */

export const CLIENT_KEYS = {
  plan: "grid:client:plan",
  profile: "grid:client:profile",
  onboarding: "grid:client:onboarding",
  jobs: "grid:client:jobs",
  projects: "grid:client:projects",
  files: "grid:client:files",
  departments: "grid:client:departments",
  tasks: "grid:client:tasks",
  channels: "grid:client:channels",
  approvals: "grid:client:approvals",
  assets: "grid:client:assets",
  concierge: "grid:client:concierge",
  advisorSaved: "grid:client:advisorSaved",
} as const;
