/**
 * Grid Campaign — AI marketing campaign concepts.
 *
 * From a short brand brief (description / images, audience, interests, budget,
 * timeline) the generator composes THREE distinct, high-quality campaign
 * concepts — each with video & photo direction, short- and long-form plans,
 * "genius" strategy moves, a budget split, a timeline, and real-world
 * references pulled from a curated library of proven campaigns.
 *
 * No model backend yet: `generateCampaigns()` is deterministic and on-brand.
 * Swap it for a real model call when the API lands — the shapes stay the same.
 * Campaigns persist to localStorage so they behave like saved projects.
 */

import type { Accent } from "./grid-data";

/* -------------------------------------------------------------------------- */
/*  Brief                                                                      */
/* -------------------------------------------------------------------------- */

export type CampaignBrief = {
  brand: string;
  images: string[]; // optional data-URL references (site / feed / products)
  ageMin: number;
  ageMax: number;
  interests: string[];
  budget: number; // €
  weeks: number; // time to make it
};

export const INTERESTS = [
  "Lifestyle",
  "Music",
  "Nature",
  "Movies",
  "Social Media",
  "Fashion",
  "Fitness",
  "Travel",
  "Food",
  "Tech",
  "Art",
  "Beauty",
  "Sports",
  "Luxury",
  "Gaming",
] as const;

export const AGE_BANDS: { label: string; min: number; max: number }[] = [
  { label: "13–17", min: 13, max: 17 },
  { label: "18–24", min: 18, max: 24 },
  { label: "18–35", min: 18, max: 35 },
  { label: "25–34", min: 25, max: 34 },
  { label: "35–50", min: 35, max: 50 },
  { label: "50+", min: 50, max: 70 },
];

export const BUDGETS: { label: string; value: number }[] = [
  { label: "€2k", value: 2000 },
  { label: "€5k", value: 5000 },
  { label: "€10k", value: 10000 },
  { label: "€25k", value: 25000 },
  { label: "€50k+", value: 50000 },
];

export const TIMEFRAMES: { label: string; weeks: number }[] = [
  { label: "1 week", weeks: 1 },
  { label: "2 weeks", weeks: 2 },
  { label: "4 weeks", weeks: 4 },
  { label: "8 weeks", weeks: 8 },
];

/* -------------------------------------------------------------------------- */
/*  Reference library — real, proven campaigns to learn from                   */
/* -------------------------------------------------------------------------- */

export type Reference = {
  name: string;
  platform: string;
  handle: string;
  takeaway: string;
  tags: string[];
};

const REFERENCES: Reference[] = [
  { name: "MrBeast", platform: "YouTube", handle: "@MrBeast", takeaway: "Front-load the payoff in the first 3 seconds — every frame has to earn the next.", tags: ["viral", "social media", "gaming"] },
  { name: "Jake Paul", platform: "YouTube · X", handle: "@jakepaul", takeaway: "Build a story and real stakes around the launch — people follow narratives, not products.", tags: ["viral", "sports", "music", "social media"] },
  { name: "Liquid Death", platform: "TikTok · IG", handle: "@liquiddeath", takeaway: "Take a polarizing stance on purpose — a strong point of view manufactures free reach.", tags: ["viral", "music", "social media", "sports"] },
  { name: "Nike", platform: "Instagram", handle: "@nike", takeaway: "Sell the identity, not the item — 'Just Do It' is a worldview, not a feature list.", tags: ["premium", "fitness", "sports", "lifestyle", "luxury"] },
  { name: "Aesop", platform: "Instagram", handle: "@aesopskincare", takeaway: "Restraint signals premium — negative space, a muted palette, and zero clutter.", tags: ["premium", "beauty", "luxury", "lifestyle", "art"] },
  { name: "A24", platform: "Instagram", handle: "@a24", takeaway: "Cultivate taste and mystery — withhold, tease, and let fans decode the drop.", tags: ["premium", "movies", "art", "music"] },
  { name: "Bloomberg", platform: "YouTube · Web", handle: "@business", takeaway: "Authority comes from clean, data-rich visuals and a calm, confident voice.", tags: ["premium", "tech", "luxury"] },
  { name: "Forbes", platform: "Instagram", handle: "@forbes", takeaway: "Borrow credibility — frame the brand inside a recognizable 'success' narrative.", tags: ["premium", "luxury", "tech", "lifestyle"] },
  { name: "TED", platform: "YouTube", handle: "@TED", takeaway: "One idea, told with conviction, outlasts a hundred features.", tags: ["community", "movies", "art", "tech"] },
  { name: "Glossier", platform: "IG · TikTok", handle: "@glossier", takeaway: "Make customers the campaign — real faces beat polished models for trust.", tags: ["community", "beauty", "lifestyle", "social media", "fashion"] },
  { name: "Emma Chamberlain", platform: "TikTok", handle: "@emmachamberlain", takeaway: "Lo-fi authenticity reads as honesty — Gen-Z rewards 'unproduced' content.", tags: ["community", "lifestyle", "food", "social media", "music"] },
  { name: "Red Bull", platform: "YouTube · IG", handle: "@redbull", takeaway: "Own a feeling (adrenaline) and let the product ride shotgun.", tags: ["community", "music", "sports", "nature", "travel"] },
];

/* -------------------------------------------------------------------------- */
/*  Concept model                                                              */
/* -------------------------------------------------------------------------- */

export type CampaignConcept = {
  id: string;
  archetype: "viral" | "premium" | "community";
  name: string;
  tagline: string;
  bigIdea: string;
  rationale: string;
  videoStyle: string[];
  photoStyle: string[];
  shortForm: string[];
  longForm: string[];
  strategy: string[];
  references: Reference[];
  channels: string[];
  budgetSplit: { label: string; pct: number }[];
  timeline: { week: string; focus: string }[];
  accent: Accent;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function brandName(brief: CampaignBrief): string {
  const s = brief.brand.trim();
  if (!s) return "the brand";
  // Take the label before the first dash / em-dash / comma / period, so
  // "Lumière — a unisex parfum…" becomes a clean "Lumière".
  const head = s.split(/\s*[—–\-,.]\s*/)[0].trim();
  const base = head || s;
  return base.split(/\s+/).slice(0, 3).join(" ");
}

function topInterest(brief: CampaignBrief): string {
  return (brief.interests[0] ?? "lifestyle").toLowerCase();
}

function audience(brief: CampaignBrief): string {
  return `${brief.ageMin}–${brief.ageMax}`;
}

function pickRefs(archetype: string, interests: string[], n = 4): Reference[] {
  const wants = interests.map((i) => i.toLowerCase());
  const scored = REFERENCES.map((r) => {
    let score = r.tags.includes(archetype) ? 2 : 0;
    score += r.tags.filter((t) => wants.includes(t)).length;
    return { r, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((s) => s.r);
}

function timeline(weeks: number, phases: string[]): { week: string; focus: string }[] {
  const per = Math.max(1, Math.round(weeks / phases.length));
  let cur = 1;
  return phases.map((focus, i) => {
    const start = cur;
    const end = i === phases.length - 1 ? Math.max(weeks, start) : Math.min(weeks, cur + per - 1);
    cur = end + 1;
    return { week: start === end ? `Week ${start}` : `Wk ${start}–${end}`, focus };
  });
}

/* -------------------------------------------------------------------------- */
/*  Archetype generators                                                       */
/* -------------------------------------------------------------------------- */

function viral(brief: CampaignBrief, idx: number): CampaignConcept {
  const b = brandName(brief);
  const ti = topInterest(brief);
  return {
    id: `cc${idx}`,
    archetype: "viral",
    name: `${b} Unleashed`,
    tagline: "Loud, fast, impossible to scroll past",
    bigIdea: `Turn the launch into an event. A creator-led, short-form blitz that makes ${b} the thing everyone in the ${ti} space is talking about this week.`,
    rationale: `${audience(brief)}-year-olds live in the feed and reward energy, stakes and personality over polish. Frequency and a strong point of view beat a single hero ad for this audience.`,
    videoStyle: [
      "Hand-held, vertical, shot on phone — speed over polish",
      "Punch-in cuts every 1–2s, captions burned in, trend audio",
      "Open on the payoff; tease the story, deliver in 3 seconds",
      "Creator face-to-camera energy — react, challenge, reveal",
    ],
    photoStyle: [
      "Bold, high-contrast, single-color backdrops",
      "Product-in-hand candids, motion blur, flash-on look",
      "Meme-ready frames designed to be screenshotted & shared",
    ],
    shortForm: [
      `Day-1 teaser drop across TikTok / Reels / Shorts (3 cuts)`,
      `A creator 'challenge' tied to ${ti} that fans can duet`,
      "Behind-the-scenes of the launch as a running series",
      "Reply-to-comments videos to ride the algorithm for 7 days",
    ],
    longForm: [
      "One 8–12 min YouTube 'the making of' to anchor credibility",
      "Podcast / livestream Q&A on launch day for superfans",
    ],
    strategy: [
      "Seed 5–10 micro-creators 48h early so launch day starts loud",
      "Manufacture a moment — a stunt, a bet, or a countdown people screenshot",
      "Pick one polarizing angle and lean in — comments are free distribution",
      "Retarget every video viewer with a single, frictionless offer",
    ],
    references: pickRefs("viral", brief.interests),
    channels: ["TikTok", "Instagram Reels", "YouTube Shorts", "X"],
    budgetSplit: [
      { label: "Creator partnerships", pct: 40 },
      { label: "Paid amplification", pct: 30 },
      { label: "Short-form production", pct: 20 },
      { label: "Always-on community", pct: 10 },
    ],
    timeline: timeline(brief.weeks, ["Casting & hooks", "Shoot sprint", "Edit & seed", "Launch & ride"]),
    accent: "purple",
  };
}

function premium(brief: CampaignBrief, idx: number): CampaignConcept {
  const b = brandName(brief);
  const ti = topInterest(brief);
  return {
    id: `cc${idx}`,
    archetype: "premium",
    name: `${b}, Refined`,
    tagline: "Quiet luxury, cinematic restraint",
    bigIdea: `Position ${b} as the aspirational choice. One cinematic hero film and an editorial stills library that make the brand feel inevitable — not advertised.`,
    rationale: `Even at ${audience(brief)}, premium perception drives price and loyalty. Restraint, craft and a consistent world signal quality far louder than discounts.`,
    videoStyle: [
      "Cinematic 24fps, shallow depth, deliberate slow motion",
      "Muted, filmic grade — one signature color across everything",
      "Sound design forward; sparse, confident voice (or none)",
      "Negative space and stillness — let each frame breathe",
    ],
    photoStyle: [
      "Editorial, magazine-grade lighting and composition",
      `${ti.charAt(0).toUpperCase() + ti.slice(1)}-led art direction with a single hero subject`,
      "Texture and detail macro shots — materiality as luxury cue",
    ],
    shortForm: [
      "15s 'teaser poems' — one line, one image, mystery",
      "Reels that feel like film stills in motion, not ads",
      "A consistent grid aesthetic that reads premium at a glance",
    ],
    longForm: [
      "A 60–90s hero brand film for site, pre-roll and events",
      "An editorial landing page / lookbook to host the world",
      "Founder or craft story as a 3–5 min mini-documentary",
    ],
    strategy: [
      "Withhold before you reveal — a teaser window builds desire",
      "Place in tastemaker contexts (A24-style) over hard-sell media",
      "Borrow authority: a Forbes / Bloomberg-style credibility frame",
      "Consistency over volume — one world, repeated, becomes iconic",
    ],
    references: pickRefs("premium", brief.interests),
    channels: ["Instagram", "YouTube (pre-roll)", "Brand site", "Out-of-home"],
    budgetSplit: [
      { label: "Hero film", pct: 35 },
      { label: "Photography", pct: 25 },
      { label: "Media & placement", pct: 25 },
      { label: "Web & retouch", pct: 15 },
    ],
    timeline: timeline(brief.weeks, ["Moodboard & casting", "Production", "Grade & assembly", "Reveal"]),
    accent: "cyan",
  };
}

function community(brief: CampaignBrief, idx: number): CampaignConcept {
  const b = brandName(brief);
  const ti = topInterest(brief);
  return {
    id: `cc${idx}`,
    archetype: "community",
    name: `Made for ${b}`,
    tagline: "Real people, real proof, real momentum",
    bigIdea: `Make the audience the campaign. UGC, micro-creators and a shared ${ti} ritual turn ${b} into something people feel part of — and want to post.`,
    rationale: `${audience(brief)}-year-olds trust peers over brands. Authentic, community-made content compounds: every post is both proof and free reach.`,
    videoStyle: [
      "Authentic, lo-fi, shot by real users — honesty over gloss",
      "Talking-head testimonials and 'a day with' diaries",
      "Stitch / duet-friendly formats that invite participation",
      "Captioned, sound-on, designed for silent autoplay too",
    ],
    photoStyle: [
      "Natural light, candid, true-to-life — no over-retouching",
      "Repost-worthy customer photos as the hero, not stock",
      "A simple brand frame so UGC still feels cohesive",
    ],
    shortForm: [
      `A branded ${ti} challenge with a simple, copyable format`,
      "Creator seeding kit: hooks, audio and an easy CTA",
      "Weekly 'best of the community' reposts to reward posting",
    ],
    longForm: [
      "A 'community stories' YouTube series featuring real users",
      "A TED-style talk or AMA from the founder on the bigger idea",
    ],
    strategy: [
      "Seed 20–50 micro-creators over hero talent — trust scales wider",
      "Give people a reason and a format to post (ritual + reward)",
      "Feature customers publicly — recognition fuels more UGC",
      "Build an owned space (Discord / Close Friends) for superfans",
    ],
    references: pickRefs("community", brief.interests),
    channels: ["TikTok", "Instagram", "YouTube", "Community (Discord)"],
    budgetSplit: [
      { label: "UGC & seeding", pct: 35 },
      { label: "Micro-creators", pct: 30 },
      { label: "Community mgmt", pct: 20 },
      { label: "Production", pct: 15 },
    ],
    timeline: timeline(brief.weeks, ["Seed & brief creators", "Collect UGC", "Curate & amplify", "Sustain"]),
    accent: "gold",
  };
}

/** Build the three concepts for a brief. */
export function generateCampaigns(brief: CampaignBrief): CampaignConcept[] {
  return [viral(brief, 1), premium(brief, 2), community(brief, 3)];
}

export const ANALYSIS_STEPS = [
  "Reading the brand & references",
  "Profiling the audience",
  "Studying proven campaigns",
  "Composing three concepts",
];

/* -------------------------------------------------------------------------- */
/*  Persistence                                                                */
/* -------------------------------------------------------------------------- */

export type TeamMember = { id: string; name: string; role: string };

export type SavedCampaign = {
  id: string;
  brief: CampaignBrief;
  concepts: CampaignConcept[];
  createdAt: number;
  team: TeamMember[];
  inProject: boolean;
};

const KEY = "grid:campaigns";

const SEED_BRIEF: CampaignBrief = {
  brand: "Aurelle — a unisex parfum for men and women",
  images: [],
  ageMin: 18,
  ageMax: 35,
  interests: ["Lifestyle", "Music", "Fashion"],
  budget: 10000,
  weeks: 4,
};

function seed(): SavedCampaign {
  return {
    id: "cm-seed",
    brief: SEED_BRIEF,
    concepts: generateCampaigns(SEED_BRIEF),
    createdAt: Date.UTC(2026, 4, 29),
    team: [],
    inProject: false,
  };
}

export function loadCampaigns(): SavedCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [seed()];
    return JSON.parse(raw) as SavedCampaign[];
  } catch {
    return [seed()];
  }
}

export function saveCampaigns(list: SavedCampaign[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function findCampaign(id: string): SavedCampaign | undefined {
  return loadCampaigns().find((c) => c.id === id);
}

export function upsertCampaign(next: SavedCampaign): void {
  const list = loadCampaigns();
  const i = list.findIndex((c) => c.id === next.id);
  if (i >= 0) list[i] = next;
  else list.unshift(next);
  saveCampaigns(list);
}

/** Wrap a brief + already-generated concepts into a saved campaign. */
export function buildCampaign(brief: CampaignBrief, concepts: CampaignConcept[]): SavedCampaign {
  return {
    id: `cm${Date.now().toString(36)}`,
    brief,
    concepts,
    createdAt: Date.now(),
    team: [],
    inProject: false,
  };
}

/** Deterministic local campaign (used as the offline fallback path). */
export function newCampaign(brief: CampaignBrief): SavedCampaign {
  return buildCampaign(brief, generateCampaigns(brief));
}

export function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(ts).toLocaleDateString();
}
