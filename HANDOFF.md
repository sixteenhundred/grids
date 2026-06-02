# GRID — Session Handoff / Clone Brief

> **Read this first** to continue in a new conversation. It SUPERSEDES older
> snapshots. The Turso→Supabase migration and the Better Auth→Supabase Auth
> cutover are **DONE** — ignore any doc that still says libSQL/Turso or Better Auth.
> Last updated: **2026-06-02**.

---

## 0. Resume in 60 seconds

| | |
|---|---|
| **Repo** | `/Users/johnhope/grids` |
| **Branch** | `feat/studio-shop-academy` (all work committed; working tree clean) |
| **Stack (current)** | Next.js **16.2.6** (App Router, Turbopack, React **19.2.4**), Tailwind **v4**, **Drizzle `pg-core` + Supabase Postgres**, **Supabase Auth** (`@supabase/ssr`), **Supabase Storage**. Host = **Vercel**. Email = Resend (optional). **Stripe = Phase 3, NOT started.** |
| **Build gate** | `npx tsc --noEmit` **then** `npm run build` (both must be clean). |
| **Secrets** | Live in `.env.local` (gitignored). Load for scripts: `set -a; source .env.local; set +a`. **Never commit them; never paste them into committed files.** |
| **Supabase project** | URL `https://lrqtyjnicckglahtoqrq.supabase.co` (ref `lrqtyjnicckglahtoqrq`). Publishable/anon key is public; **service-role key + DB password are in `.env.local` only.** |

⚠️ **This is NOT the Next.js you know (v16).** Read `node_modules/next/dist/docs/` before relying on memory. Middleware was renamed → **Proxy** (`src/proxy.ts`). Dynamic-route `params` is a **Promise** (await it). `after()` is imported from `next/server`. Instrumentation hook is `src/instrumentation.ts` `onRequestError`.

---

## 1. The 3 hard rules (NEVER violate — they came from the owner verbatim)

1. **Money is sacred.** Never touch money logic, Stripe keys, payout logic, or pricing without stopping and asking first — show the diff and wait for an explicit yes.
2. **The look is locked.** Never alter the visual design / UI. Backend + wiring only; if a backend change forces a visible change, ask first.
3. **No fake data near prod.** No mock/placeholder/lorem/seeded/fake records in any environment that can reach production. Test data lives only in an isolated dev DB and is wiped before deploy. Also: **list files before deleting and wait for a yes.**

Operating pattern this session: build a slice → `tsc` + `build` → **headless-verify against the live DB and clean up the test rows** → commit (excluding `.env.local`) → update the roadmap.

---

## 2. Authoritative docs (read in this order)

1. `HANDOFF.md` (this file) — entry point.
2. `FEATURE_ROADMAP.md` — phase-by-phase status (the source of truth for what's done).
3. `SETUP.md` — accounts/runbook · `SYSTEM_INDEX.md` — current-state map.
4. `POLICY_CONSTRAINTS.md` — what our own policy forbids (the "cannot do" list + the Terms §9 vs Privacy contradiction).
5. `SECURITY_AUDIT.md` — security posture + remaining vulns.
6. `SCALE.md` — caching / async / indexes / horizontal scaling / monitoring.
7. `AGENTS.md` — the Next-16 warning.

> `PROJECT_STATE.md` / `NOTES.md` and the *history* of this file predate the Supabase migration — trust the roadmap + this file where they conflict.

---

## 3. Status by phase

- **Phase 0 — Supabase foundation ✓** DB on Supabase Postgres (Drizzle pg-core, `postgres-js`, `prepare:false` for the pooler); Supabase Auth with a **mirror trigger** (`public.user` mirrors `auth.users`; guest = anonymous sign-in); **RLS on all 23 tables**, isolation proven (`scripts/test-rls.mjs` + per-table tests).
- **Phase 1 — Waitlist + launch gate ✓** `/waitlist` + Resend confirmation/notify emails (CAN-SPAM footer + unsubscribe), admin Launch section, **`PLATFORM_LIVE`** server gate (DB-flippable; platform redirects to `/waitlist` when off, admins pass).
- **Phase 2 — Platform persistence + gating ✓** server entitlements (+ enforcement on creator write paths), DB CMS (`config-store`), **quotas** (50 GB/profile, 5 GB/file, atomic), **Supabase Storage** (private `uploads` bucket, owner-scoped), **product-file upload + purchase-gated download**, **DB-backed creator marketplace** (profile + portfolio uploads + packages + reviews; browse/detail/home/radar/profile all read DB; no fake creatives in the marketplace), **data-rights** (export/delete/consent + append-only audit), security hardening (rate limits, input caps, secret hygiene), DMCA agent, scale infra (cache, async via `after()`, 25 indexes, monitoring, k6).
- **Phase 3 — Payments (Stripe) — NOT STARTED.** Gated on Rule 1 + a Stripe account + money decisions (fees/prices/escrow windows). Plan: Connect **separate charges & transfers** ("Grid Escrow" = held on platform balance, ≤90-day guard, `charge.dispute.created` → reverse transfer), Checkout/Billing subscriptions, signature-verified webhook, payment tables, all against **test mode**. **Subscription/FTC compliance** (auto-renewal disclosure at checkout, easy cancellation, free-trial reminder) belongs here. Apple/Google IAP = N/A for web. Document in `PAYMENTS.md`.
- **Phase 4 — Audit + cleanup + docs — pending.** Real tests for every critical flow, money path vs Stripe test mode, dead-code/dep prune (deletes pre-approved but list them), finish PAYMENTS/CHANGELOG.

---

## 4. Data model (23 tables) + the RLS rule

`src/lib/db/schema.ts`. Tables: `user`(mirror), `profile`, `shop`, `product`, `purchase`, `academy`, `academy_enrollment`, `learning_path`, `lesson`, `lesson_progress`, `feature_flag`, `waitlist`, `app_config`, `subscription`, `usage`, `contract`, `contract_version`, `review`, `dispute`, `portfolio_item`, `creator_package`, `audit_event`(append-only), `consent`.

**RLS architecture (important):** the app reads/writes via Drizzle as the `postgres` role, which **BYPASSES RLS** — server authz is enforced in code (`requireUser()` + `where user_id = uid`). The RLS policies in `supabase/rls.sql` lock the **publishable-key/PostgREST surface** (browser). `user_id` columns are **TEXT holding the auth uid**; policies compare to `(auth.uid())::text`. Money columns are deliberately **absent** from `contract`/etc. (Phase 3 owns money). `DEMO_MODE` (`src/lib/client/config.ts`, currently `true`) short-circuits entitlement gates and enables seed/demo data; flipping it off is a launch step.

---

## 5. Verification & infra commands (env from `.env.local`)

```bash
# Always: type + build
npx tsc --noEmit && npm run build

# Push schema changes (direct conn string; --force)
DATABASE_URL="$DATABASE_URL" npx drizzle-kit push --force

# RLS: edit supabase/rls.sql then
DATABASE_URL="$DATABASE_URL" node scripts/apply-rls.mjs
node scripts/test-rls.mjs            # isolation test (expects all PASS)

# Storage bucket/policy
node scripts/setup-storage.mjs

# Headless DB/storage checks: node --input-type=module -e "...".
#   Use createClient(SUPA_URL, SERVICE_ROLE) + postgres(DATABASE_URL,{ssl:'require'}).
#   ALWAYS delete any rows/users/objects you created (Rule 3).
```

The `.env.local` keys you'll need: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (direct conn for scripts; **IPv4 pooler** string is needed for Vercel deploy).

---

## 6. Open items / what still needs the owner

**Code still to do (not started):**
- Secondary demo surfaces still resolving creatives via `findCreative` (community feed, saved, concierge) + the client company profile (`MY_COMPANY`) are still mock — must be DB-backed or demo-gated before going live.
- Remove the "Continue as guest" button + flip `DEMO_MODE=false` at launch.
- Phase 3 (Stripe) and Phase 4 (audit) per §3.

**Needs the owner (external/decisions):**
- Resend API key (live email); **IPv4 pooler** connection string (deploy); 2 Supabase toggles (**Anonymous sign-ins ON**, **Confirm email OFF**); `COMPANY_POSTAL_ADDRESS` (CAN-SPAM); Supabase Auth dashboard rate-limit; **Upstash** creds (global cache + rate limits); **Sentry** DSN + `npm i @sentry/nextjs` (error alerts); **counsel** sign-off on the Terms §9 redraft (`legal-terms.ts`, marked DRAFT); Phase-3 money decisions (fees/prices/escrow windows); decision on the still-mocked surfaces above.

---

## 7. Git

Branch `feat/studio-shop-academy`. Recent commits (newest first): scale infra → DB indexes → data-rights (export/delete/consent) → policy flip + Terms §9 → compliance/security (rate limits, CAN-SPAM, DMCA, audit) → marketplace de-mock (profile editor → read pages → backend) → product-file upload → non-money domain tables + seed gating → entitlement enforcement → Supabase Storage. Working tree clean.
