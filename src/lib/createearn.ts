/**
 * Shared demo data for the premium Create & Earn suite:
 * Brand Vault, Content Planner, AI Sales, Creative CRM, Price Intel, Match Score.
 *
 * All static/derived — swap for real pipelines + a model when ready.
 */

import type { Tile } from "./grid-data";

/* -------------------------------------------------------------------------- */
/*  Brand Vault                                                                */
/* -------------------------------------------------------------------------- */

export type VaultFolder = { key: string; label: string; icon: "file" | "wallet" | "layout" | "camera"; count: number };
export type TimelineEntry = { date: string; title: string; kind: "Shoot" | "Delivery" | "Contract" | "Campaign" };
export type BrandProject = { title: string; value: number; status: "Active" | "Delivered" | "Planning" };

export type Brand = {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  instagram: string;
  palette: string[];
  logoFrom: string;
  logoTo: string;
  lifetime: number;
  projects: BrandProject[];
  timeline: TimelineEntry[];
  folders: VaultFolder[];
};

export const BRANDS: Brand[] = [
  {
    id: "northwind",
    name: "Northwind Studio",
    industry: "Real-estate marketing agency",
    location: "Los Angeles, CA",
    website: "northwindstudio.com",
    instagram: "@northwind.studio",
    palette: ["#0f2a4a", "#1d4e89", "#c9a14a", "#e9e4d8", "#0a0c12"],
    logoFrom: "#1b2a4a",
    logoTo: "#0a0c12",
    lifetime: 28600,
    projects: [
      { title: "Signature Estate — Bel Air", value: 7150, status: "Active" },
      { title: "Hillside Modern — Listing Film", value: 5400, status: "Delivered" },
      { title: "Q3 Retainer — Monthly Stills", value: 9000, status: "Planning" },
    ],
    timeline: [
      { date: "May 24", title: "Signature Estate shoot booked", kind: "Contract" },
      { date: "May 12", title: "Hillside Modern delivered", kind: "Delivery" },
      { date: "Apr 28", title: "Spring campaign wrapped", kind: "Campaign" },
    ],
    folders: [
      { key: "contracts", label: "Contracts", icon: "file", count: 4 },
      { key: "invoices", label: "Invoices", icon: "wallet", count: 6 },
      { key: "moodboards", label: "Moodboards", icon: "layout", count: 3 },
      { key: "content", label: "Content", icon: "camera", count: 142 },
    ],
  },
  {
    id: "azure",
    name: "Azure Hotels",
    industry: "Hospitality group",
    location: "Dubai · Miami, FL",
    website: "azurehotels.com",
    instagram: "@azurehotels",
    palette: ["#0c3b5c", "#1f7fae", "#5aa9f5", "#ff7a59", "#0a0f14"],
    logoFrom: "#163a3a",
    logoTo: "#08100f",
    lifetime: 41200,
    projects: [
      { title: "Resort Aerials — Palm Jumeirah", value: 5500, status: "Delivered" },
      { title: "Suite Campaign — Miami", value: 11000, status: "Active" },
    ],
    timeline: [
      { date: "May 30", title: "Resort Aerials delivered", kind: "Delivery" },
      { date: "May 18", title: "Miami suite campaign kickoff", kind: "Campaign" },
      { date: "May 2", title: "Aerial Set signed", kind: "Contract" },
    ],
    folders: [
      { key: "contracts", label: "Contracts", icon: "file", count: 7 },
      { key: "invoices", label: "Invoices", icon: "wallet", count: 9 },
      { key: "moodboards", label: "Moodboards", icon: "layout", count: 5 },
      { key: "content", label: "Content", icon: "camera", count: 318 },
    ],
  },
  {
    id: "vogue",
    name: "Vogue Living",
    industry: "Editorial / interiors",
    location: "New York, NY",
    website: "vogueliving.com",
    instagram: "@vogueliving",
    palette: ["#1a1a1a", "#b08d57", "#d8c6a8", "#f4f1ea", "#0d0d0d"],
    logoFrom: "#3a3320",
    logoTo: "#0f0d08",
    lifetime: 18400,
    projects: [
      { title: "Penthouse Editorial — NYC", value: 6000, status: "Planning" },
      { title: "Winter Interiors Feature", value: 7200, status: "Delivered" },
    ],
    timeline: [
      { date: "May 26", title: "Penthouse Editorial planning", kind: "Shoot" },
      { date: "Apr 30", title: "Winter feature published", kind: "Delivery" },
      { date: "Apr 10", title: "Editorial retainer signed", kind: "Contract" },
    ],
    folders: [
      { key: "contracts", label: "Contracts", icon: "file", count: 3 },
      { key: "invoices", label: "Invoices", icon: "wallet", count: 4 },
      { key: "moodboards", label: "Moodboards", icon: "layout", count: 8 },
      { key: "content", label: "Content", icon: "camera", count: 96 },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Content Planner                                                            */
/* -------------------------------------------------------------------------- */

export type Pillar = { id: string; label: string; color: string };
export const PILLARS: Pillar[] = [
  { id: "listings", label: "Listings", color: "#0071e3" },
  { id: "bts", label: "Behind the scenes", color: "#9a7fe0" },
  { id: "aerial", label: "Aerial", color: "#5aa9f5" },
  { id: "brand", label: "Brand film", color: "#4fd07a" },
];

export type ContentIdea = { id: string; title: string; pillar: string; day: number | null };
export const CONTENT_IDEAS: ContentIdea[] = [
  { id: "c1", title: "Bel Air twilight reel", pillar: "listings", day: 4 },
  { id: "c2", title: "Drone orbit — Palm villa", pillar: "aerial", day: 9 },
  { id: "c3", title: "On-set lighting BTS", pillar: "bts", day: 9 },
  { id: "c4", title: "Azure brand film teaser", pillar: "brand", day: 16 },
  { id: "c5", title: "Listing carousel — Hillside", pillar: "listings", day: 22 },
  { id: "c6", title: "Color grading timelapse", pillar: "bts", day: null },
  { id: "c7", title: "Golden-hour rooftop set", pillar: "aerial", day: null },
];

/* -------------------------------------------------------------------------- */
/*  AI Sales / CRM leads                                                       */
/* -------------------------------------------------------------------------- */

export type ProposalStatus = "Not started" | "Drafted" | "Sent" | "Negotiating" | "Won";
export type CrmStage = "lead" | "contacted" | "proposal" | "won";

export type Lead = {
  id: string;
  name: string;
  category: string;
  value: number;
  probability: number; // 0–100
  lastContact: string;
  proposal: ProposalStatus;
  health: "hot" | "warm" | "cold";
  stage: CrmStage;
  email: string;
};

export const LEADS: Lead[] = [
  { id: "l1", name: "Solène", category: "Restaurant", value: 6500, probability: 82, lastContact: "Today", proposal: "Drafted", health: "hot", stage: "proposal", email: "hello@solene.la" },
  { id: "l2", name: "The Aubrey Hotel", category: "Hotel", value: 14000, probability: 74, lastContact: "Yesterday", proposal: "Sent", health: "hot", stage: "proposal", email: "marketing@aubreyhotel.com" },
  { id: "l3", name: "Atlas & Oak", category: "Brand", value: 7400, probability: 61, lastContact: "2 days ago", proposal: "Not started", health: "warm", stage: "contacted", email: "hi@atlasandoak.com" },
  { id: "l4", name: "Maison Veil", category: "Retail", value: 8200, probability: 48, lastContact: "4 days ago", proposal: "Not started", health: "warm", stage: "lead", email: "press@maisonveil.com" },
  { id: "l5", name: "Lumen Festival", category: "Event", value: 11000, probability: 88, lastContact: "Today", proposal: "Negotiating", health: "hot", stage: "proposal", email: "team@lumenfest.com" },
  { id: "l6", name: "Northpoint Capital", category: "Company", value: 9500, probability: 35, lastContact: "1 week ago", proposal: "Not started", health: "cold", stage: "lead", email: "comms@northpointcap.com" },
  { id: "l7", name: "Vela Swim", category: "Brand", value: 6900, probability: 70, lastContact: "Yesterday", proposal: "Won", health: "hot", stage: "won", email: "studio@velaswim.com" },
];

export const CRM_STAGES: { key: CrmStage; label: string; accent: string }[] = [
  { key: "lead", label: "New lead", accent: "#5aa9f5" },
  { key: "contacted", label: "Contacted", accent: "#9a7fe0" },
  { key: "proposal", label: "Proposal", accent: "#f5a14f" },
  { key: "won", label: "Won", accent: "#4fd07a" },
];

/* -------------------------------------------------------------------------- */
/*  Match Score                                                                */
/* -------------------------------------------------------------------------- */

export type MatchFactor = { label: string; score: number };
export type Match = {
  id: string;
  name: string;
  industry: string;
  budget: string;
  score: number;
  bookingProbability: number;
  sharedIndustries: string[];
  sharedStyle: string[];
  reason: string;
  tile: Tile;
};

export const MATCHES: Match[] = [
  {
    id: "m1",
    name: "Azure Hotels",
    industry: "Hospitality",
    budget: "€8k–14k",
    score: 96,
    bookingProbability: 89,
    sharedIndustries: ["Hospitality", "Real estate", "Travel"],
    sharedStyle: ["Twilight exteriors", "Aerial", "Cinematic"],
    reason: "Your twilight + aerial portfolio maps directly to their suite and resort campaigns.",
    tile: { title: "Azure", from: "#0c3b5c", to: "#0a0f14" },
  },
  {
    id: "m2",
    name: "Maison Veil",
    industry: "Luxury retail",
    budget: "€6k–9k",
    score: 88,
    bookingProbability: 72,
    sharedIndustries: ["Retail", "Editorial"],
    sharedStyle: ["Editorial", "Natural light", "Minimal"],
    reason: "Editorial interiors in your book match their launch and lookbook needs.",
    tile: { title: "Maison", from: "#3a2438", to: "#0d0a10" },
  },
  {
    id: "m3",
    name: "Solène",
    industry: "Restaurant",
    budget: "€5k–7k",
    score: 81,
    bookingProbability: 64,
    sharedIndustries: ["Hospitality", "Food"],
    sharedStyle: ["Warm tones", "Ambiance", "Detail"],
    reason: "Warm, ambiance-led work fits a new restaurant launching its visual identity.",
    tile: { title: "Solène", from: "#3a2a1a", to: "#0f0a06" },
  },
];

/* -------------------------------------------------------------------------- */
/*  Shared                                                                     */
/* -------------------------------------------------------------------------- */

export const money = (n: number) => `€${n.toLocaleString()}`;
