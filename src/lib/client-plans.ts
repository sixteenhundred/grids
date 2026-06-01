/**
 * Client subscription plans — the operating-system pricing for companies,
 * brands, agencies and media teams. Completely separate from the creator
 * plans in lib/plans.ts. Plain config module (no "use client") so the page,
 * cards, comparison table and form can all import it.
 *
 * Add a future tier by appending to CLIENT_TIERS and adding its column to
 * COMPARISON — nothing else needs to change.
 */

import type { IconName } from "@/components/dashboard/icons";

export type ClientPlanId = "free" | "agency" | "enterprise";

export type ClientCta = {
  label: string;
  /** start → go use the free workspace; agency/enterprise → open contact sheet */
  kind: "start" | "agency" | "enterprise";
  href?: string;
};

export type ClientTier = {
  id: ClientPlanId;
  name: string;
  gem: IconName;
  priceLabel: string;
  cadence?: string;
  positioning: string;
  description: string;
  inheritsFrom?: string;
  features: string[];
  /** Notable things this tier does NOT include (Free only). */
  excludes?: string[];
  cta: ClientCta;
  highlight?: boolean;
  badge?: string;
  accent: string; // tailwind text colour
  ring: string; // tailwind border colour for the card frame
  glow: string; // tailwind bg colour for the corner glow
};

export const CLIENT_TIERS: ClientTier[] = [
  {
    id: "free",
    name: "Free",
    gem: "briefcase",
    priceLabel: "Free",
    positioning: "Everything you need to hire and manage creative projects.",
    description: "Perfect for businesses with occasional creative needs.",
    features: [
      "Post jobs",
      "Browse creatives",
      "Advanced creator filtering",
      "Messaging",
      "Contracts",
      "Payments",
      "Escrow protection",
      "File uploads",
      "Project management",
      "Core GRID workspace",
      "Hiring tools",
      "Job management",
      "Client dashboard",
    ],
    excludes: ["Marketing Advisor", "Performance Dashboard", "Creative Concierge"],
    cta: { label: "Start Free", kind: "start", href: "/dashboard" },
    accent: "text-white/80",
    ring: "border-white/12",
    glow: "bg-white/10",
  },
  {
    id: "agency",
    name: "Agency",
    gem: "command",
    priceLabel: "$299.99",
    cadence: "/ month",
    positioning: "For brands and agencies managing creative work consistently.",
    description:
      "Built for organizations producing content regularly and managing ongoing creative relationships.",
    inheritsFrom: "Everything in Free, plus",
    features: [
      "Marketing Advisor",
      "Performance Dashboard",
      "Creative Concierge",
      "Increased file storage",
      "Increased data storage",
      "Increased workspace capacity",
      "Support for recurring creative operations",
      "Larger project capacity",
      "Priority support",
    ],
    cta: { label: "Upgrade to Agency", kind: "agency" },
    accent: "text-escrow-green",
    ring: "border-client-green/40",
    glow: "bg-client-green/25",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    gem: "building",
    priceLabel: "Contact us",
    positioning: "For companies where media is not occasional — it's operational.",
    description:
      "Enterprise gives content, media, marketing, and creative departments the structure, visibility, storage, and coordination required to run creative operations at scale.",
    inheritsFrom: "Everything in Agency, plus",
    features: [
      "Massive storage capacity",
      "Department structure",
      "Internal task assignment",
      "Team workload tracking",
      "Shared company asset library",
      "Internal messaging channels",
      "Approval workflows",
      "Enhanced visibility when posting jobs",
    ],
    cta: { label: "Talk to Enterprise", kind: "enterprise" },
    highlight: true,
    badge: "BUILT FOR SCALE",
    accent: "text-aerial-cyan",
    ring: "border-grid-blue/45",
    glow: "bg-grid-blue/30",
  },
];

export const clientTierById = (id: ClientPlanId) =>
  CLIENT_TIERS.find((t) => t.id === id);

/* -------------------------------------------------------------------------- */
/*  Comparison matrix                                                          */
/* -------------------------------------------------------------------------- */

export type CompareRow = {
  label: string;
  free: boolean;
  agency: boolean;
  enterprise: boolean;
};

export const COMPARISON: CompareRow[] = [
  { label: "Post Jobs", free: true, agency: true, enterprise: true },
  { label: "Browse Creatives", free: true, agency: true, enterprise: true },
  { label: "Advanced Filters", free: true, agency: true, enterprise: true },
  { label: "Messaging", free: true, agency: true, enterprise: true },
  { label: "Contracts", free: true, agency: true, enterprise: true },
  { label: "Payments", free: true, agency: true, enterprise: true },
  { label: "Escrow", free: true, agency: true, enterprise: true },
  { label: "File Uploads", free: true, agency: true, enterprise: true },
  { label: "Project Tracking", free: true, agency: true, enterprise: true },
  { label: "Marketing Advisor", free: false, agency: true, enterprise: true },
  { label: "Performance Dashboard", free: false, agency: true, enterprise: true },
  { label: "Creative Concierge", free: false, agency: true, enterprise: true },
  { label: "Increased Storage", free: false, agency: true, enterprise: true },
  { label: "Massive Storage", free: false, agency: false, enterprise: true },
  { label: "Department Structure", free: false, agency: false, enterprise: true },
  { label: "Internal Task Assignment", free: false, agency: false, enterprise: true },
  { label: "Team Workload Tracking", free: false, agency: false, enterprise: true },
  { label: "Shared Company Asset Library", free: false, agency: false, enterprise: true },
  { label: "Internal Messaging Channels", free: false, agency: false, enterprise: true },
  { label: "Approval Workflows", free: false, agency: false, enterprise: true },
  { label: "Enhanced Job Visibility", free: false, agency: false, enterprise: true },
];

/* -------------------------------------------------------------------------- */
/*  Enterprise showcase blocks                                                 */
/* -------------------------------------------------------------------------- */

export type ShowcaseBlock = { icon: IconName; title: string; body: string };

export const ENTERPRISE_SHOWCASE: ShowcaseBlock[] = [
  {
    icon: "building",
    title: "Department Structure",
    body: "Organize teams, divisions, and creative functions under one operational system.",
  },
  {
    icon: "list",
    title: "Internal Task Assignment",
    body: "Assign deliverables, responsibilities, deadlines, and approvals.",
  },
  {
    icon: "chart",
    title: "Team Workload Tracking",
    body: "Understand capacity, utilization, and project distribution across departments.",
  },
  {
    icon: "grid",
    title: "Shared Company Asset Library",
    body: "Store and organize brand assets, project files, media, documents, and resources.",
  },
  {
    icon: "comment",
    title: "Internal Messaging Channels",
    body: "Create communication spaces around teams, projects, departments, and campaigns.",
  },
  {
    icon: "verified",
    title: "Approval Workflows",
    body: "Review, approve, reject, and request revisions through structured workflows.",
  },
  {
    icon: "target",
    title: "Enhanced Job Visibility",
    body: "Increase visibility and placement of job postings when hiring creatives.",
  },
];

/** Company-size options for the Enterprise / Agency contact form. */
export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];

/** Navy → deep-green → black palette for the moving background (no pink pulse). */
export const CLIENT_BG = ["#2a6cc7", "#15566f", "#0f6b4e", "#0a3f30", "#050d10"];
