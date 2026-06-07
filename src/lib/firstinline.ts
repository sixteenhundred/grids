/**
 * FIRST IN LINE™ — opportunity intelligence.
 *
 * AI-surfaced businesses (new openings, launches, events) that creatives can
 * reach before competitors. Demo data is static; the proposal generator turns
 * an opportunity into a personalized, editable proposal. Swap the seed for a
 * real discovery pipeline + the generator for a model call when ready.
 */

export type OppCategory = "Restaurant" | "Hotel" | "Retail" | "Event" | "Brand" | "Company";

export type OppStatus = "first" | "warm" | "saturated";

export type Opportunity = {
  id: string;
  name: string;
  category: OppCategory;
  location: string;
  website: string;
  instagram: string;
  email: string;
  contact: string | null;
  detected: string; // human date
  value: number; // potential project value (€)
  score: number; // 0–100 opportunity score
  contacted: number; // creators who've reached out
};

export function statusOf(contacted: number): OppStatus {
  if (contacted === 0) return "first";
  if (contacted <= 10) return "warm";
  return "saturated";
}

export const STATUS_META: Record<OppStatus, { label: string; dot: string; tone: "escrow" | "gold" | "red" }> = {
  first: { label: "First In Line", dot: "🟢", tone: "escrow" },
  warm: { label: "Warm", dot: "🟡", tone: "gold" },
  saturated: { label: "Saturated", dot: "🔴", tone: "red" },
};

export const OPP_CATEGORIES: OppCategory[] = ["Restaurant", "Hotel", "Retail", "Event", "Brand", "Company"];

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "op1",
    name: "Solène",
    category: "Restaurant",
    location: "West Hollywood, CA",
    website: "solene.la",
    instagram: "@solene.la",
    email: "hello@solene.la",
    contact: "Mara Devlin, Owner",
    detected: "Today, 08:14",
    value: 6500,
    score: 94,
    contacted: 0,
  },
  {
    id: "op2",
    name: "The Aubrey Hotel",
    category: "Hotel",
    location: "Santa Monica, CA",
    website: "aubreyhotel.com",
    instagram: "@aubreyhotel",
    email: "marketing@aubreyhotel.com",
    contact: "Liam Foster, Brand Director",
    detected: "Today, 06:50",
    value: 14000,
    score: 91,
    contacted: 0,
  },
  {
    id: "op3",
    name: "Maison Veil",
    category: "Retail",
    location: "Beverly Hills, CA",
    website: "maisonveil.com",
    instagram: "@maisonveil",
    email: "press@maisonveil.com",
    contact: null,
    detected: "Yesterday",
    value: 8200,
    score: 88,
    contacted: 3,
  },
  {
    id: "op4",
    name: "Lumen Festival",
    category: "Event",
    location: "Downtown LA",
    website: "lumenfest.com",
    instagram: "@lumenfest",
    email: "team@lumenfest.com",
    contact: "Priya Raman, Producer",
    detected: "Yesterday",
    value: 11000,
    score: 86,
    contacted: 6,
  },
  {
    id: "op5",
    name: "Atlas & Oak",
    category: "Brand",
    location: "Culver City, CA",
    website: "atlasandoak.com",
    instagram: "@atlasandoak",
    email: "hi@atlasandoak.com",
    contact: "Devon Hart, Founder",
    detected: "2 days ago",
    value: 7400,
    score: 83,
    contacted: 0,
  },
  {
    id: "op6",
    name: "Northpoint Capital",
    category: "Company",
    location: "Century City, CA",
    website: "northpointcap.com",
    instagram: "@northpointcap",
    email: "comms@northpointcap.com",
    contact: "Helena Cho, Head of Comms",
    detected: "2 days ago",
    value: 9500,
    score: 79,
    contacted: 4,
  },
  {
    id: "op7",
    name: " Portola Coffee Bar",
    category: "Restaurant",
    location: "Silver Lake, CA",
    website: "portola.coffee",
    instagram: "@portola.coffee",
    email: "owner@portola.coffee",
    contact: null,
    detected: "3 days ago",
    value: 3800,
    score: 72,
    contacted: 12,
  },
  {
    id: "op8",
    name: "Vela Swim",
    category: "Brand",
    location: "Venice, CA",
    website: "velaswim.com",
    instagram: "@velaswim",
    email: "studio@velaswim.com",
    contact: "Camille Roy, Creative Lead",
    detected: "3 days ago",
    value: 6900,
    score: 81,
    contacted: 1,
  },
];

/* -------------------------------------------------------------------------- */
/*  Proposal generation                                                        */
/* -------------------------------------------------------------------------- */

/** The "analysis" steps GRID AI runs before writing the proposal. */
export const ANALYSIS_STEPS = [
  "Scanning website & brand identity",
  "Reading Instagram & content quality",
  "Benchmarking against category leaders",
  "Drafting a personalized proposal",
];

const ANGLE: Record<OppCategory, string> = {
  Restaurant: "appetite-driving food, interior and ambiance photography plus a short launch film for socials",
  Hotel: "a cinematic property film, suite and amenity stills, and aerial coverage for booking pages and OTAs",
  Retail: "editorial product and in-store photography with a launch reel to drive foot traffic and online sales",
  Event: "full event coverage — highlight film, social cut-downs and same-day stills for press",
  Brand: "a brand film, campaign stills and a content library sized for paid social and the website",
  Company: "executive and culture photography plus a brand film for the site, recruiting and investor decks",
};

/** Build a personalized, editable proposal for an opportunity. */
export function generateProposal(opp: Opportunity, creatorName = "John Hope"): string {
  const first = opp.name;
  const fee = opp.value;
  const deposit = Math.round(fee * 0.5);
  const contactLine = opp.contact ? opp.contact.split(",")[0] : "the team";

  return [
    `PROPOSAL — ${first}`,
    `Prepared for ${contactLine} · ${opp.location}`,
    ``,
    `Hi ${contactLine},`,
    ``,
    `Congratulations on ${first}. I came across you early — before the rush — and I'd love to help you launch with visuals that match the ambition of the brand.`,
    ``,
    `WHAT I NOTICED`,
    `• Your site (${opp.website}) and Instagram (${opp.instagram}) set a strong tone, but there's room for a cohesive, high-end visual library.`,
    `• As a ${opp.category.toLowerCase()} in ${opp.location.split(",")[0]}, first impressions online are doing the heavy lifting — that's exactly where I can help.`,
    ``,
    `WHAT I PROPOSE`,
    `A focused production covering ${ANGLE[opp.category]}.`,
    ``,
    `SCOPE & DELIVERABLES`,
    `• Pre-production & shot planning aligned to your brand`,
    `• Half- to full-day shoot on location`,
    `• Edited, color-graded stills + a 30–60s hero film`,
    `• Web + social exports, two revision rounds`,
    ``,
    `INVESTMENT`,
    `• Project rate: €${fee.toLocaleString()}`,
    `• ${"€" + deposit.toLocaleString()} on signing, ${"€" + deposit.toLocaleString()} on approved delivery`,
    `• Protected by Grid — funds released only after you approve`,
    ``,
    `NEXT STEP`,
    `If this resonates, reply here or book a 15-minute call and I'll tailor the package to your launch timeline.`,
    ``,
    `Best,`,
    `${creatorName}`,
    `via Grid`,
  ].join("\n");
}
