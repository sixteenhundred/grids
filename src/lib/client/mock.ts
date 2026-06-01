/**
 * Professional dummy data for the client demo. Centralised so pages stay clean.
 * All ids are stable strings (no Date.now / random) so SSR and client match.
 */

import type { IconName } from "@/components/dashboard/icons";

/* -------------------------------------------------------------------------- */
/*  Company                                                                    */
/* -------------------------------------------------------------------------- */

export type CompanyProfile = {
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  founded: string;
  tagline: string;
  shortDescription: string;
  about: string;
  mission: string;
  values: string[];
  toneOfVoice: string;
  visualStyle: string;
  brandColors: string[];
  hiresFor: string[];
  budgetRange: string;
  responseTime: string;
  completedProjects: number;
  reviewScore: number;
  socials: { label: string; handle: string }[];
  published: boolean;
};

export const DEFAULT_COMPANY: CompanyProfile = {
  name: "Northline Studios",
  industry: "Hospitality & Lifestyle Media",
  size: "51–200",
  location: "Oslo, Norway",
  website: "northline.studio",
  email: "hello@northline.studio",
  phone: "+47 21 00 00 00",
  founded: "2017",
  tagline: "Premium content operations for hospitality brands.",
  shortDescription: "We run end-to-end creative production for hotels, restaurants and lifestyle brands across the Nordics.",
  about:
    "Northline Studios is a hospitality-focused content operation. We plan, produce and ship photography, film and social content for premium hotels, restaurants and lifestyle groups. Our in-house team coordinates external creatives, manages approvals and delivers on time, every time.",
  mission: "Make world-class creative production effortless for hospitality brands.",
  values: ["Craft over volume", "On-time, every time", "Radical clarity", "Creatives first"],
  toneOfVoice: "Confident, warm, editorial",
  visualStyle: "Cinematic, natural light, refined",
  brandColors: ["#0f3d2e", "#13294b", "#c9a35e", "#f4f1ea"],
  hiresFor: ["Photography", "Cinematography", "Drone", "Food styling", "Editing", "Social content"],
  budgetRange: "$2,000 – $25,000 / project",
  responseTime: "Under 4 hours",
  completedProjects: 214,
  reviewScore: 4.9,
  socials: [
    { label: "Instagram", handle: "@northline.studio" },
    { label: "LinkedIn", handle: "Northline Studios" },
    { label: "Web", handle: "northline.studio" },
  ],
  published: true,
};

export const COMPANY_SLUG = "northline-studios";

/* -------------------------------------------------------------------------- */
/*  Dashboard overview                                                         */
/* -------------------------------------------------------------------------- */

export type OverviewStat = { key: string; label: string; value: string; sub?: string; icon: IconName; href: string };

export const OVERVIEW_STATS: OverviewStat[] = [
  { key: "jobs", label: "Active jobs", value: "6", sub: "42 applicants", icon: "briefcase", href: "/client/jobs" },
  { key: "projects", label: "Active projects", value: "8", sub: "3 due this week", icon: "kanban", href: "/client/projects" },
  { key: "approvals", label: "Pending approvals", value: "14", sub: "4 overdue", icon: "verified", href: "/client/approval-workflows" },
  { key: "spend", label: "Monthly spend", value: "$18,400", sub: "+12% MoM", icon: "wallet", href: "/client/performance" },
  { key: "files", label: "Uploaded files", value: "1,284", sub: "318 GB used", icon: "folder", href: "/client/files" },
  { key: "saved", label: "Saved creatives", value: "27", sub: "9 available now", icon: "bookmark", href: "/dashboard/browse" },
  { key: "team", label: "Team members", value: "18", sub: "across 4 departments", icon: "users", href: "/client/team-workload" },
  { key: "plan", label: "Current plan", value: "Enterprise", sub: "Demo — all unlocked", icon: "star", href: "/client/subscriptions" },
];

/* -------------------------------------------------------------------------- */
/*  Jobs                                                                       */
/* -------------------------------------------------------------------------- */

export type JobStatus = "active" | "draft" | "completed" | "paused" | "closed";
export type Job = {
  id: string;
  title: string;
  category: string;
  status: JobStatus;
  applicants: number;
  budget: string;
  deadline: string;
  location: string;
  mode: "Remote" | "On-site" | "Hybrid";
  visibility: "Standard" | "Enhanced";
  description: string;
};

export const MOCK_JOBS: Job[] = [
  { id: "job-1", title: "Hotel launch — twilight photography", category: "Photography", status: "active", applicants: 18, budget: "$6,500", deadline: "2026-06-20", location: "Oslo, NO", mode: "On-site", visibility: "Enhanced", description: "Full-day twilight exterior + suite interiors for a new flagship property." },
  { id: "job-2", title: "Restaurant reel series (6x)", category: "Social Content", status: "active", applicants: 11, budget: "$4,200", deadline: "2026-06-14", location: "Remote", mode: "Remote", visibility: "Standard", description: "Six vertical reels for a fine-dining launch campaign." },
  { id: "job-3", title: "Drone aerial — fjord resort", category: "Drone", status: "active", applicants: 7, budget: "$3,800", deadline: "2026-06-28", location: "Bergen, NO", mode: "On-site", visibility: "Enhanced", description: "Licensed drone pilot for aerial hero footage of a fjord-side resort." },
  { id: "job-4", title: "Brand film — 90s hero", category: "Cinematography", status: "active", applicants: 6, budget: "$14,000", deadline: "2026-07-05", location: "Oslo, NO", mode: "Hybrid", visibility: "Enhanced", description: "Cinematic brand film, crew of 4, two shoot days." },
  { id: "job-5", title: "Food styling + stills", category: "Food", status: "draft", applicants: 0, budget: "$2,400", deadline: "2026-07-12", location: "Oslo, NO", mode: "On-site", visibility: "Standard", description: "Seasonal menu stills with on-set food stylist." },
  { id: "job-6", title: "Event coverage — gala", category: "Events", status: "active", applicants: 0, budget: "$3,000", deadline: "2026-06-30", location: "Oslo, NO", mode: "On-site", visibility: "Standard", description: "Two-photographer team for an evening partner gala." },
  { id: "job-7", title: "Spring campaign — completed", category: "Photography", status: "completed", applicants: 22, budget: "$9,800", deadline: "2026-04-02", location: "Oslo, NO", mode: "On-site", visibility: "Standard", description: "Completed spring lifestyle campaign across three properties." },
];

export const JOB_CATEGORIES = ["Photography", "Cinematography", "Drone", "Social Content", "Food", "Events", "Editing", "Production"];

/* -------------------------------------------------------------------------- */
/*  Projects                                                                   */
/* -------------------------------------------------------------------------- */

export type ProjectStatus = "in-progress" | "review" | "complete" | "revision";
export type Project = {
  id: string;
  name: string;
  creative: string;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  budget: string;
  payment: "Funded" | "Released" | "Pending";
  contract: "Signed" | "Draft";
  deliverables: { label: string; done: boolean }[];
};

export const MOCK_PROJECTS: Project[] = [
  { id: "prj-1", name: "Flagship hotel launch", creative: "Sara Lindqvist", status: "in-progress", progress: 65, deadline: "2026-06-22", budget: "$6,500", payment: "Funded", contract: "Signed", deliverables: [{ label: "Exteriors", done: true }, { label: "Suites", done: true }, { label: "Amenities", done: false }, { label: "Final edit", done: false }] },
  { id: "prj-2", name: "Restaurant reel series", creative: "Mikkel Brun", status: "review", progress: 90, deadline: "2026-06-14", budget: "$4,200", payment: "Funded", contract: "Signed", deliverables: [{ label: "Reels 1–3", done: true }, { label: "Reels 4–6", done: true }, { label: "Color grade", done: false }] },
  { id: "prj-3", name: "Fjord resort aerials", creative: "Aerial Co.", status: "in-progress", progress: 40, deadline: "2026-06-28", budget: "$3,800", payment: "Funded", contract: "Signed", deliverables: [{ label: "Scout", done: true }, { label: "Shoot day", done: false }, { label: "Delivery", done: false }] },
  { id: "prj-4", name: "Brand film — hero", creative: "Studio Nord", status: "revision", progress: 75, deadline: "2026-07-05", budget: "$14,000", payment: "Funded", contract: "Signed", deliverables: [{ label: "Pre-pro", done: true }, { label: "Shoot", done: true }, { label: "Edit v1", done: true }, { label: "Edit v2", done: false }] },
  { id: "prj-5", name: "Spring lifestyle campaign", creative: "Sara Lindqvist", status: "complete", progress: 100, deadline: "2026-04-02", budget: "$9,800", payment: "Released", contract: "Signed", deliverables: [{ label: "Shoot", done: true }, { label: "Edit", done: true }, { label: "Delivery", done: true }] },
];

/* -------------------------------------------------------------------------- */
/*  Files                                                                      */
/* -------------------------------------------------------------------------- */

export type ClientFile = { id: string; name: string; type: "image" | "video" | "doc" | "audio"; size: string; project: string; date: string; shared: boolean };

export const MOCK_FILES: ClientFile[] = [
  { id: "f1", name: "hotel-twilight-final.zip", type: "image", size: "2.4 GB", project: "Flagship hotel launch", date: "2026-06-09", shared: true },
  { id: "f2", name: "reel-series-master.mp4", type: "video", size: "880 MB", project: "Restaurant reel series", date: "2026-06-08", shared: true },
  { id: "f3", name: "brand-guidelines-2026.pdf", type: "doc", size: "12 MB", project: "Brand", date: "2026-05-30", shared: false },
  { id: "f4", name: "fjord-aerial-raw.mov", type: "video", size: "5.1 GB", project: "Fjord resort aerials", date: "2026-06-10", shared: false },
  { id: "f5", name: "menu-stills-selects.zip", type: "image", size: "640 MB", project: "Food styling", date: "2026-06-02", shared: true },
  { id: "f6", name: "voiceover-scratch.wav", type: "audio", size: "48 MB", project: "Brand film", date: "2026-06-04", shared: false },
];

export const STORAGE_USED_GB = 318;
export const STORAGE_TOTAL_GB = 2048;

/* -------------------------------------------------------------------------- */
/*  Departments + team                                                         */
/* -------------------------------------------------------------------------- */

export type Department = { id: string; name: string; lead: string; members: number; projects: number; budget: string; storage: string };

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "d1", name: "Marketing", lead: "Ingrid Hansen", members: 6, projects: 4, budget: "$42,000", storage: "120 GB" },
  { id: "d2", name: "Social Media", lead: "Jonas Aas", members: 4, projects: 3, budget: "$18,000", storage: "64 GB" },
  { id: "d3", name: "Events", lead: "Maya Holm", members: 3, projects: 1, budget: "$26,000", storage: "38 GB" },
  { id: "d4", name: "Brand Partnerships", lead: "Erik Dahl", members: 5, projects: 2, budget: "$31,000", storage: "96 GB" },
];

export type TeamMember = { id: string; name: string; role: string; department: string; tasks: number; projects: number; capacity: number; status: "Available" | "Busy" | "Overloaded" };

export const MOCK_TEAM: TeamMember[] = [
  { id: "t1", name: "Ingrid Hansen", role: "Marketing Lead", department: "Marketing", tasks: 7, projects: 4, capacity: 82, status: "Busy" },
  { id: "t2", name: "Jonas Aas", role: "Social Manager", department: "Social Media", tasks: 11, projects: 3, capacity: 96, status: "Overloaded" },
  { id: "t3", name: "Maya Holm", role: "Events Producer", department: "Events", tasks: 4, projects: 1, capacity: 48, status: "Available" },
  { id: "t4", name: "Erik Dahl", role: "Partnerships Lead", department: "Brand Partnerships", tasks: 6, projects: 2, capacity: 70, status: "Busy" },
  { id: "t5", name: "Nora Berg", role: "Content Producer", department: "Marketing", tasks: 5, projects: 2, capacity: 60, status: "Available" },
  { id: "t6", name: "Lars Vik", role: "Editor", department: "Social Media", tasks: 9, projects: 3, capacity: 88, status: "Busy" },
];

/* -------------------------------------------------------------------------- */
/*  Tasks                                                                      */
/* -------------------------------------------------------------------------- */

export type TaskStatus = "todo" | "in-progress" | "done";
export type Task = { id: string; title: string; assignee: string; department: string; project: string; priority: "Low" | "Medium" | "High"; status: TaskStatus; due: string };

export const MOCK_TASKS: Task[] = [
  { id: "tk1", title: "Brief twilight shoot creative", assignee: "Ingrid Hansen", department: "Marketing", project: "Flagship hotel launch", priority: "High", status: "in-progress", due: "2026-06-12" },
  { id: "tk2", title: "Approve reel cuts 4–6", assignee: "Jonas Aas", department: "Social Media", project: "Restaurant reel series", priority: "High", status: "todo", due: "2026-06-13" },
  { id: "tk3", title: "Confirm drone permits", assignee: "Maya Holm", department: "Events", project: "Fjord resort aerials", priority: "Medium", status: "todo", due: "2026-06-15" },
  { id: "tk4", title: "Send partner gala invites", assignee: "Erik Dahl", department: "Brand Partnerships", project: "Event coverage", priority: "Medium", status: "in-progress", due: "2026-06-18" },
  { id: "tk5", title: "Archive spring campaign assets", assignee: "Nora Berg", department: "Marketing", project: "Spring lifestyle campaign", priority: "Low", status: "done", due: "2026-06-01" },
  { id: "tk6", title: "Grade brand film v2", assignee: "Lars Vik", department: "Social Media", project: "Brand film — hero", priority: "High", status: "in-progress", due: "2026-06-25" },
];

/* -------------------------------------------------------------------------- */
/*  Internal messaging                                                         */
/* -------------------------------------------------------------------------- */

export type Channel = { id: string; name: string; messages: { id: string; author: string; text: string; time: string; pinned?: boolean }[] };

export const MOCK_CHANNELS: Channel[] = [
  { id: "c1", name: "marketing", messages: [
    { id: "m1", author: "Ingrid Hansen", text: "Twilight shoot is locked for the 20th — creative briefed.", time: "09:12", pinned: true },
    { id: "m2", author: "Nora Berg", text: "Great. I'll prep the shot list today.", time: "09:20" },
  ] },
  { id: "c2", name: "campaigns", messages: [
    { id: "m3", author: "Jonas Aas", text: "Reel series performing well in early tests 🔥", time: "11:02" },
  ] },
  { id: "c3", name: "approvals", messages: [
    { id: "m4", author: "Erik Dahl", text: "Need sign-off on brand film v2 by Friday.", time: "14:40", pinned: true },
  ] },
  { id: "c4", name: "content-calendar", messages: [] },
  { id: "c5", name: "events", messages: [] },
  { id: "c6", name: "urgent-creative", messages: [
    { id: "m5", author: "Maya Holm", text: "Replacement photographer needed for the gala — anyone?", time: "16:05" },
  ] },
];

/* -------------------------------------------------------------------------- */
/*  Approvals                                                                  */
/* -------------------------------------------------------------------------- */

export type ApprovalStatus = "pending" | "approved" | "revision" | "rejected";
export type Approval = { id: string; title: string; project: string; reviewer: string; deadline: string; status: ApprovalStatus; comments: { author: string; text: string }[] };

export const MOCK_APPROVALS: Approval[] = [
  { id: "a1", title: "Hotel twilight — final selects", project: "Flagship hotel launch", reviewer: "Ingrid Hansen", deadline: "2026-06-12", status: "pending", comments: [] },
  { id: "a2", title: "Reel series — cuts 4–6", project: "Restaurant reel series", reviewer: "Jonas Aas", deadline: "2026-06-13", status: "pending", comments: [{ author: "Jonas Aas", text: "Tighten the intro on reel 5." }] },
  { id: "a3", title: "Brand film — edit v1", project: "Brand film — hero", reviewer: "Erik Dahl", deadline: "2026-06-10", status: "revision", comments: [{ author: "Erik Dahl", text: "Logo lingers too long at the end." }] },
  { id: "a4", title: "Spring campaign — delivery", project: "Spring lifestyle campaign", reviewer: "Ingrid Hansen", deadline: "2026-04-02", status: "approved", comments: [] },
];

/* -------------------------------------------------------------------------- */
/*  Asset library                                                              */
/* -------------------------------------------------------------------------- */

export type Asset = { id: string; name: string; category: string; type: "image" | "video" | "doc" | "palette" | "font"; collection: string; archived?: boolean };

export const MOCK_ASSETS: Asset[] = [
  { id: "as1", name: "Northline Logo Suite", category: "Logos", type: "image", collection: "Brand" },
  { id: "as2", name: "Brand Color Palette", category: "Colors", type: "palette", collection: "Brand" },
  { id: "as3", name: "Editorial Serif Family", category: "Fonts", type: "font", collection: "Brand" },
  { id: "as4", name: "Hotel Launch Hero.mp4", category: "Campaign assets", type: "video", collection: "Hotel Launch" },
  { id: "as5", name: "Spring Campaign Selects", category: "Edited content", type: "image", collection: "Spring 2026" },
  { id: "as6", name: "Fjord Aerials RAW", category: "Raw footage", type: "video", collection: "Hotel Launch" },
  { id: "as7", name: "Master Services Agreement", category: "Documents", type: "doc", collection: "Legal" },
];

export const ASSET_COLLECTIONS = ["Brand", "Hotel Launch", "Spring 2026", "Legal"];

/* -------------------------------------------------------------------------- */
/*  Performance                                                                */
/* -------------------------------------------------------------------------- */

export const PERF_MONTHLY_SPEND = [9200, 11800, 10400, 14600, 16200, 18400];
export const PERF_CONTENT_VOLUME = [42, 58, 51, 73, 88, 104];
export const PERF_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const PERF_STATS = [
  { label: "Project completion rate", value: "94%" },
  { label: "Avg. delivery time", value: "6.2 days" },
  { label: "Best category", value: "Photography" },
  { label: "Content output (mo)", value: "104 assets" },
  { label: "ROI (placeholder)", value: "3.8x" },
  { label: "Engagement lift", value: "+27%" },
];

export const TOP_CREATORS = [
  { name: "Sara Lindqvist", category: "Photography", projects: 9, score: 4.9 },
  { name: "Mikkel Brun", category: "Social Content", projects: 7, score: 4.8 },
  { name: "Studio Nord", category: "Cinematography", projects: 5, score: 5.0 },
  { name: "Aerial Co.", category: "Drone", projects: 4, score: 4.7 },
];

/* -------------------------------------------------------------------------- */
/*  Creative concierge matches + marketing advisor                             */
/* -------------------------------------------------------------------------- */

export const CONCIERGE_MATCHES = [
  { name: "Sara Lindqvist", type: "Real-estate & hospitality photographer", city: "Oslo", rate: "$1,200/day", score: 96 },
  { name: "Studio Nord", type: "Cinematography collective", city: "Oslo", rate: "$3,500/day", score: 92 },
  { name: "Mikkel Brun", type: "Social-first content creator", city: "Remote", rate: "$700/day", score: 89 },
];

export const ADVISOR_CAMPAIGNS = [
  { title: "Seasonal 'Nordic Winter Escapes'", body: "A 6-week campaign pairing cinematic suite films with UGC-style reels to drive winter bookings." },
  { title: "'Behind the Pass' chef series", body: "Short documentary-style content following signature dishes from sourcing to plating." },
  { title: "Partner co-branded launch", body: "Co-produced content with a lifestyle partner to expand reach into a new audience segment." },
];

export const ADVISOR_BRIEFS = [
  { title: "Creative brief — Suite Film", body: "Cinematic 60s film. Natural light, slow push-ins, warm grade. Deliver 16:9 + 9:16. Two shoot days." },
  { title: "Creative brief — Reel Pack", body: "6 vertical reels, fast-cut, trending audio. Hook in first 1.5s. Deliver captions + 3 thumbnail options." },
];

export const ADVISOR_STRATEGY = [
  { title: "Monthly strategy — June", body: "12 posts, 6 reels, 1 hero film. Theme: summer terrace dining. 40% organic / 60% paid split." },
];
