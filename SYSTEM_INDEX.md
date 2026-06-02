# SYSTEM_INDEX.md — GRID current-state map

> Snapshot of what exists **today**, before the GRID 1.0 backend build. Source of truth for the launch plan. Terse by design.
> Generated from a full read-only codebase inventory. No code was changed to produce this.

## 1. Stack (current vs decided target)

| Layer | **Current** | **Target (§1, decided)** | Action |
|---|---|---|---|
| Framework | Next.js 16.2.6, React 19.2.4, Tailwind v4 | same | ✅ keep |
| Hosting | Vercel (linked: `prj_zbDTu1JmyKltoNwmMN6qaWx6fesy`) | Vercel | ✅ keep |
| Database | **Drizzle ORM + libSQL** (SQLite dev `local.db` / **Turso** prod) | **Supabase Postgres** | ⛔ migrate |
| Auth | **Better Auth 1.6.11** (email+pw) + **non-blocking demo fallback** | **Supabase Auth** | ⛔ migrate |
| Storage | image **data-URLs in DB** (S3/R2 scaffold, dormant) | **Supabase Storage** | ⛔ build |
| Payments | **none** (Stripe scaffold throws `ServiceUnavailable`) | **Stripe Connect + Billing** | ⛔ build (last) |
| Email | **none** (Resend scaffold throws) | **Resend or Postmark** | ⛔ build |
| AI | Anthropic SDK 0.100.1 — **live** (`/api/ai/campaign`) | keep | ✅ |

Service scaffolds already exist (dormant, lazy env-validated, build stays green): `src/lib/services/{stripe,email,storage,ai}.service.ts`, `src/lib/env.ts` readiness checks (`isStripeConfigured()`, `isResendConfigured()`, `isS3Configured()`). **SDKs not installed:** `stripe`, `resend`, `@aws-sdk/*`.

## 2. Database (16 tables, `src/lib/db/schema.ts`) — no migrations dir, **no RLS**

- **Auth (Better Auth):** `user`, `session`, `account`, `verification`
- **App (persisted, real):** `profile` (role: creative|client|crew), `shop`, `product`, `purchase`, `academy`, `academyEnrollment`, `learningPath`, `lesson`, `lessonProgress`, `featureFlag` (admin toggles), `waitlist` (email, city)
- **Missing entirely (today these are mock/localStorage):** bookings, contracts + versions, escrow/transactions/ledger, payouts, reviews/ratings, projects/deliverables, disputes, subscriptions/entitlements, stripe customer/connect-account, usage/quota.
- RLS does not exist (SQLite); all authz is app-layer `requireUser()` checks. RLS is a Supabase/Postgres add.

## 3. Routes & GRID 1.0 feature reality (REAL vs DEMO)

Public: `/` landing · `/waitlist` · `/trust/*` · `/terms` · `/company/[slug]` (demo). Auth: `/(auth)/login`,`/signup`. API: `/api/auth/[...all]`, `/api/ai/campaign`. App: ~35 `/dashboard/*` (creator) + `/client/(workspace)/*` (client, all localStorage/mock).

| GRID 1.0 feature | Where | State |
|---|---|---|
| Creator profiles/portfolios | `/dashboard/creative/[id]`, `/dashboard/browse`; `grid-data.ts` CREATIVES | **DEMO** (no table) |
| Booking + contract flow | `BookingFlow` in `sheets.tsx` (hardcoded 10% fee) | **DEMO** (no persistence/payment) |
| Grid Escrow (held funds) | `/dashboard/finance`, `/dashboard/transfer`; `operation.ts` FINANCE, `transfers.ts` (localStorage) | **DEMO** (UI text + mock numbers) |
| Trust Score & reviews | `creative/[id]`, `CREATIVE_REVIEWS` | **DEMO** (no table) |
| Agreements + version history | `/dashboard/contracts/[id]`, `contracts-store.ts` (localStorage) | **DEMO** |
| Delivery-deadline accountability | `operation.ts` OPERATIONS/TIMELINE | **DEMO** (display only) |
| Disputes / Protection Fund | `legal-terms.ts` text only | **NOT BUILT** |
| Creator discovery/matching | `/dashboard/browse`, `/dashboard/match` | **DEMO** (category browse, no algo) |
| Shop / Academy | `/dashboard/shop`, `/dashboard/academy` | **REAL** (DB-backed) |
| AI Campaign | `/api/ai/campaign` | **REAL** (Anthropic, rate-limited) |
| Waitlist capture | `/waitlist` + `waitlist-actions.ts` | **REAL DB write, NO email** |

## 4. Payments / "escrow" today = zero real money code

- Stripe SDK not installed; `stripe.service.ts` stubs throw. No `/api/webhooks/stripe`. No payment tables.
- "Grid Escrow"/"In Transit" = **UI language + mock numbers** (`METRICS` inEscrow €9,500; `FINANCE.escrow` €28,150; `CONTRACTS` totals). Bank details + deliveries in **localStorage** (`grid:bank`, `grid:deliveries`).
- Subscription pages switch plans **client-side only** ("Demo — no card required").
- **Integration points already identified** (where Stripe attaches later): transfer "Accept & release" (`/dashboard/transfer`), finance "Withdraw" (`/dashboard/finance`), booking/buy-sheet, subscription upgrade, Connect onboarding, webhook endpoint.
- **Escrow truth (per §2):** Stripe has no escrow API → implement Connect **separate charges & transfers**, hold on platform balance (tracked `IN_TRANSIT` in our DB), transfer on approval, **≤90-day** hold guard, `charge.dispute.created` → reverse transfer. Keep "Grid Escrow" wording in UI; document mechanism in `PAYMENTS.md`.

## 5. Entitlements / gating today = client-side demo (two parallel systems)

- Creator: `plans.ts` (free/silver/diamond/platinum, prices $19.99/$45.99/$99.99) + `plan-context.tsx` (localStorage `grid:plan`, 2 trial credits) + `feature-gate.tsx` (trial/upgrade wall).
- Client: `client-plans.ts` (free/agency/enterprise, $299.99 / Contact) + `client/config.ts` **`DEMO_MODE = true`** (`canAccessFeature` always true) + localStorage `grid:client:*`.
- Admin feature flags: **`featureFlag` DB table** (server-backed, real) toggled at `/dashboard/admin`; nav hides flagged-off items.
- **Gaps for launch:** no server entitlements (payment→webhook→DB→nav), gating is client-only (API endpoints open), no `PLATFORM_LIVE` flag, no DB-backed CMS config, no per-user quota.

## 6. Auth & Rule-3 exposure (must be cleaned before prod)

- Non-blocking auth: `dashboard/layout.tsx` falls back to `DEMO_USER` — **anyone reaches `/dashboard` without login**.
- **`demo-auth.ts`** hardcoded creds `joingrid@demo.com` / `joingrid2026` (always admin). File comment: "Remove before production."
- **`DEMO_MODE = true`** bypasses all plan gates.
- Mock/seed data that must stay dev-only: `grid-data.ts`, `client/mock.ts`, `operation.ts`, `createearn.ts`, `clienthq.ts`, `community.ts`, `studio.ts`, `campaign.ts` (fallback), `demo.ts`/`demo-user.ts`. Pricing numbers throughout are placeholders.

## 7. Existing docs

`README.md`, `AGENTS.md` (Next 16 warnings), `CLAUDE.md`, `PROJECT_STATE.md`, `DEPLOY.md` (Vercel+Turso), `NOTES.md`, `HANDOFF.md`, `brand.md`, `docs/API_KEYS.md`, `docs/plans/2026-05-29-001-…marketplace-plan.md`. No `SYSTEM_INDEX/PAYMENTS/FEATURE_ROADMAP/CHANGELOG/SETUP` yet (to be created per §10).

## 8. Env vars referenced (all in `src/lib/env.ts`)

Core: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`. Demo: `DEMO_EMAIL/PASSWORD/NAME`. Active: `ANTHROPIC_API_KEY`. Scaffolded/unused: `STRIPE_*`, `RESEND_API_KEY`/`EMAIL_FROM`, `S3_*`, `UPSTASH_*`, `WEBHOOK_SIGNING_SECRET`, `GOOGLE_*`.

## 9. Launch-readiness verdict

UI/routing ~complete; auth + shop/academy + waitlist-capture + AI-campaign are real; **everything money/booking/escrow/reviews/contracts is demo**; no Supabase, no Stripe, no email, no server entitlements, no RLS, no automated tests. Build order in chat / `FEATURE_ROADMAP.md` (pending approval).
