/**
 * CLIENT HQ™ — data + generators for the client-facing operations suite:
 * Creative Concierge, AI Project Builder, Content Vault, Deliverable Tracker,
 * Marketing Advisor, Content Performance.
 *
 * Static/derived demo data. Swap generators for a model and arrays for real
 * tables/feeds when ready.
 */

import type { Tile } from "./grid-data";
import type { IconName } from "@/components/dashboard/icons";

export const money = (n: number) => `€${n.toLocaleString()}`;

/* -------------------------------------------------------------------------- */
/*  1. Creative Concierge                                                      */
/* -------------------------------------------------------------------------- */

export const CONCIERGE_EXAMPLES = [
  "We are opening a luxury restaurant and need launch content.",
  "We need monthly social content for our boutique hotel.",
  "Rebranding our real-estate agency — full visual refresh.",
];

export type ConciergePlan = {
  headline: string;
  brief: string;
  deliverables: { label: string; qty: string }[];
  budgetLow: number;
  budgetHigh: number;
  creatorIds: string[];
};

type Kind = "restaurant" | "hotel" | "realestate" | "brand" | "generic";

function detectKind(p: string): Kind {
  const s = p.toLowerCase();
  if (/(restaurant|cafe|coffee|bar|dining|food|menu)/.test(s)) return "restaurant";
  if (/(hotel|resort|hospitality|suite|stay)/.test(s)) return "hotel";
  if (/(real-?estate|realty|listing|property|home|villa)/.test(s)) return "realestate";
  if (/(brand|product|launch|campaign|retail|store)/.test(s)) return "brand";
  return "generic";
}

const PLANS: Record<Kind, Omit<ConciergePlan, "brief">> = {
  restaurant: {
    headline: "Restaurant launch package",
    deliverables: [
      { label: "Food & dish photography", qty: "30 photos" },
      { label: "Interior & ambiance set", qty: "20 photos" },
      { label: "Launch teaser film", qty: "1 × 45s" },
      { label: "Social reels", qty: "6 reels" },
    ],
    budgetLow: 4500,
    budgetHigh: 8000,
    creatorIds: ["sara", "maya", "john"],
  },
  hotel: {
    headline: "Hospitality content engine",
    deliverables: [
      { label: "Suite & amenity photography", qty: "40 photos" },
      { label: "Property hero film", qty: "1 × 90s" },
      { label: "Aerial / drone coverage", qty: "1 set" },
      { label: "Monthly social reels", qty: "10 reels" },
    ],
    budgetLow: 9000,
    budgetHigh: 16000,
    creatorIds: ["theo", "maya", "john"],
  },
  realestate: {
    headline: "Listing refresh & retainer",
    deliverables: [
      { label: "Listing photography", qty: "40 photos" },
      { label: "Twilight exterior set", qty: "8 photos" },
      { label: "Walkthrough film", qty: "1 × 60s" },
      { label: "Aerial coverage", qty: "1 set" },
    ],
    budgetLow: 5000,
    budgetHigh: 9500,
    creatorIds: ["john", "theo", "leo"],
  },
  brand: {
    headline: "Brand campaign sprint",
    deliverables: [
      { label: "Brand film", qty: "1 × 60s" },
      { label: "Campaign stills", qty: "25 photos" },
      { label: "Social cut-downs", qty: "8 reels" },
      { label: "Content library", qty: "1 quarter" },
    ],
    budgetLow: 6000,
    budgetHigh: 12000,
    creatorIds: ["maya", "sara", "leo"],
  },
  generic: {
    headline: "Custom content plan",
    deliverables: [
      { label: "Photography", qty: "30 photos" },
      { label: "Short film", qty: "1 × 60s" },
      { label: "Social reels", qty: "6 reels" },
    ],
    budgetLow: 4000,
    budgetHigh: 8000,
    creatorIds: ["john", "maya", "theo"],
  },
};

export function conciergePlan(prompt: string): ConciergePlan {
  const kind = detectKind(prompt);
  const base = PLANS[kind];
  const subject = prompt.trim() || "your project";
  return {
    ...base,
    brief: `Based on "${subject.slice(0, 90)}", GRID assembled a ${base.headline.toLowerCase()}: a focused production to launch with a cohesive, premium visual identity — protected by Grid, delivered on a clear timeline.`,
  };
}

/* -------------------------------------------------------------------------- */
/*  2. AI Project Builder                                                      */
/* -------------------------------------------------------------------------- */

export type Deliverable = { id: string; label: string; qty: number; unit: number; icon: IconName };
export type Goal = { id: string; label: string; desc: string };

export const GOALS: Goal[] = [
  { id: "bookings", label: "Increase bookings", desc: "Drive reservations & enquiries" },
  { id: "launch", label: "Launch a new space", desc: "Open with a bang" },
  { id: "social", label: "Grow social presence", desc: "Consistent, on-brand content" },
  { id: "rebrand", label: "Refresh our brand", desc: "A full visual reset" },
];

const BUILDS: Record<string, Deliverable[]> = {
  bookings: [
    { id: "b1", label: "Photos", qty: 50, unit: 60, icon: "camera" },
    { id: "b2", label: "Reels", qty: 10, unit: 220, icon: "video" },
    { id: "b3", label: "Hero film", qty: 1, unit: 2400, icon: "play" },
    { id: "b4", label: "Drone content", qty: 1, unit: 900, icon: "drone" },
    { id: "b5", label: "Interview clips", qty: 4, unit: 180, icon: "comment" },
  ],
  launch: [
    { id: "l1", label: "Photos", qty: 40, unit: 60, icon: "camera" },
    { id: "l2", label: "Launch film", qty: 1, unit: 2800, icon: "play" },
    { id: "l3", label: "Teaser reels", qty: 8, unit: 220, icon: "video" },
    { id: "l4", label: "Drone content", qty: 1, unit: 900, icon: "drone" },
  ],
  social: [
    { id: "s1", label: "Photos", qty: 30, unit: 55, icon: "camera" },
    { id: "s2", label: "Reels", qty: 16, unit: 200, icon: "video" },
    { id: "s3", label: "BTS clips", qty: 6, unit: 120, icon: "comment" },
  ],
  rebrand: [
    { id: "r1", label: "Brand film", qty: 1, unit: 3200, icon: "play" },
    { id: "r2", label: "Campaign stills", qty: 35, unit: 70, icon: "camera" },
    { id: "r3", label: "Social cut-downs", qty: 10, unit: 200, icon: "video" },
    { id: "r4", label: "Aerial set", qty: 1, unit: 900, icon: "drone" },
  ],
};

export function buildFor(goalId: string): Deliverable[] {
  return (BUILDS[goalId] ?? BUILDS.bookings).map((d) => ({ ...d }));
}

/* -------------------------------------------------------------------------- */
/*  3. Content Vault                                                           */
/* -------------------------------------------------------------------------- */

export type AssetType = "Photo" | "Video" | "Reel" | "Logo" | "Brand" | "Contract" | "Invoice" | "Project";

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  project: string;
  date: string;
  size: string;
  tile: Tile;
};

export const ASSET_FILTERS: AssetType[] = ["Photo", "Video", "Reel", "Logo", "Brand", "Contract", "Invoice", "Project"];

const T = (from: string, to: string): Tile => ({ title: "", from, to });

export const ASSETS: Asset[] = [
  { id: "a1", name: "Bel Air twilight hero", type: "Photo", project: "Signature Estate", date: "May 30", size: "24 MB", tile: T("#1b2a4a", "#0a0c12") },
  { id: "a2", name: "Resort aerial reel", type: "Reel", project: "Resort Aerials", date: "May 30", size: "61 MB", tile: T("#163a3a", "#08100f") },
  { id: "a3", name: "Suite walkthrough", type: "Video", project: "Suite Campaign", date: "May 28", size: "180 MB", tile: T("#0c3b5c", "#0a0f14") },
  { id: "a4", name: "Penthouse editorial set", type: "Photo", project: "Penthouse Editorial", date: "May 26", size: "32 MB", tile: T("#3a3320", "#0f0d08") },
  { id: "a5", name: "Azure logo pack", type: "Logo", project: "Brand assets", date: "May 20", size: "4 MB", tile: T("#1f7fae", "#0a0f14") },
  { id: "a6", name: "Brand guidelines", type: "Brand", project: "Brand assets", date: "May 18", size: "12 MB", tile: T("#9a7fe0", "#100a1a") },
  { id: "a7", name: "GR-2049 contract", type: "Contract", project: "Signature Estate", date: "May 24", size: "0.4 MB", tile: T("#243a2c", "#080f0b") },
  { id: "a8", name: "Invoice — May", type: "Invoice", project: "Finance", date: "May 31", size: "0.2 MB", tile: T("#3a2a1a", "#0f0a06") },
  { id: "a9", name: "Hillside Modern film", type: "Video", project: "Hillside Modern", date: "May 12", size: "210 MB", tile: T("#22384a", "#080e12") },
  { id: "a10", name: "Marina golden hour", type: "Photo", project: "Social", date: "May 8", size: "20 MB", tile: T("#1f3350", "#090c12") },
  { id: "a11", name: "Launch teaser reel", type: "Reel", project: "Spring Launch", date: "May 6", size: "48 MB", tile: T("#3a2438", "#0d0a10") },
  { id: "a12", name: "Winter feature project", type: "Project", project: "Vogue Living", date: "Apr 30", size: "—", tile: T("#2a2233", "#0c0a10") },
];

export function isMediaAsset(t: AssetType): boolean {
  return t === "Photo" || t === "Video" || t === "Reel";
}

/* -------------------------------------------------------------------------- */
/*  4. Deliverable Tracker                                                     */
/* -------------------------------------------------------------------------- */

export const TRACK_STAGES = ["Booked", "Scheduled", "Production", "Editing", "Review", "Delivered"] as const;

export type TrackedProject = {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  stage: number; // index into TRACK_STAGES
  updated: string;
  eta: string;
  value: number;
  tile: Tile;
};

export const TRACKED: TrackedProject[] = [
  { id: "tp1", title: "Signature Estate — Bel Air", creator: "John Hope", creatorId: "john", stage: 4, updated: "2h ago", eta: "Jun 4", value: 7150, tile: T("#1b2a4a", "#0a0c12") },
  { id: "tp2", title: "Suite Campaign — Miami", creator: "Maya Lindqvist", creatorId: "maya", stage: 2, updated: "Today", eta: "Jun 12", value: 11000, tile: T("#0c3b5c", "#0a0f14") },
  { id: "tp3", title: "Resort Aerials — Palm Jumeirah", creator: "Theo Vance", creatorId: "theo", stage: 5, updated: "Yesterday", eta: "Delivered", value: 5500, tile: T("#163a3a", "#08100f") },
  { id: "tp4", title: "Penthouse Editorial — NYC", creator: "Sara Okonkwo", creatorId: "sara", stage: 1, updated: "Today", eta: "Jun 18", value: 6000, tile: T("#3a3320", "#0f0d08") },
];

/* -------------------------------------------------------------------------- */
/*  5. Marketing Advisor                                                       */
/* -------------------------------------------------------------------------- */

export type Insight = { kind: "gap" | "opportunity" | "strength" | "risk"; title: string; detail: string };

export const MARKETING = {
  brandHealth: 72,
  scores: [
    { label: "Brand consistency", value: 68 },
    { label: "Posting frequency", value: 54 },
    { label: "Content quality", value: 88 },
    { label: "Engagement", value: 61 },
  ],
  channels: [
    { label: "Instagram", value: "2.1 posts / week", sub: "below category avg of 4.0", tone: "gold" as const },
    { label: "Website", value: "Last refresh 7 mo ago", sub: "hero imagery is dated", tone: "red" as const },
    { label: "Google Business", value: "32 photos", sub: "competitors avg 70+", tone: "gold" as const },
  ],
  competitors: [
    { name: "Your brand", score: 72, you: true },
    { name: "Maison Rivage", score: 84, you: false },
    { name: "Hôtel Lumière", score: 79, you: false },
    { name: "The Arbor", score: 65, you: false },
  ],
  insights: [
    { kind: "gap", title: "No video on the website", detail: "A hero film could lift booking-page conversion by an estimated 18%." },
    { kind: "opportunity", title: "Reels under-used", detail: "You post 0.5 reels/week vs 3 for top competitors — your biggest reach gap." },
    { kind: "risk", title: "Inconsistent grade", detail: "Recent posts mix warm and cool grades — a single LUT would tighten the feed." },
    { kind: "strength", title: "Strong photography", detail: "Your stills score 88 — lean into more of the same to compound trust." },
  ] as Insight[],
};

/* -------------------------------------------------------------------------- */
/*  8. Content Performance                                                     */
/* -------------------------------------------------------------------------- */

export const PERFORMANCE = {
  totals: [
    { label: "Views", value: "412K", delta: "+24%" },
    { label: "Reach", value: "286K", delta: "+18%" },
    { label: "Engagement", value: "5.8%", delta: "+1.2pt" },
    { label: "Saves", value: "9.4K", delta: "+31%" },
    { label: "Shares", value: "3.1K", delta: "+12%" },
    { label: "Clicks", value: "14.2K", delta: "+27%" },
  ],
  trend: [42, 48, 45, 61, 58, 72, 70, 84, 79, 96, 92, 110],
  top: {
    reel: { title: "Resort aerial reel", metric: "182K views", tile: T("#163a3a", "#08100f") },
    photo: { title: "Bel Air twilight hero", metric: "9.4K saves", tile: T("#1b2a4a", "#0a0c12") },
    campaign: { title: "Spring Launch", metric: "3.4× ROI", tile: T("#3a2438", "#0d0a10") },
  },
  leaderboard: [
    { rank: 1, title: "Resort aerial reel", type: "Reel", views: "182K", eng: "7.9%", tile: T("#163a3a", "#08100f") },
    { rank: 2, title: "Suite walkthrough", type: "Video", views: "96K", eng: "6.4%", tile: T("#0c3b5c", "#0a0f14") },
    { rank: 3, title: "Bel Air twilight hero", type: "Photo", views: "74K", eng: "6.1%", tile: T("#1b2a4a", "#0a0c12") },
    { rank: 4, title: "Marina golden hour", type: "Photo", views: "51K", eng: "5.2%", tile: T("#1f3350", "#090c12") },
    { rank: 5, title: "Launch teaser reel", type: "Reel", views: "44K", eng: "5.0%", tile: T("#3a2438", "#0d0a10") },
  ],
};
