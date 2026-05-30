/**
 * GRID seed data.
 *
 * Ported from the interactive prototype (reference/grid-prototype.html) into a
 * typed module the dashboard renders from. No real backend yet — this is the
 * demo content that powers Marketplace, Jobs, Projects, Escrow, Academy, Shop,
 * Collab, Radar, Studio and the rest of the GRID surface.
 *
 * Currency is shown in EUR to match the landing brand (see hero "€3,600 secured").
 */

export type Category = "Photo" | "Video" | "Drone" | "Production" | "Editing" | "Crew";
export type Role = "creator" | "client";

export type Accent =
  | "blue"
  | "green"
  | "escrow"
  | "gold"
  | "red"
  | "purple"
  | "cyan";

/** Maps a brand accent to its CSS custom-property color. */
export const ACCENT_HEX: Record<Accent, string> = {
  blue: "#0071e3",
  green: "#1a9e4a",
  escrow: "#4fd07a",
  gold: "#f5a14f",
  red: "#ff3b30",
  purple: "#9a7fe0",
  cyan: "#5aa9f5",
};

export function money(n: number, per?: string): string {
  const v = `€${n.toLocaleString("en-US")}`;
  return per ? `${v} ${per}` : v;
}

/* -------------------------------------------------------------------------- */
/*  Portfolio tiles — gradient stand-ins for real media (cinematic, on-brand) */
/* -------------------------------------------------------------------------- */

export type Tile = { title: string; from: string; to: string };

function tile(title: string, from: string, to: string): Tile {
  return { title, from, to };
}

/* -------------------------------------------------------------------------- */
/*  Creatives                                                                  */
/* -------------------------------------------------------------------------- */

export type Package = { name: string; price: number; detail: string };

export type Creative = {
  id: string;
  name: string;
  type: string;
  cat: Category;
  city: string;
  distanceKm: number;
  rate: number;
  rating: number;
  reviews: number;
  verified: boolean;
  topRated?: boolean;
  available?: boolean;
  licensed?: boolean;
  bio: string;
  packages: Package[];
  portfolio: Tile[];
};

export const CREATIVES: Creative[] = [
  {
    id: "john",
    name: "John Hope",
    type: "Real-Estate Photographer",
    cat: "Photo",
    city: "Los Angeles",
    distanceKm: 2.4,
    rate: 3000,
    rating: 4.9,
    reviews: 128,
    verified: true,
    topRated: true,
    available: true,
    bio: "Real estate & architectural photographer based in Los Angeles. Twilight exteriors, clean interiors, fast delivery.",
    packages: [
      { name: "Essential Listing", price: 3000, detail: "Half-day · 25 edited photos · 48h" },
      { name: "Signature Estate", price: 6500, detail: "Full-day · 60 photos + drone · twilight" },
      { name: "Developer Suite", price: 10000, detail: "Multi-day · full media kit · walkthrough" },
    ],
    portfolio: [
      tile("Beverly Hills Estate", "#1b2a4a", "#0a0c12"),
      tile("Twilight Exterior", "#3a2438", "#0d0a10"),
      tile("Glass House", "#163a3a", "#08100f"),
      tile("Loft Interior", "#2a2233", "#0c0a10"),
      tile("Listing Set", "#1f3350", "#090c12"),
      tile("Pool & Patio", "#243a2c", "#080f0b"),
    ],
  },
  {
    id: "maya",
    name: "Maya Lindqvist",
    type: "Brand Filmmaker",
    cat: "Video",
    city: "Oslo",
    distanceKm: 5.1,
    rate: 4200,
    rating: 4.8,
    reviews: 96,
    verified: true,
    topRated: true,
    bio: "Commercial & brand film director. Story-led product films and documentary brand work.",
    packages: [
      { name: "Brand Reel", price: 5000, detail: "1-day · 60s edit · 2 revisions" },
      { name: "Documentary Day", price: 7200, detail: "Full-day · interview + b-roll" },
    ],
    portfolio: [
      tile("Nike Spot", "#3a2a4a", "#0d0a12"),
      tile("Travel Doc", "#22384a", "#080e12"),
      tile("Lofoten Film", "#2a3a2a", "#090f09"),
    ],
  },
  {
    id: "theo",
    name: "Theo Vance",
    type: "Drone Pilot",
    cat: "Drone",
    city: "Dubai",
    distanceKm: 8.7,
    rate: 2800,
    rating: 5.0,
    reviews: 74,
    verified: true,
    licensed: true,
    available: true,
    bio: "Licensed aerial cinematographer. 4K coastline, skyline and real-estate aerials.",
    packages: [
      { name: "Aerial Set", price: 3000, detail: "Half-day · 4K aerials · color graded" },
      { name: "Property Tour", price: 4800, detail: "Full-day · aerial + ground reveal" },
    ],
    portfolio: [
      tile("Coastline", "#163a3a", "#08100f"),
      tile("Skyline", "#1f3350", "#090c12"),
      tile("Marina", "#22384a", "#080e12"),
    ],
  },
  {
    id: "sara",
    name: "Sara Okonkwo",
    type: "Editorial Photographer",
    cat: "Photo",
    city: "London",
    distanceKm: 3.3,
    rate: 2500,
    rating: 4.7,
    reviews: 61,
    verified: true,
    bio: "Portrait & editorial photographer. Studio and on-location editorial sets.",
    packages: [{ name: "Portrait Day", price: 2500, detail: "Studio · 20 edits · 72h" }],
    portfolio: [
      tile("Editorial", "#4a2a2a", "#100808"),
      tile("Studio Portrait", "#2a2a4a", "#0a0a12"),
      tile("Interior Set", "#3a3320", "#0f0d08"),
    ],
  },
  {
    id: "leo",
    name: "Leo Brandt",
    type: "Event Filmmaker",
    cat: "Video",
    city: "Berlin",
    distanceKm: 11.2,
    rate: 3600,
    rating: 4.6,
    reviews: 43,
    verified: false,
    bio: "Music video & event filmmaker. Concerts, launches and live coverage.",
    packages: [{ name: "Event Film", price: 3600, detail: "1-day coverage · highlight edit" }],
    portfolio: [
      tile("Concert", "#2a2a4a", "#0a0a12"),
      tile("Launch Night", "#3a2438", "#0d0a10"),
    ],
  },
  {
    id: "nadia",
    name: "Nadia Reyes",
    type: "Drone Pilot",
    cat: "Drone",
    city: "Barcelona",
    distanceKm: 6.0,
    rate: 2600,
    rating: 4.9,
    reviews: 58,
    verified: true,
    licensed: true,
    bio: "Real estate & event aerials. Smooth reveals, top-down transitions.",
    packages: [{ name: "Aerial Basic", price: 2600, detail: "Half-day · 4K · 48h" }],
    portfolio: [
      tile("Villa", "#3a3320", "#0f0d08"),
      tile("Festival", "#243a2c", "#080f0b"),
    ],
  },
];

export function findCreative(id: string): Creative | undefined {
  return CREATIVES.find((c) => c.id === id);
}

/* -------------------------------------------------------------------------- */
/*  Jobs                                                                       */
/* -------------------------------------------------------------------------- */

export type JobTerm = "One-off" | "Urgent" | "Long-term" | "6 months" | "Retainer";

export type Job = {
  id: string;
  title: string;
  company: string;
  cat: Category;
  budget: number;
  budgetPer?: string;
  loc: string;
  desc: string;
  urgent: boolean;
  term: JobTerm;
  cover: Tile;
  posted: string;
};

export const JOBS: Job[] = [
  {
    id: "j1",
    title: "Real estate shoot — Malibu cliffside villa",
    company: "Coastline Realty",
    cat: "Photo",
    budget: 4000,
    loc: "Malibu, CA",
    desc: "Full-day listing shoot, 40+ edited photos plus a twilight set. Drone optional.",
    urgent: false,
    term: "One-off",
    cover: tile("Cliffside villa", "#1b2a4a", "#0a0c12"),
    posted: "2h ago",
  },
  {
    id: "j2",
    title: "URGENT: replacement wedding photographer",
    company: "Private Client",
    cat: "Photo",
    budget: 2500,
    loc: "Atlanta, GA",
    desc: "Wedding photographer had an emergency. Seeking urgent replacement in Atlanta today, ceremony 4pm. 4-hour coverage.",
    urgent: true,
    term: "Urgent",
    cover: tile("Wedding", "#3a2438", "#0d0a10"),
    posted: "12m ago",
  },
  {
    id: "j3",
    title: "Long-term: monthly content creator",
    company: "Azure Hotels",
    cat: "Video",
    budget: 6000,
    budgetPer: "/ mo",
    loc: "Miami, FL",
    desc: "Ongoing monthly social content for our resort brand. 6-month engagement, 2 shoot days a month.",
    urgent: false,
    term: "6 months",
    cover: tile("Resort", "#163a3a", "#08100f"),
    posted: "1d ago",
  },
  {
    id: "j4",
    title: "Architectural film — hillside modern",
    company: "Meridian Developments",
    cat: "Video",
    budget: 9000,
    loc: "Los Angeles",
    desc: "Brand film for a new development. 2-day shoot, full edit, aerial + ground.",
    urgent: false,
    term: "One-off",
    cover: tile("Hillside modern", "#22384a", "#080e12"),
    posted: "3d ago",
  },
];

export function findJob(id: string): Job | undefined {
  return JOBS.find((j) => j.id === id);
}

/* -------------------------------------------------------------------------- */
/*  Community posts                                                            */
/* -------------------------------------------------------------------------- */

export type Post = { id: string; by: string; caption: string; image: Tile; likes: number; comments: number; when: string };

export const POSTS: Post[] = [
  {
    id: "p1",
    by: "maya",
    caption: "Wrapped a 2-day brand film in Lofoten. Stills before the edit drops.",
    image: tile("Lofoten", "#2a3a2a", "#090f09"),
    likes: 128,
    comments: 14,
    when: "3h ago",
  },
  {
    id: "p2",
    by: "theo",
    caption: "Golden hour over the marina. Manual exposure, single take.",
    image: tile("Marina", "#1f3350", "#090c12"),
    likes: 204,
    comments: 9,
    when: "8h ago",
  },
  {
    id: "p3",
    by: "sara",
    caption: "Editorial interior set from last week. Window light only.",
    image: tile("Interior", "#3a3320", "#0f0d08"),
    likes: 76,
    comments: 5,
    when: "1d ago",
  },
];

/* -------------------------------------------------------------------------- */
/*  Projects + stages                                                          */
/* -------------------------------------------------------------------------- */

export const STAGES = ["Planning", "Shoot", "Edit", "Fixes", "Delivery"] as const;
export type Stage = (typeof STAGES)[number];

export type Project = {
  id: string;
  title: string;
  withName: string;
  cat: Category;
  stage: number; // index into STAGES
  budget: number;
  due: string;
};

export const PROJECTS: Project[] = [
  { id: "pr1", title: "Signature Estate — Bel Air", withName: "Northwind Studio", cat: "Photo", stage: 2, budget: 6500, due: "Jun 4" },
  { id: "pr2", title: "Resort Aerials — Palm Jumeirah", withName: "Azure Hotels", cat: "Drone", stage: 4, budget: 5500, due: "Delivered" },
  { id: "pr3", title: "Penthouse Editorial — NYC", withName: "Vogue Living", cat: "Photo", stage: 0, budget: 6000, due: "Jun 18" },
];

/* -------------------------------------------------------------------------- */
/*  Contracts                                                                  */
/* -------------------------------------------------------------------------- */

export type Contract = {
  id: string;
  withName: string;
  pkg: string;
  total: number;
  status: "Active" | "Completed" | "Awaiting signature";
  date: string;
};

export const CONTRACTS: Contract[] = [
  { id: "GR-2049", withName: "Northwind Studio", pkg: "Signature Estate", total: 7150, status: "Active", date: "May 24, 2026" },
  { id: "GR-2041", withName: "Coastline Realty", pkg: "Essential Listing", total: 3300, status: "Active", date: "May 19, 2026" },
  { id: "GR-2020", withName: "Azure Hotels", pkg: "Aerial Set", total: 3300, status: "Completed", date: "May 2, 2026" },
];

/* -------------------------------------------------------------------------- */
/*  Companies (client profiles)                                                */
/* -------------------------------------------------------------------------- */

export type Review = { by: string; rating: number; text: string };

export type Company = {
  id: string;
  name: string;
  industry: string;
  locations: string[];
  paysOnTime: boolean;
  rating: number;
  jobs: number;
  reviews: Review[];
};

export const COMPANIES: Record<string, Company> = {
  northwind: {
    id: "northwind",
    name: "Northwind Studio",
    industry: "Real estate marketing agency",
    locations: ["Los Angeles, CA", "New York, NY"],
    paysOnTime: true,
    rating: 4.8,
    jobs: 34,
    reviews: [
      { by: "John Hope", rating: 5, text: "Paid the day after delivery. Clear brief, great to work with." },
      { by: "Theo Vance", rating: 5, text: "Fast escrow release, professional team." },
      { by: "Sara Okonkwo", rating: 4, text: "Good communication, slight delay on feedback round." },
    ],
  },
  coastline: {
    id: "coastline",
    name: "Coastline Realty",
    industry: "Luxury real estate",
    locations: ["Malibu, CA"],
    paysOnTime: true,
    rating: 4.6,
    jobs: 21,
    reviews: [{ by: "John Hope", rating: 5, text: "Always pays on time, premium listings." }],
  },
  azure: {
    id: "azure",
    name: "Azure Hotels",
    industry: "Hospitality group",
    locations: ["Dubai", "Miami, FL"],
    paysOnTime: false,
    rating: 4.1,
    jobs: 12,
    reviews: [{ by: "Theo Vance", rating: 4, text: "Big budgets but escrow release took a while." }],
  },
};

/** The signed-in client's own company (demo). */
export const MY_COMPANY = COMPANIES.northwind;

/* -------------------------------------------------------------------------- */
/*  Reviews left for creatives                                                 */
/* -------------------------------------------------------------------------- */

export const CREATIVE_REVIEWS: Record<string, Review[]> = {
  john: [
    { by: "Northwind Studio", rating: 5, text: "Best listing photos we've had. Twilight set sold the property." },
    { by: "Coastline Realty", rating: 5, text: "On time, professional, beautiful edits." },
  ],
  maya: [{ by: "Azure Hotels", rating: 5, text: "Brand film exceeded the brief. Booking again." }],
  theo: [{ by: "Meridian Developments", rating: 5, text: "Aerials were cinematic. Licensed and insured, zero hassle." }],
};

/* -------------------------------------------------------------------------- */
/*  Academy                                                                    */
/* -------------------------------------------------------------------------- */

export type Course = {
  id: string;
  title: string;
  by: string;
  duration: string;
  lessons: string[];
  done: number;
  cover: Tile;
};

export const COURSES: Course[] = [
  {
    id: "c1",
    title: "Lighting Luxury Interiors",
    by: "John Hope",
    duration: "1h 40m",
    lessons: ["Reading natural light", "Flash vs ambient", "Bracketing for windows", "HDR blending", "Editing for listings"],
    done: 2,
    cover: tile("Interiors", "#2a2233", "#0c0a10"),
  },
  {
    id: "c2",
    title: "Cinematic Drone Movements",
    by: "Theo Vance",
    duration: "1h 10m",
    lessons: ["Orbit & reveal", "The pull-back", "Top-down transitions", "Manual exposure"],
    done: 0,
    cover: tile("Drone", "#1f3350", "#090c12"),
  },
  {
    id: "c3",
    title: "Pricing & Packaging Your Work",
    by: "Grid Academy",
    duration: "52m",
    lessons: ["Day rate vs package", "Reading the brief", "Upselling deliverables"],
    done: 3,
    cover: tile("Business", "#243a2c", "#080f0b"),
  },
];

/* -------------------------------------------------------------------------- */
/*  Shop                                                                       */
/* -------------------------------------------------------------------------- */

export type Product = { id: string; title: string; price: number; type: "LUT" | "Preset" | "Template"; cover: Tile };

export const PRODUCTS: Product[] = [
  { id: "s1", title: "LA Warm Real-Estate LUT", price: 39, type: "LUT", cover: tile("Warm LUT", "#3a2a1a", "#0f0a06") },
  { id: "s2", title: "Twilight Exterior Preset Pack", price: 29, type: "Preset", cover: tile("Twilight", "#3a2438", "#0d0a10") },
  { id: "s3", title: "Listing Delivery Template", price: 19, type: "Template", cover: tile("Template", "#1f3350", "#090c12") },
];

/* -------------------------------------------------------------------------- */
/*  Collab — crew                                                              */
/* -------------------------------------------------------------------------- */

export type CrewMember = { id: string; role: string; name: string; pay: number };

export const CREW: CrewMember[] = [
  { id: "cr1", role: "Co-Director", name: "Ava Mreng", pay: 25 },
  { id: "cr2", role: "Gaffer", name: "Sam Reed", pay: 15 },
];

export const COLLAB_PROJECT = "Bel Air Listing Film";

/* -------------------------------------------------------------------------- */
/*  AI Studio                                                                  */
/* -------------------------------------------------------------------------- */

export type StudioTool = { key: string; label: string; desc: string };

export const STUDIO_TOOLS: StudioTool[] = [
  { key: "shotlist", label: "Shot list", desc: "Turn a brief into a sequenced shot list." },
  { key: "script", label: "Script", desc: "Draft a voiceover or interview script." },
  { key: "moodboard", label: "Mood board", desc: "Generate a reference board from a vibe." },
  { key: "proposal", label: "Proposal", desc: "Write a client proposal from scope + rate." },
];

/* -------------------------------------------------------------------------- */
/*  Radar / News / Trends / Invite                                             */
/* -------------------------------------------------------------------------- */

export const NEWS: { title: string; when: string }[] = [
  { title: "Grid Escrow now supports 4 currencies", when: "2 days ago" },
  { title: "New: urgent last-minute job posts", when: "1 week ago" },
  { title: "Long-term freelance hiring is live", when: "2 weeks ago" },
];

export const TRENDS: { title: string; change: string }[] = [
  { title: "Warm twilight exteriors", change: "+38%" },
  { title: "Vertical property tours", change: "+24%" },
  { title: "Film-grain interiors", change: "+19%" },
];

export type InviteTier = { name: string; refs: string; perk: string; accent: Accent };

export const INVITE_TIERS: InviteTier[] = [
  { name: "Bronze", refs: "1–5 refs", perk: "−2% fee", accent: "gold" },
  { name: "Silver", refs: "6–15 refs", perk: "−5% fee", accent: "cyan" },
  { name: "Gold", refs: "16+ refs", perk: "−8% + Ambassador", accent: "gold" },
];

export const INVITE_LINK = "grid.app/r/johnhope";

export const SAVED_CREATIVE_IDS = ["john", "theo"];

/* -------------------------------------------------------------------------- */
/*  Notifications                                                              */
/* -------------------------------------------------------------------------- */

export type Notif = { icon: string; accent: Accent; title: string; detail: string; when: string };

export const NOTIFS: Record<Role, Notif[]> = {
  creator: [
    { icon: "escrow", accent: "escrow", title: "Escrow funded", detail: "Northwind Studio funded €7,150 for Signature Estate.", when: "9:41" },
    { icon: "briefcase", accent: "blue", title: "New booking request", detail: "Coastline Realty wants to book Essential Listing.", when: "8:12" },
    { icon: "star", accent: "gold", title: "New 5★ review", detail: "Azure Hotels reviewed your Aerial Set.", when: "Yesterday" },
  ],
  client: [
    { icon: "check", accent: "escrow", title: "Delivery ready", detail: "Theo Vance delivered Resort Aerials — approve to release.", when: "10:02" },
    { icon: "file", accent: "blue", title: "Contract signed", detail: "John Hope signed Signature Estate.", when: "Yesterday" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Trust badges                                                               */
/* -------------------------------------------------------------------------- */

export const TRUST_BADGES = [
  "ID Verified",
  "Top Rated",
  "Licensed Drone Pilot",
  "Fast Delivery",
  "Paid on Time",
  "Escrow Protected",
  "Repeat Client",
  "Available Today",
];

/* -------------------------------------------------------------------------- */
/*  Headline metrics (demo)                                                    */
/* -------------------------------------------------------------------------- */

export const METRICS = {
  inEscrow: 9500,
  available: 3200,
  thisMonth: 12000,
  totalSpent: 24800,
};
