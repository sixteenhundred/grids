/**
 * Subscription plans — the single source of truth for Grid's freemium model.
 *
 * The CORE platform is free: join, connect, book, manage payments (escrow),
 * manage contracts and deliver files. Paid tiers unlock the "Create & earn"
 * suite plus Radar/Trends and bigger transfers, storage and protection.
 *
 * Plain module (no "use client" / "use server") so it can be imported from the
 * landing (server), the dashboard nav (client) and the gate alike.
 */

import type { IconName } from "@/components/dashboard/icons";

export type PlanId = "free" | "silver" | "diamond" | "platinum";

/** Ascending power order — index doubles as the access rank. */
export const PLAN_ORDER: PlanId[] = ["free", "silver", "diamond", "platinum"];

export const planRank = (p: PlanId) => PLAN_ORDER.indexOf(p);

/** What every account gets for free, forever. */
export const FREE_INCLUDES = [
  "Join, connect & message",
  "Book talent & get booked",
  "Grid Escrow payments",
  "Digital contracts & e-sign",
  "File delivery & tracking",
  "Two-way reviews",
];

/**
 * Which plan each gated dashboard feature belongs to. Anything not listed here
 * is free. Keys match the feature catalog / route segment in lib/features.ts.
 */
export const FEATURE_PLAN: Record<string, PlanId> = {
  // Silver — discovery + growth toolkit
  radar: "silver",
  trends: "silver",
  collab: "silver",
  "first-in-line": "silver",
  planner: "silver",
  vault: "silver",
  campaign: "silver",
  // Diamond — the AI create-&-earn suite
  sales: "diamond",
  crm: "diamond",
  pricing: "diamond",
  match: "diamond",
  studio: "diamond",
  // Platinum — monetisation + perks
  shop: "platinum",
  academy: "platinum",
};

/** The plan a feature requires (free when ungated). */
export const featurePlan = (key: string | null): PlanId =>
  (key && FEATURE_PLAN[key]) || "free";

/** Does `plan` include access to feature `key`? */
export const planIncludesFeature = (plan: PlanId, key: string | null) =>
  planRank(plan) >= planRank(featurePlan(key));

/* -------------------------------------------------------------------------- */
/*  Tiers (for display)                                                        */
/* -------------------------------------------------------------------------- */

export type Tier = {
  id: Exclude<PlanId, "free">;
  name: string;
  gem: IconName;
  price: number;
  blurb: string;
  inheritsFrom: string; // "Everything free, plus" etc.
  features: string[]; // headline unlocks
  transfer: string;
  storage: string;
  protection: string;
  highlight?: boolean;
  /** Tailwind accent for this tier. */
  accent: string;
  ring: string;
  glow: string;
};

export const TIERS: Tier[] = [
  {
    id: "silver",
    name: "Silver",
    gem: "star",
    price: 19.99,
    blurb: "Get discovered and grow — radar, trends and your growth toolkit.",
    inheritsFrom: "Everything in Free, plus",
    features: [
      "Radar — urgent & nearby work",
      "Trends — market intelligence",
      "Collab — crew collaboration",
      "First In Line — AI proposals",
      "Content Planner",
      "Brand Vault",
      "Campaign concepts",
    ],
    transfer: "5 GB transfers",
    storage: "100 GB account storage",
    protection: "Enhanced protection",
    accent: "text-slate-200",
    ring: "border-white/15",
    glow: "bg-white/10",
  },
  {
    id: "diamond",
    name: "Diamond",
    gem: "sparkles",
    price: 45.99,
    blurb: "The full AI create-&-earn suite that scales your business.",
    inheritsFrom: "Everything in Silver, plus",
    features: [
      "AI Sales assistant",
      "Creative CRM pipeline",
      "Price Intelligence™",
      "Match Score",
      "AI Studio",
    ],
    transfer: "5 GB transfers",
    storage: "500 GB account storage",
    protection: "Priority protection",
    highlight: true,
    accent: "text-aerial-cyan",
    ring: "border-grid-blue/40",
    glow: "bg-grid-blue/25",
  },
  {
    id: "platinum",
    name: "Platinum",
    gem: "command",
    price: 99.99,
    blurb: "Monetise everything, lower fees and white-glove support.",
    inheritsFrom: "Everything in Diamond, plus",
    features: [
      "Shop storefront",
      "Academy — sell courses",
      "Lower service fee",
      "Priority customer service",
    ],
    transfer: "15 GB transfers",
    storage: "2 TB account storage",
    protection: "Maximum protection",
    accent: "text-fuchsia-300",
    ring: "border-fuchsia-400/40",
    glow: "bg-fuchsia-500/25",
  },
];

export const tierById = (id: PlanId): Tier | undefined =>
  TIERS.find((t) => t.id === id);

export const planLabel = (id: PlanId): string =>
  id === "free" ? "Free" : tierById(id)?.name ?? "Free";

export const fmtPrice = (n: number) => `$${n.toFixed(2)}`;

/* -------------------------------------------------------------------------- */
/*  Gated feature catalog (for the "Try features" grid + gate copy)            */
/* -------------------------------------------------------------------------- */

export type GatedFeature = {
  key: string;
  label: string;
  icon: IconName;
  route: string;
  plan: Exclude<PlanId, "free">;
  blurb: string;
};

export const GATED_FEATURES: GatedFeature[] = [
  { key: "radar", label: "Radar", icon: "map", route: "/dashboard/radar", plan: "silver", blurb: "Urgent & nearby opportunities" },
  { key: "trends", label: "Trends", icon: "trending", route: "/dashboard/trends", plan: "silver", blurb: "Market trend intelligence" },
  { key: "collab", label: "Collab", icon: "users", route: "/dashboard/collab", plan: "silver", blurb: "Crew collaboration" },
  { key: "first-in-line", label: "First In Line", icon: "target", route: "/dashboard/first-in-line", plan: "silver", blurb: "Opportunity intel + AI proposals" },
  { key: "planner", label: "Content Planner", icon: "calendar", route: "/dashboard/planner", plan: "silver", blurb: "Drag-and-drop content calendar" },
  { key: "vault", label: "Brand Vault", icon: "grid", route: "/dashboard/vault", plan: "silver", blurb: "Brand asset library" },
  { key: "campaign", label: "Campaign", icon: "play", route: "/dashboard/campaign", plan: "silver", blurb: "AI marketing campaign concepts" },
  { key: "sales", label: "AI Sales", icon: "send", route: "/dashboard/sales", plan: "diamond", blurb: "Sales assistant & missions" },
  { key: "crm", label: "Creative CRM", icon: "kanban", route: "/dashboard/crm", plan: "diamond", blurb: "Visual pipeline of clients" },
  { key: "pricing", label: "Price Intel", icon: "chart", route: "/dashboard/pricing", plan: "diamond", blurb: "Pricing & earnings projections" },
  { key: "match", label: "Match Score", icon: "star", route: "/dashboard/match", plan: "diamond", blurb: "Animated fit-score rings" },
  { key: "studio", label: "AI Studio", icon: "sparkles", route: "/dashboard/studio", plan: "diamond", blurb: "Interactive AI creative studio" },
  { key: "shop", label: "Shop", icon: "shop", route: "/dashboard/shop", plan: "platinum", blurb: "Your digital storefront" },
  { key: "academy", label: "Academy", icon: "school", route: "/dashboard/academy", plan: "platinum", blurb: "Sell courses & lessons" },
];

/** Trial previews granted per locked feature before the upgrade wall. */
export const TRIAL_CREDITS = 2;

/* -------------------------------------------------------------------------- */
/*  Motivational quotes — rotate on the subscribe page                         */
/* -------------------------------------------------------------------------- */

export const QUOTES = [
  "Create bigger. Move faster. Earn more.",
  "The best investment you'll ever make is in the person building your future.",
  "Build without limits.",
  "Every great creative career starts with a decision: stay where you are, or build what's next.",
  "The difference between surviving and scaling is often a single decision.",
  "Built for the creators shaping tomorrow.",
  "The world's top creators don't work harder. They work with better systems.",
  "Less time managing chaos. More time creating what matters.",
];
