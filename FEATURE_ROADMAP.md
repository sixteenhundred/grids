# FEATURE_ROADMAP.md — GRID 1.0 to launch

Approved build order. Status updated each task. Reveal is manual: waitlist ships first, full platform stays behind `PLATFORM_LIVE` until we flip it.

| Phase | Scope | Status | Blocked on |
|---|---|---|---|
| **0. Supabase foundation** | Provision Supabase (EU); migrate DB Turso→Postgres (Drizzle kept); Better Auth→Supabase Auth; RLS on every table; env/secrets | **COMPLETE ✓** — DB on Supabase Postgres; Supabase Auth (mirror trigger, guest=anonymous); **RLS on all 12 tables** (supabase/rls.sql) with isolation proven (scripts/test-rls.mjs: B can't read/update A, anon denied, server-only tables locked). App reads via Drizzle/`postgres` (bypasses RLS) + app-layer checks; RLS locks the publishable-key/PostgREST surface. | Live guest/signup needs 2 Supabase toggles (Anonymous ON, Confirm-email OFF). Prod deploy needs the IPv4 **pooler** string. |
| **1. Waitlist site (Phase A)** | Flawless standalone `/waitlist` on Supabase; Resend confirmation to signer + notification to our inbox; validation + rate-limit; admin view + CSV; **`PLATFORM_LIVE`** flag gating all platform routes | Approved | Resend creds (SETUP.md §2) |
| **2. Platform persistence + gating** | Real tables (profiles, bookings, contracts+versions, reviews, projects, deliveries, disputes); single **server-side entitlements service** (client+server enforced); DB-backed CMS/config (copy/flags/tier text — **not prices**) + admin panel; **50 GB/profile, 5 GB/file** quotas via storage + transactional `usage` table; remove demo-auth/DEMO_MODE/non-blocking auth | Approved | Phase 0; decision (3) empty-states-at-launch OK |
| **3. Payments (Stripe-ready, connect LAST)** | Connect separate charges & transfers ("Grid Escrow" held funds, ≤90-day guard, dispute→reverse); Checkout/Billing subs; signature-verified webhook; payment tables; 6 integration points — all against **test mode** | Approved | Stripe account (SETUP.md §4); decisions (1)(2) prices/fees/windows — **money diff requires explicit yes** |
| **4. Audit + cleanup + docs** | Unit/integration/e2e tests for every critical flow; money path vs Stripe test mode; RLS tests (A can't read B); pass/fail report; dead-code/dep prune (**deletes pre-approved**); finish PROJECT_MAP/PAYMENTS/CHANGELOG | Approved | Phases 0–3 |

## Hard rules (never violate)
1. No money/Stripe/pricing/payout change without showing the diff and getting an explicit yes.
2. No UI/visual redesign. Backend + wiring only. Backend-forced visible change → ask first.
3. No mock/seed/demo data in any env that can reach production; test data lives only in isolated dev DB, wiped before deploy.

## Open decisions (from the plan)
1,2 (money: fees/prices/escrow windows) — needed at Phase 3. 3 (empty states at launch) — needed at Phase 2. 4 (Turso disposable) — needed at Phase 0. 5 (Resend) — recommended, awaiting confirm. 6 (file deletions) — gated, list-then-yes.
