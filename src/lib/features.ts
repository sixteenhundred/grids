/**
 * Feature catalog — the single source of truth for everything the admin panel
 * can switch on and off. Plain module (no "use server") so both the client
 * toggles and the server actions can import it.
 *
 * Each feature `key` matches its dashboard route segment (`/dashboard/<key>`),
 * which lets the sidebar hide a feature simply by checking its flag.
 */

export type FeatureCategory =
  | "Marketplace"
  | "Discover"
  | "Create & Earn"
  | "Client HQ";

export type FeatureDef = {
  key: string;
  label: string;
  desc: string;
  category: FeatureCategory;
  /** Default state when no admin override is stored. */
  defaultOn: boolean;
};

export const FEATURES: FeatureDef[] = [
  // --- Marketplace --------------------------------------------------------
  { key: "operation", label: "My Operation HQ", desc: "Creator command center & workspace", category: "Marketplace", defaultOn: true },
  { key: "projects", label: "Projects", desc: "Active projects + delivery feed", category: "Marketplace", defaultOn: true },
  { key: "contracts", label: "Contracts", desc: "Contracts with version history", category: "Marketplace", defaultOn: true },
  { key: "finance", label: "Finance", desc: "Escrow ledger & withdrawals", category: "Marketplace", defaultOn: true },
  { key: "transfer", label: "File Transfer", desc: "Escrow-gated file delivery", category: "Marketplace", defaultOn: true },

  // --- Discover -----------------------------------------------------------
  { key: "radar", label: "Radar", desc: "Urgent & nearby opportunities", category: "Discover", defaultOn: true },
  { key: "community", label: "Community", desc: "Posts, likes & discussion", category: "Discover", defaultOn: true },
  { key: "saved", label: "Saved", desc: "Bookmarked creatives & jobs", category: "Discover", defaultOn: true },
  { key: "news", label: "News", desc: "Industry articles", category: "Discover", defaultOn: true },
  { key: "trends", label: "Trends", desc: "Market trend detail pages", category: "Discover", defaultOn: true },

  // --- Create & Earn (creator) -------------------------------------------
  { key: "campaign", label: "Campaign", desc: "AI marketing campaign concepts", category: "Create & Earn", defaultOn: true },
  { key: "first-in-line", label: "First In Line", desc: "Opportunity intel + AI proposals", category: "Create & Earn", defaultOn: true },
  { key: "vault", label: "Brand Vault", desc: "Brand asset library", category: "Create & Earn", defaultOn: true },
  { key: "planner", label: "Content Planner", desc: "Drag-and-drop content calendar", category: "Create & Earn", defaultOn: true },
  { key: "sales", label: "AI Sales", desc: "Sales assistant & missions", category: "Create & Earn", defaultOn: true },
  { key: "crm", label: "Creative CRM", desc: "Drag pipeline of clients", category: "Create & Earn", defaultOn: true },
  { key: "pricing", label: "Price Intel", desc: "Pricing sliders & earnings graph", category: "Create & Earn", defaultOn: true },
  { key: "match", label: "Match Score", desc: "Animated fit-score rings", category: "Create & Earn", defaultOn: true },
  { key: "studio", label: "AI Studio", desc: "Interactive AI creative studio", category: "Create & Earn", defaultOn: true },
  { key: "shop", label: "Shop", desc: "Digital storefront (database-backed)", category: "Create & Earn", defaultOn: true },
  { key: "academy", label: "Academy", desc: "Courses & lessons (database-backed)", category: "Create & Earn", defaultOn: true },
  { key: "collab", label: "Collab", desc: "Crew collaboration", category: "Create & Earn", defaultOn: true },

  // --- Client HQ (client) -------------------------------------------------
  { key: "concierge", label: "Creative Concierge", desc: "AI talent concierge", category: "Client HQ", defaultOn: true },
  { key: "builder", label: "Project Builder", desc: "AI project scoping", category: "Client HQ", defaultOn: true },
  { key: "content-vault", label: "Content Vault", desc: "Client asset library", category: "Client HQ", defaultOn: true },
  { key: "tracker", label: "Deliverable Tracker", desc: "Track deliverables", category: "Client HQ", defaultOn: true },
  { key: "advisor", label: "Marketing Advisor", desc: "AI marketing guidance", category: "Client HQ", defaultOn: true },
  { key: "performance", label: "Content Performance", desc: "Performance analytics", category: "Client HQ", defaultOn: true },
];

export const FEATURE_KEYS = new Set(FEATURES.map((f) => f.key));

/** All defaults as a flat map, used as the base layer before admin overrides. */
export const FEATURE_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  FEATURES.map((f) => [f.key, f.defaultOn]),
);

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  "Marketplace",
  "Discover",
  "Create & Earn",
  "Client HQ",
];

/** Map a dashboard href to its feature key, or null if it isn't gated. */
export function featureKeyForHref(href: string): string | null {
  const m = href.match(/^\/dashboard\/([^/]+)/);
  const key = m?.[1];
  return key && FEATURE_KEYS.has(key) ? key : null;
}
