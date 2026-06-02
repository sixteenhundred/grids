# POLICY_CONSTRAINTS.md — what our own policies forbid

**Purpose.** You asked whether our policies could contradict themselves (and create liability) if we use data generated from user activity, and for a list of things we **certainly cannot do** because the policy won't allow it. This file is that list, grounded in the text we actually publish.

**Sources audited**
- `src/lib/legal-terms.ts` — the Terms of Service (`/terms`).
- `src/lib/trust.ts` — the Trust Center (`/trust/**`). Docs are flagged `status: "published"` (presented as *current truth*) or `status: "in-review"` (counsel pending).

The dangerous ones are the **`published`** docs: presenting a promise as final and then doing the opposite (or never building it) is the "lying in our policy" exposure — under the FTC Act §5 (deceptive practices), GDPR/UK-GDPR (purpose limitation + lawful basis), and state privacy laws.

---

## 0. The short answer on user-activity data

**Yes — your instinct is correct, and there is a real internal contradiction.**

- **Privacy → "How We Use Data"** (`trust.ts`, *published*) says we use data to operate/match/pay/secure/comply, and **"only with your consent — improve and personalise. We do not sell your personal data."**
- **Constitution** (*published*) says users are **"not products, inventory, assets or data sources."**
- **BUT Terms §9** (Content license) grants GRID a license to **"analyze, modify, … market … and otherwise use such User Content as necessary to operate, improve, secure, market … the Platform"** — with **no consent qualifier**.

So the Terms give us a broad right to analyze/market user content; the Privacy Center promises we will only improve/personalise **with consent** and will never treat users as data sources or sell their data. **If we build analytics, recommendation, model-training, ad-targeting, or "personalisation" off user activity without a consent opt-in, we contradict our published Privacy promise** even though the Terms appear to allow it. The published promise is the one regulators and users will hold us to.

**Fix before relying on activity data:** either (a) gate all improvement/personalisation/analytics behind a real, withdrawable consent toggle (see §3), or (b) narrow Terms §9 to match the Privacy promise. Do **not** leave them contradictory.

---

## 1. Things we CANNOT do (hard "no" — the policy already forbids it)

### Data & privacy
1. **Cannot sell, rent, or share personal data for others' commercial use.** ("We do not sell your personal data," published.)
2. **Cannot treat users/their activity as a product or data source** to monetise. (Constitution, published.)
3. **Cannot use activity data to improve, train, or personalise WITHOUT explicit, withdrawable consent.** ("only with your consent — improve and personalise," published.)
4. **Cannot over-collect or over-retain.** We promise data minimisation: "collect only what is reasonably necessary, retain only what we must." Adding collection of data we don't need (precise location, contacts, device fingerprinting, behavioural tracking) violates this.
5. **Cannot deny export or deletion.** We publish that users can export their data and delete their account from **Account → My Data**, and that each request creates an **audit record**. We must honour this on request.
6. **Cannot ignore consent withdrawal.** "Withdrawing consent is as easy as giving it" (published) — cookies, AI, marketing must be one-click revocable.

### Money (also Phase 3 / Rule 1)
7. **Cannot charge hidden fees / make hidden deductions or transfers.** "No hidden fees, balances, deductions or transfers"; "fees are shown before you commit." (published)
8. **Cannot move money without a ledger entry, or edit ledger history.** "No money moves without evidence… Ledger entries are never edited — corrections are made with reversal entries." (published) → the payment system MUST be an append-only ledger.
9. **Cannot release escrow before approved delivery**, and **cannot spend Production Wallet funds without a receipt + approval.** (published)
10. **Cannot claim to be a bank / licensed escrow provider / investment platform.** We must keep product language as "escrow-*like* facilitator." ⚠️ **Watch item:** the Trust "Escrow" doc says funds are "held in escrow" plainly, while Terms §6 hedges ("escrow-like," "not a licensed escrow provider"). With Stripe Connect we use *separate charges & transfers* (held on the platform balance), not true third-party escrow. Keep the consumer "Grid Escrow" wording but ensure PAYMENTS.md + Terms govern, and don't claim a licensed/segregated escrow account we don't have.

### Dark patterns / UX
11. **Cannot use dark patterns:** no hidden costs, misleading design, **confusing or hard cancellation**, artificial urgency, forced consent, trick wording, or misleading defaults. (Constitution, published.) → constrains the subscription/trial UX directly (see the FTC items from the clips).

### AI & algorithms
12. **Cannot let AI auto-decide moderation, payments, or eligibility** without human review. ("It does not make moderation, payment or eligibility decisions on its own," published.)
13. **Cannot run secretly discriminatory/favouring ranking or matching.** Algorithms "must be reviewable and challengeable and must not secretly discriminate, punish or favour." (published)
14. **Cannot present AI output as professional (legal/financial/tax) advice.** (Terms §8, §5; AI docs.)
15. **Cannot use AI without logging + disclosure** where we say we do: we publish that AI requests record feature/provider/model/version/token usage and are visible in **Account → AI Usage**, and "where AI assisted, GRID discloses it."

### Content / reviews / IP
16. **Cannot fake, seed, buy, or pressure reviews.** Reviews "must be truthful… based on genuine experience" (Terms §11). (Reinforces Rule 3 — already removed seeded marketplace data.)
17. **Cannot auto-transfer IP between users or claim ownership of user work.** Users retain ownership; GRID only takes the operating license in Terms §9.
18. **Cannot claim verification/guarantees we don't perform.** Badges/match scores/verification are "for convenience only… not guarantees or endorsements" (Terms §4) — so we must not market them as guarantees.

### Security
19. **Cannot break per-owner data isolation.** We publish "can one user reach another user's data… no, unless explicitly authorized." (RLS — verified; must be maintained on every new table.)
20. **Cannot store secrets in source code.** "Secrets are held in centralised secret management — never in source code." (Verified clean today; must stay that way.)
21. **Cannot claim perfect/unbreakable security** in marketing. (Constitution / Security Overview.)

---

## 2. Published promises we have NOT built yet (build before launch, or downgrade the claim to `in-review`)

These are the **highest-risk** items: each is currently `status: "published"` (presented as fact) but the supporting feature does not exist. Presenting them as live = the exact misrepresentation you're worried about.

| Published claim (trust.ts) | Reality today | Action |
|---|---|---|
| **Data export + account deletion** at *Account → My Data*, each creating an audit record (`privacy/your-controls`, `rights/overview`) | No "My Data" export/delete flow exists | Build the export+delete flow, or mark `in-review` until built |
| **Consent center** — cookies/AI/marketing, withdrawable at *Account → Consent* (`rights/overview`) | Cookie banner exists; no AI/marketing consent store or "Account → Consent" | Build consent store, or mark `in-review` |
| **MFA for payout/wallet/security actions** + **review & terminate active sessions** (`security/account-protection`) | No MFA gating; no session-management UI | Build (Supabase supports MFA), or mark `in-review` |
| **Append-only audit trail** of auth/payment/escrow/wallet/admin/security events (`security/overview`) | No audit-log table/trail | Build audit logging, or soften the claim |
| **AI usage log + AI consent + disclosure** at *Account → AI Usage* (`ai/how-grid-uses-ai`, `ai/your-controls`) | Campaign route calls the model; no usage log/consent/disclosure surface | Build, or mark `in-review` |
| **Immutable payment ledger; escrow released only on approval; wallet receipts** (`payments/*`) | Phase 3 (no Stripe yet) | Must be true when payments ship; until then no money moves so not yet contradicted |
| **Rate limiting / breach detection** (`security/account-protection`) | Partial (one API route) | Broadening now (see security task) |

Recommendation: anything we cannot truthfully back at launch should be flipped from `published` → `in-review` (the Constitution itself says "marketing must not exceed reality"). That single change is the cheapest liability reducer.

---

## 3. The one contradiction to resolve explicitly

**Terms §9 (broad analyze/market license) vs. Privacy "How We Use Data" (consent-gated, no-sell, not-a-data-source).**

Pick one and make them consistent:
- **Option A (privacy-first, recommended):** narrow Terms §9 so the operating license is "to host, store, process, display, transmit and back up your content **to provide the Platform**," and move any "analyze to improve / market" use under the consent-gated Privacy basis. This matches what we already promise users.
- **Option B:** broaden the Privacy text to disclose non-consensual analytics — **not recommended**; it breaks the Constitution's "not data sources" promise and the no-dark-patterns stance, and is the riskier story to defend.

Either way: **until reconciled, do not use user-activity data for anything beyond operating the service, security, and legal compliance.** That is the safe operating envelope right now.

---

## 4. Bottom line for "can we keep going?"

Safe to build on activity data **now**: operating features (matching to provide the service, security/anti-fraud, legal/tax compliance, the user's own dashboards). 
**Not safe without a consent gate + reconciling Terms §9:** analytics dashboards off other users' activity, recommendation/personalisation models, ad targeting, model training, or anything that resembles "users as a data source."
**Never:** selling personal data, hidden fees, dark-pattern cancellation, AI auto-deciding moderation/payments/eligibility, faking reviews, or breaking per-user data isolation.
