/**
 * GRID Trust Center — data model + content.
 *
 * Realises the Trust Center sitemap (Implementation Package Part 4 / PRD 1) and
 * the transparency duties of the GRID Constitution: a single, plain-language,
 * public hub explaining how GRID handles data, money, security and AI.
 *
 * Content here is plain-language SUMMARY + disclosure. Where a binding legal
 * document still needs counsel review it is marked `status: "in-review"` rather
 * than presenting unverified text as final (Constitution, Article XVII —
 * truthful communication; marketing must not exceed reality).
 *
 * Pure data (no DB) so the Trust Center works on any deployment.
 */

import type { Accent } from "./grid-data";
import type { IconName } from "@/components/dashboard/icons";

export type TrustSectionBlock = { heading: string; body: string[] };

export type TrustDoc = {
  path: string; // unique, used as /trust/<path>
  title: string;
  category: string; // TrustCategory.id
  version: string;
  updated: string; // effective / last-reviewed date
  status: "published" | "in-review";
  summary: string; // one-paragraph plain-language summary
  sections?: TrustSectionBlock[];
};

export type TrustCategory = {
  id: string;
  title: string;
  blurb: string;
  icon: IconName;
  tone: Accent;
};

export const TRUST_UPDATED = "2026-06-01";

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

export const TRUST_CATEGORIES: TrustCategory[] = [
  { id: "principles", title: "Principles", blurb: "The constitution that governs every GRID decision.", icon: "shield", tone: "purple" },
  { id: "legal", title: "Legal", blurb: "Terms, agreements and platform rules — in plain language.", icon: "file", tone: "blue" },
  { id: "privacy", title: "Privacy", blurb: "What we collect, why, and the controls you hold.", icon: "lock", tone: "cyan" },
  { id: "security", title: "Security", blurb: "How your account, data and files are protected.", icon: "shield", tone: "escrow" },
  { id: "payments", title: "Payments & Escrow", blurb: "How money moves, escrow, fees and the production wallet.", icon: "wallet", tone: "gold" },
  { id: "ai", title: "AI Transparency", blurb: "How GRID uses AI, its limits, and your controls.", icon: "sparkles", tone: "purple" },
  { id: "rights", title: "Your Rights", blurb: "Access, export, correct, delete — and how to exercise each.", icon: "user", tone: "blue" },
  { id: "transparency", title: "Transparency", blurb: "Reports, requests and how we account for our power.", icon: "chart", tone: "cyan" },
  { id: "status", title: "System Status", blurb: "Live operational status and incident history.", icon: "trending", tone: "escrow" },
  { id: "contact", title: "Contact", blurb: "Reach privacy, security, legal and support directly.", icon: "mail", tone: "blue" },
];

export function trustCategory(id: string): TrustCategory | undefined {
  return TRUST_CATEGORIES.find((c) => c.id === id);
}

/* -------------------------------------------------------------------------- */
/*  Documents                                                                  */
/* -------------------------------------------------------------------------- */

const V = "1.0";

export const TRUST_DOCS: TrustDoc[] = [
  /* ---- Principles: the published Constitution -------------------------- */
  {
    path: "principles/constitution",
    title: "The GRID Constitution",
    category: "principles",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary:
      "GRID publishes the principles that govern us when no policy exists — placed above profit, growth and trends. We hold ourselves to them publicly so you can hold us to them too.",
    sections: [
      { heading: "The user comes first", body: ["Users are participants in the ecosystem — not products, inventory, assets or data sources. When interests conflict, long-term trust takes priority over short-term gain."] },
      { heading: "Transparency", body: ["We strive to explain fees, pricing, subscriptions, AI usage, data collection, policies and moderation. You should not need legal training to understand how GRID operates. Complexity will not be used as a shield."] },
      { heading: "No dark patterns", body: ["We do not use hidden costs, misleading design, confusing cancellations, artificial urgency, forced consent, trick wording or misleading defaults. The objective is informed choice, never manipulated choice."] },
      { heading: "Privacy & security", body: ["Privacy is a right, not a feature: we collect only what is reasonably necessary and retain only what we must. Security is a responsibility, not a slogan — we describe protections accurately and never claim perfection."] },
      { heading: "Power, algorithms & AI", body: ["Every role, administrator and algorithm creates power, so power must always be constrained, auditable and accountable. Algorithms must be reviewable and challengeable and must not secretly discriminate, punish or favour. AI assists humans; it never replaces accountability or judgment — when uncertain, human review takes priority."] },
      { heading: "Money & disputes", body: ["Every financial system prioritises transparency, evidence, auditability and fairness: no hidden fees, balances, deductions or transfers. Disputes are inevitable; the goal is resolving them fairly — documented, reviewable, explainable and appealable."] },
      { heading: "The tests we apply", body: ["The Trust Test — if every user knew exactly how this worked, would we still be comfortable? The Courtroom Test — could we confidently explain why it happened, how, who approved it and what evidence exists? If not, the decision gets further review."] },
    ],
  },

  /* ---- Legal ----------------------------------------------------------- */
  {
    path: "legal/terms",
    title: "Terms of Service",
    category: "legal",
    version: V,
    updated: TRUST_UPDATED,
    status: "in-review",
    summary: "The agreement between you and GRID for using the platform — your account, acceptable use, the role GRID plays as marketplace infrastructure, and how disputes are handled.",
    sections: [
      { heading: "What GRID is", body: ["GRID is marketplace infrastructure, a transaction facilitator and an escrow facilitator. GRID is not a bank, insurer, lender, investment platform or financial advisor."] },
      { heading: "Plain-language summary", body: ["You keep ownership of your work and content. You agree to use GRID lawfully and not to abuse other users or the platform. Payments for projects flow through escrow. Either side can open a documented, appealable dispute."] },
      { heading: "Status", body: ["The full binding Terms are being finalised with counsel. This page is a plain-language summary; the complete text will be published here with a version number and effective date before launch."] },
    ],
  },
  { path: "legal/acceptable-use", title: "Acceptable Use Policy", category: "legal", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "What you can and cannot do on GRID: no fraud, harassment, scams, IP infringement, malware or circumvention of payments. Violations are handled consistently with evidence and an appeal path." },
  { path: "legal/community", title: "Community Guidelines", category: "legal", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "How the GRID community treats one another. Moderation prioritises consistency, fairness, evidence and transparency — never popularity, influence, revenue or status." },
  {
    path: "legal/copyright",
    title: "Copyright & Takedown (DMCA) Policy",
    category: "legal",
    version: V,
    updated: TRUST_UPDATED,
    status: "in-review",
    summary: "How to report infringing content and how counter-notices work. Creators keep their IP; clients receive the rights agreed in the contract.",
    sections: [
      { heading: "Designated Copyright Agent", body: ["GRID has designated an agent to receive notices of claimed copyright infringement, as provided under the Digital Millennium Copyright Act (DMCA). Send notices to copyright@grid.example (Attn: DMCA Agent, GRID — [legal postal address]). Designating and registering this agent with the U.S. Copyright Office is what allows GRID, as an online service provider hosting user content, to qualify for safe-harbor protection."] },
      { heading: "How to file a takedown notice", body: ["A valid notice must include: your physical or electronic signature; identification of the copyrighted work; identification of the allegedly infringing material and its location on GRID (URLs); your contact details; a statement that you have a good-faith belief the use is not authorised; and a statement, under penalty of perjury, that the information is accurate and you are authorised to act for the rights holder."] },
      { heading: "Counter-notice", body: ["If your content was removed and you believe that was a mistake or misidentification, you may submit a counter-notice with your signature, identification of the removed material and its prior location, a statement under penalty of perjury that the removal was a mistake, and your consent to jurisdiction. We may restore the material unless the original claimant files a court action."] },
      { heading: "Repeat infringers", body: ["GRID terminates, in appropriate circumstances, the accounts of users who are repeat infringers."] },
    ],
  },
  { path: "legal/refunds", title: "Refund Policy", category: "legal", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "When full, partial or no refunds apply across escrow, wallet and subscriptions. Every refund is traceable to a ledger entry and a documented reason." },
  { path: "legal/cancellations", title: "Cancellation Policy", category: "legal", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "How projects and subscriptions can be cancelled, what happens to held funds, and the notice each side receives. No confusing or hidden cancellation flows." },
  { path: "legal/subscriptions", title: "Subscription Terms", category: "legal", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "Plans, renewal dates, fees and how to cancel without contacting support. Pricing and fees are shown before checkout — never hidden." },

  /* ---- Privacy --------------------------------------------------------- */
  {
    path: "privacy/data-we-collect",
    title: "Data We Collect",
    category: "privacy",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "We collect only what is reasonably necessary to run the platform: account details, profile and portfolio you choose to share, project and message activity, and payment metadata needed for escrow and tax.",
    sections: [
      { heading: "Account", body: ["Email, name, and the credentials needed to secure your account. Phone and identity checks are only requested where required for trust or payments."] },
      { heading: "Activity", body: ["Jobs, applications, projects, contracts, messages and files you create on GRID, plus the metadata needed to operate escrow, disputes and chargeback defence."] },
      { heading: "We minimise by default", body: ["If data is unnecessary, we do not collect it. If retention is unnecessary, we do not retain it. If access is unnecessary, we do not grant it."] },
    ],
  },
  { path: "privacy/how-we-use-data", title: "How We Use Data", category: "privacy", version: V, updated: TRUST_UPDATED, status: "published", summary: "To operate your account, match work, process payments through escrow, keep the platform safe, meet legal duties, and — only with your consent — improve and personalise. We do not sell your personal data." },
  { path: "privacy/data-retention", title: "Data Retention", category: "privacy", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "Each data type has a defined retention period and deletion rule. Financial and audit records are kept as long as law requires; everything else is removed when no longer needed or on your request." },
  {
    path: "privacy/your-controls",
    title: "Download & Delete Your Data",
    category: "privacy",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "You can export a copy of your data or request deletion of your account. Both create an audit record, and we confirm when complete.",
    sections: [
      { heading: "Download", body: ["Request a machine-readable export of your profile, projects, contracts and activity from Account → My Data."] },
      { heading: "Delete", body: ["Request account deletion from Account → My Data. Some financial and audit records are retained where law requires; we tell you exactly what and why."] },
      { heading: "Every request is logged", body: ["Export and deletion requests create an immutable audit event, so there is always evidence the request was made and honoured."] },
    ],
  },
  { path: "privacy/subprocessors", title: "Subprocessors", category: "privacy", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "The vetted third parties that help run GRID (hosting, payments, email, AI). Each is inventoried with its purpose, data access and risk level, and reviewed periodically." },

  /* ---- Security -------------------------------------------------------- */
  {
    path: "security/overview",
    title: "Security Overview",
    category: "security",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "GRID is built to detect, contain, investigate and recover from incidents — designed on zero-trust and least-privilege, with everything sensitive logged. We describe protections honestly and never claim to be unbreakable.",
    sections: [
      { heading: "Zero trust & least privilege", body: ["Every request is verified and every action authorised. Users, creators, clients and staff can access only the data their role genuinely requires — nothing more."] },
      { heading: "Row-level isolation", body: ["Data is isolated per owner. The answer to 'can one user reach another user's data, files, contracts or messages?' is no, unless explicitly authorised."] },
      { heading: "Logging & monitoring", body: ["Authentication, payments, escrow, wallet, admin and security events are logged to an append-only trail and monitored for abnormal activity."] },
      { heading: "Honest claims", body: ["We never claim perfect or unbreakable security. The question we hold ourselves to is not 'can GRID prevent every incident?' but 'can GRID survive every incident?'"] },
    ],
  },
  { path: "security/encryption", title: "Encryption", category: "security", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "Data is encrypted in transit, and sensitive data at rest. Secrets are held in centralised secret management — never in source code — and credentials are rotated." },
  { path: "security/account-protection", title: "Account Protection", category: "security", version: V, updated: TRUST_UPDATED, status: "published", summary: "Strong password hashing, rate limiting, breach detection, and multi-factor authentication for sensitive actions like payout, wallet and security changes. You can review and terminate your active sessions at any time." },
  { path: "security/responsible-disclosure", title: "Responsible Disclosure", category: "security", version: V, updated: TRUST_UPDATED, status: "published", summary: "Found a vulnerability? Report it to security@grid.example and we will investigate. We commit to acting in good faith with researchers who do the same — please do not access other users' data or disrupt the service." },
  { path: "security/incident-history", title: "Incident History", category: "security", version: V, updated: TRUST_UPDATED, status: "published", summary: "When incidents occur we acknowledge, investigate, document and improve — hiding mistakes causes greater damage than the mistakes themselves. No reportable security incidents to date." },

  /* ---- Payments -------------------------------------------------------- */
  {
    path: "payments/how-payments-work",
    title: "How Payments Work",
    category: "payments",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "Every dollar entering or leaving GRID is explainable, every balance is reconcilable, and every state change is recorded on an immutable ledger. No money moves without evidence.",
    sections: [
      { heading: "The core rule", body: ["No money moves without evidence. No balance changes without a ledger entry. Ledger entries are never edited — corrections are made with reversal entries, so the history is permanent."] },
      { heading: "What GRID is", body: ["GRID facilitates transactions and escrow. It is not a bank, lender or investment platform, and our product language reflects that."] },
    ],
  },
  { path: "payments/fees", title: "Fees", category: "payments", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "Platform fees are shown before you commit, with no hidden deductions. The full fee schedule by plan and transaction type is published here." },
  {
    path: "payments/escrow",
    title: "Escrow",
    category: "payments",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "Client funds are held in escrow and released to the creator only on approved delivery — protecting both sides. Every escrow movement has a ledger entry and an audit event.",
    sections: [
      { heading: "How it protects both sides", body: ["The client's money is secured up front so the creator knows the work is funded; the creator is paid only when the deliverable is approved, so the client keeps control."] },
      { heading: "Disputes", body: ["If something goes wrong, either side can open a dispute. Disputes are decided on documented evidence — contract, messages, approvals, deliverables and timestamps — with an appeal path."] },
    ],
  },
  {
    path: "payments/production-wallet",
    title: "Production Wallet",
    category: "payments",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "A controlled, client-funded budget for real production costs — rentals, locations, travel, equipment. Every spend needs a receipt; clients always see what was spent, why, when and how much remains.",
    sections: [
      { heading: "What it's for", body: ["Production costs such as rentals, locations, travel and equipment — not personal spending."] },
      { heading: "Evidence required", body: ["No wallet spend happens without a receipt and an approval. Clients see a full, itemised spending history and the remaining balance at all times."] },
    ],
  },
  { path: "payments/refunds-chargebacks", title: "Refunds & Chargebacks", category: "payments", version: V, updated: TRUST_UPDATED, status: "published", summary: "Refunds are traceable to a reason and a ledger entry. For card disputes, GRID assembles an evidence package — contract, messages, approvals, deliverables, timestamps — so legitimate work is defensible." },

  /* ---- AI -------------------------------------------------------------- */
  {
    path: "ai/how-grid-uses-ai",
    title: "How GRID Uses AI",
    category: "ai",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "GRID uses AI to assist — drafting proposals, campaign concepts, summaries and matching. AI assists humans; it never replaces accountability or judgment, and its activity is logged.",
    sections: [
      { heading: "Assistance, not authority", body: ["AI outputs are starting points you review and control. When uncertainty exists, human review takes priority over automated output."] },
      { heading: "Logged & auditable", body: ["AI requests record the feature, model provider, model name and version, and token usage — so AI activity remains visible and auditable."] },
    ],
  },
  { path: "ai/limitations", title: "AI Limitations", category: "ai", version: V, updated: TRUST_UPDATED, status: "published", summary: "AI can be wrong, biased or out of date. It does not make moderation, payment or eligibility decisions on its own. Always review AI output before relying on it." },
  { path: "ai/your-controls", title: "Your AI Controls", category: "ai", version: V, updated: TRUST_UPDATED, status: "published", summary: "You can see your AI activity and token usage in Account → AI Usage, and grant or withdraw AI consent. Where AI assisted, GRID discloses it." },
  { path: "ai/model-updates", title: "Model Updates", category: "ai", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "GRID keeps a registry of the AI models in use and their versions, so changes that affect outputs are recorded and reviewable." },

  /* ---- Your Rights ----------------------------------------------------- */
  {
    path: "rights/overview",
    title: "Your Rights",
    category: "rights",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "You can access, export, correct, delete, restrict and object to the processing of your data. Here is each right and exactly how to exercise it.",
    sections: [
      { heading: "Access & export", body: ["See and download a copy of your data from Account → My Data."] },
      { heading: "Correct", body: ["Update your profile and account details at any time; contact privacy@grid.example for anything you cannot edit yourself."] },
      { heading: "Delete & restrict", body: ["Request deletion of your account, or ask us to restrict or stop certain processing. We confirm what we can action and explain anything law requires us to retain."] },
      { heading: "Consent", body: ["Review and change your consent — cookies, AI, marketing — from Account → Consent or the Cookie settings. Withdrawing consent is as easy as giving it."] },
    ],
  },

  /* ---- Transparency ---------------------------------------------------- */
  { path: "transparency/reports", title: "Transparency Reports", category: "transparency", version: V, updated: TRUST_UPDATED, status: "in-review", summary: "GRID will publish periodic transparency reports covering government and legal requests, moderation actions and appeals. The first report follows the platform's public launch." },

  /* ---- Status ---------------------------------------------------------- */
  { path: "status/overview", title: "System Status", category: "status", version: V, updated: TRUST_UPDATED, status: "published", summary: "All systems operational. This page will show live service status and any active or past incidents, with honest post-incident summaries." },

  /* ---- Contact --------------------------------------------------------- */
  {
    path: "contact",
    title: "Contact",
    category: "contact",
    version: V,
    updated: TRUST_UPDATED,
    status: "published",
    summary: "Reach the right team directly. We aim to acknowledge privacy, security and legal requests promptly.",
    sections: [
      { heading: "Direct lines", body: ["Privacy: privacy@grid.example", "Security / disclosure: security@grid.example", "Legal: legal@grid.example", "Support: support@grid.example"] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Lookups                                                                    */
/* -------------------------------------------------------------------------- */

export function trustDocsByCategory(categoryId: string): TrustDoc[] {
  return TRUST_DOCS.filter((d) => d.category === categoryId);
}

export function findTrustDoc(path: string): TrustDoc | undefined {
  return TRUST_DOCS.find((d) => d.path === path);
}

/** Lightweight client-side search index (title + summary + category). */
export function searchTrust(query: string): TrustDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TRUST_DOCS.filter((d) => {
    const cat = trustCategory(d.category)?.title ?? "";
    return (d.title + " " + d.summary + " " + cat).toLowerCase().includes(q);
  }).slice(0, 12);
}
