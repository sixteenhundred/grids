/**
 * MY OPERATION™ — the creator's operational HQ.
 *
 * Static/derived demo data that feeds every widget, plus a localStorage
 * workspace config (name, banner, accent, widget order/hidden/collapsed) so
 * each user can make the HQ their own. Swap data for live platform feeds and
 * config for a `workspace` table when ready.
 */

import type { Accent } from "./grid-data";
import type { IconName } from "@/components/dashboard/icons";

export { fileToImageDataUrl } from "./shop";

export const money = (n: number) => `$${n.toLocaleString()}`;

/* -------------------------------------------------------------------------- */
/*  Stages                                                                     */
/* -------------------------------------------------------------------------- */

export const OP_STAGES = [
  "Lead",
  "Negotiation",
  "Contract",
  "Pre-Production",
  "Production",
  "Editing",
  "Review",
  "Revision",
  "Delivery",
  "Completed",
] as const;
export type OpStage = (typeof OP_STAGES)[number];

export const STAGE_ACCENT: Record<OpStage, Accent> = {
  Lead: "cyan",
  Negotiation: "purple",
  Contract: "blue",
  "Pre-Production": "blue",
  Production: "gold",
  Editing: "purple",
  Review: "cyan",
  Revision: "red",
  Delivery: "escrow",
  Completed: "escrow",
};

export function stageProgress(stage: OpStage): number {
  const i = OP_STAGES.indexOf(stage);
  return Math.round((i / (OP_STAGES.length - 1)) * 100);
}

/* -------------------------------------------------------------------------- */
/*  Status bar                                                                 */
/* -------------------------------------------------------------------------- */

export const STATUS = {
  projectsActive: 8,
  waitingClient: 3,
  editing: 4,
  paymentsPending: 2,
  contractsPending: 1,
  revenueMonth: 8250,
  availableDays: 6,
  unreadMessages: 4,
};

/* -------------------------------------------------------------------------- */
/*  Today's priorities                                                         */
/* -------------------------------------------------------------------------- */

export type Urgency = "high" | "med" | "low";
export type Priority = { id: string; label: string; sub: string; urgency: Urgency; icon: IconName; href?: string };

export const PRIORITIES: Priority[] = [
  { id: "p1", label: "Deliver Porsche Edit", sub: "Due today · Meridian Auto", urgency: "high", icon: "upload", href: "/dashboard/transfer" },
  { id: "p2", label: "Approve contract — Bel Air", sub: "Awaiting your signature", urgency: "high", icon: "file", href: "/dashboard/contracts" },
  { id: "p3", label: "Invoice GMZ Group", sub: "$3,200 · 4 days overdue", urgency: "high", icon: "wallet", href: "/dashboard/finance" },
  { id: "p4", label: "Send preview gallery", sub: "Azure Hotels · Suite Campaign", urgency: "med", icon: "camera", href: "/dashboard/transfer" },
  { id: "p5", label: "Review revision request", sub: "Vogue Living · 2 notes", urgency: "med", icon: "comment", href: "/dashboard/projects" },
  { id: "p6", label: "Book equipment", sub: "Gimbal + drone for Fri shoot", urgency: "low", icon: "video" },
  { id: "p7", label: "Follow up — Lumen Festival", sub: "Proposal sent 3 days ago", urgency: "low", icon: "send", href: "/dashboard/sales" },
];

export const URGENCY_META: Record<Urgency, { label: string; tone: Accent; dot: string }> = {
  high: { label: "Now", tone: "red", dot: "bg-urgent-red" },
  med: { label: "Soon", tone: "gold", dot: "bg-review-gold" },
  low: { label: "This week", tone: "cyan", dot: "bg-aerial-cyan" },
};

/* -------------------------------------------------------------------------- */
/*  Active operations                                                          */
/* -------------------------------------------------------------------------- */

export type Payment = "Paid" | "Pending" | "In escrow";
export type Operation = {
  id: string;
  client: string;
  project: string;
  stage: OpStage;
  due: string;
  payment: Payment;
  value: number;
  activity: string;
  tile: { from: string; to: string; title: string };
};

const T = (from: string, to: string) => ({ from, to, title: "" });

export const OPERATIONS: Operation[] = [
  { id: "o1", client: "Meridian Auto", project: "Porsche brand film", stage: "Editing", due: "Today", payment: "In escrow", value: 9000, activity: "Rough cut shared for internal review", tile: T("#22384a", "#080e12") },
  { id: "o2", client: "Northwind Studio", project: "Signature Estate — Bel Air", stage: "Review", due: "Jun 4", payment: "In escrow", value: 7150, activity: "Delivered selects — awaiting approval", tile: T("#1b2a4a", "#0a0c12") },
  { id: "o3", client: "Azure Hotels", project: "Suite Campaign — Miami", stage: "Production", due: "Jun 12", payment: "Pending", value: 11000, activity: "Shoot day 1 wrapped", tile: T("#0c3b5c", "#0a0f14") },
  { id: "o4", client: "Vogue Living", project: "Penthouse Editorial — NYC", stage: "Revision", due: "Jun 7", payment: "In escrow", value: 6000, activity: "Client requested 2 reframes", tile: T("#3a3320", "#0f0d08") },
  { id: "o5", client: "GMZ Group", project: "Retail launch stills", stage: "Delivery", due: "Jun 2", payment: "Pending", value: 3200, activity: "Final folder ready to send", tile: T("#3a2438", "#0d0a10") },
  { id: "o6", client: "Coastline Realty", project: "Cliffside villa", stage: "Contract", due: "Jun 9", payment: "Pending", value: 4000, activity: "Contract sent for signature", tile: T("#163a3a", "#08100f") },
];

/* -------------------------------------------------------------------------- */
/*  Timeline                                                                   */
/* -------------------------------------------------------------------------- */

export type Event = { day: string; label: string; sub: string; icon: IconName; tone: Accent };
export const TIMELINE: Event[] = [
  { day: "Today", label: "Deliver Porsche edit", sub: "16:00 · Meridian Auto", icon: "upload", tone: "red" },
  { day: "Tomorrow", label: "Cliffside villa shoot", sub: "07:30 · Malibu", icon: "camera", tone: "gold" },
  { day: "Wed", label: "Payment release", sub: "$7,150 · Northwind", icon: "wallet", tone: "escrow" },
  { day: "Thu", label: "Equipment pickup", sub: "Gimbal + drone", icon: "video", tone: "cyan" },
  { day: "Fri", label: "Suite campaign — day 2", sub: "Miami", icon: "camera", tone: "gold" },
  { day: "Sat", label: "Contract expiring", sub: "Coastline Realty", icon: "file", tone: "red" },
];

/* -------------------------------------------------------------------------- */
/*  Client pipeline                                                            */
/* -------------------------------------------------------------------------- */

export const PIPE_STAGES = [
  { key: "lead", label: "Lead", accent: "#5aa9f5" },
  { key: "contacted", label: "Contacted", accent: "#9a7fe0" },
  { key: "meeting", label: "Meeting", accent: "#f5a14f" },
  { key: "proposal", label: "Proposal", accent: "#0071e3" },
  { key: "won", label: "Won", accent: "#4fd07a" },
] as const;
export type PipeStage = (typeof PIPE_STAGES)[number]["key"];

export type PipeClient = { id: string; name: string; value: number; stage: PipeStage };
export const PIPELINE: PipeClient[] = [
  { id: "c1", name: "Lumen Festival", value: 11000, stage: "proposal" },
  { id: "c2", name: "The Aubrey Hotel", value: 14000, stage: "proposal" },
  { id: "c3", name: "Atlas & Oak", value: 7400, stage: "meeting" },
  { id: "c4", name: "Maison Veil", value: 8200, stage: "contacted" },
  { id: "c5", name: "Solène", value: 6500, stage: "lead" },
  { id: "c6", name: "Vela Swim", value: 6900, stage: "won" },
];

/* -------------------------------------------------------------------------- */
/*  Deliverables                                                               */
/* -------------------------------------------------------------------------- */

export type Deliverable = { label: string; client: string; done: number; total: number; status: string; tone: Accent };
export const DELIVERABLES: Deliverable[] = [
  { label: "Edited photos", client: "Northwind · Bel Air", done: 15, total: 40, status: "In progress", tone: "blue" },
  { label: "Reels", client: "Azure · Suite", done: 0, total: 2, status: "Pending", tone: "gold" },
  { label: "Brand film", client: "Meridian · Porsche", done: 0, total: 1, status: "Awaiting approval", tone: "cyan" },
  { label: "Preview gallery", client: "Vogue · Penthouse", done: 1, total: 1, status: "Revision requested", tone: "red" },
];

/* -------------------------------------------------------------------------- */
/*  Financial command center                                                   */
/* -------------------------------------------------------------------------- */

export const FINANCE = {
  revenueMonth: 8250,
  revenueYear: 96400,
  pending: 14200,
  escrow: 28150,
  productionWallet: 3600,
  outstandingInvoices: 3200,
  clv: 24800,
  avgProject: 6900,
  upcoming: [
    { label: "Northwind — Bel Air", value: 7150, when: "Wed" },
    { label: "Meridian — Porsche", value: 9000, when: "Fri" },
    { label: "Azure — Suite (50%)", value: 5500, when: "Jun 12" },
  ],
  trend: [5.2, 6.1, 5.8, 7.4, 6.9, 8.2, 7.6, 9.0, 8.4, 9.6, 8.9, 8.25],
};

/* -------------------------------------------------------------------------- */
/*  Client health                                                              */
/* -------------------------------------------------------------------------- */

export type ClientHealth = { name: string; score: number; note: string };
export const CLIENT_HEALTH: ClientHealth[] = [
  { name: "Northwind Studio", score: 94, note: "Pays early · 6 repeat projects" },
  { name: "Azure Hotels", score: 88, note: "Fast comms · high value" },
  { name: "Meridian Auto", score: 76, note: "New · responsive" },
  { name: "Vogue Living", score: 63, note: "Slow approvals" },
  { name: "GMZ Group", score: 41, note: "Late payment · overdue invoice" },
];

export function healthTier(score: number): { label: string; tone: Accent } {
  if (score >= 80) return { label: "Great", tone: "escrow" };
  if (score >= 60) return { label: "Average", tone: "gold" };
  return { label: "At risk", tone: "red" };
}

/* -------------------------------------------------------------------------- */
/*  AI operations assistant                                                    */
/* -------------------------------------------------------------------------- */

export type AiInsight = { id: string; text: string; tone: Accent; icon: IconName };
export const AI_INSIGHTS: AiInsight[] = [
  { id: "ai1", text: "GMZ Group hasn’t responded in 5 days — and their invoice is overdue. Send a follow-up?", tone: "red", icon: "comment" },
  { id: "ai2", text: "Coastline Realty contract expires tomorrow. Get it signed to lock the shoot.", tone: "gold", icon: "file" },
  { id: "ai3", text: "Porsche Production Wallet is 12% over estimate. Review before the next expense.", tone: "gold", icon: "wallet" },
  { id: "ai4", text: "You have capacity for 2 more projects this month based on your booked days.", tone: "escrow", icon: "check" },
  { id: "ai5", text: "Invoice GMZ today — payment terms hit the late window at midnight.", tone: "red", icon: "wallet" },
];

/* -------------------------------------------------------------------------- */
/*  Daily operations feed                                                      */
/* -------------------------------------------------------------------------- */

export type FeedItem = { id: string; text: string; when: string; icon: IconName; tone: Accent };
export const OPS_FEED: FeedItem[] = [
  { id: "f1", text: "Northwind signed the Signature Estate contract", when: "9:41", icon: "file", tone: "blue" },
  { id: "f2", text: "Payment received — $5,500 from Azure Hotels", when: "9:12", icon: "wallet", tone: "escrow" },
  { id: "f3", text: "Meridian viewed your Porsche proposal", when: "8:50", icon: "comment", tone: "cyan" },
  { id: "f4", text: "Files delivered — Resort Aerials to Azure", when: "Yesterday", icon: "upload", tone: "escrow" },
  { id: "f5", text: "Revision requested — Vogue Penthouse", when: "Yesterday", icon: "comment", tone: "red" },
  { id: "f6", text: "New lead applied — Solène restaurant", when: "Yesterday", icon: "target", tone: "purple" },
];

/* -------------------------------------------------------------------------- */
/*  Completed / archive                                                        */
/* -------------------------------------------------------------------------- */

export type Archived = { id: string; client: string; project: string; value: number; date: string };
export const ARCHIVE: Archived[] = [
  { id: "ar1", client: "Azure Hotels", project: "Resort Aerials — Palm Jumeirah", value: 5500, date: "May 30" },
  { id: "ar2", client: "Northwind Studio", project: "Hillside Modern — Listing Film", value: 5400, date: "May 12" },
  { id: "ar3", client: "Coastline Realty", project: "Aerial Set", value: 3300, date: "May 2" },
];

/* -------------------------------------------------------------------------- */
/*  Workspace config (localStorage)                                            */
/* -------------------------------------------------------------------------- */

export const WIDGETS: { id: string; title: string; icon: IconName }[] = [
  { id: "priorities", title: "Today’s Priorities", icon: "target" },
  { id: "operations", title: "Active Operations", icon: "kanban" },
  { id: "timeline", title: "Operation Timeline", icon: "calendar" },
  { id: "pipeline", title: "Client Pipeline", icon: "users" },
  { id: "deliverables", title: "Deliverable Tracker", icon: "check" },
  { id: "finance", title: "Financial Command Center", icon: "chart" },
  { id: "health", title: "Client Health", icon: "heart" },
  { id: "ai", title: "AI Operations Assistant", icon: "sparkles" },
  { id: "feed", title: "Daily Operations Feed", icon: "bell" },
  { id: "archive", title: "Completed Operations", icon: "folder" },
];

export const ACCENTS: { key: Accent; label: string; dot: string }[] = [
  { key: "blue", label: "Grid Blue", dot: "bg-grid-blue" },
  { key: "cyan", label: "Aerial", dot: "bg-aerial-cyan" },
  { key: "purple", label: "Studio", dot: "bg-ai-purple" },
  { key: "escrow", label: "Emerald", dot: "bg-escrow-green" },
  { key: "gold", label: "Luxury", dot: "bg-review-gold" },
  { key: "red", label: "Cinematic", dot: "bg-urgent-red" },
];

export type Workspace = {
  name: string;
  banner: string | null;
  accent: Accent;
  order: string[];
  hidden: string[];
  collapsed: string[];
};

const KEY = "grid:operation";

export const DEFAULT_WORKSPACE: Workspace = {
  name: "My Operation",
  banner: null,
  accent: "blue",
  order: WIDGETS.map((w) => w.id),
  hidden: [],
  collapsed: [],
};

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_WORKSPACE;
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    // Ensure any new widgets are included and unknown ids dropped.
    const known = WIDGETS.map((w) => w.id);
    const order = [...(parsed.order ?? []).filter((id) => known.includes(id)), ...known.filter((id) => !(parsed.order ?? []).includes(id))];
    return { ...DEFAULT_WORKSPACE, ...parsed, order };
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export function saveWorkspace(w: Workspace): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* ignore */
  }
}
