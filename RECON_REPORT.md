# GRID — RECON REPORT (Section 0)

**Read-only reconnaissance. Nothing was moved, renamed, or deleted.** This report exists to be approved before any migration begins. The only file added to the source tree is this one (`RECON_REPORT.md`); zero existing files were modified. Say the word if you'd rather it live outside the source folder.

- **Source:** `/Users/johnhope/grids` (the `Grids` working dir; case-insensitive FS)
- **Branch:** `feat/payments` (3 un-pushed payment commits on top of prior work)
- **Baseline:** last `tsc --noEmit` + `next build` were **green** (verified during the payments work). Recommend re-running both as the formal pre-stage-1 baseline.
- **Scale:** 214 TS/TSX files · ~99 app-route files · 75 `lib/` files · 43 components · 32 DB tables · 90 routes.

---

## 1. Stack — framework, language, build

| Aspect | Finding | Evidence |
|---|---|---|
| Framework | **Next.js 16.2.6**, App Router, React 19.2 | `package.json`; `AGENTS.md` warns "this is NOT the Next.js you know" |
| Language | TypeScript (strict), Server Actions + RSC | `tsconfig.json` |
| Middleware | Renamed to **`src/proxy.ts`** (Next 16 convention), refreshes Supabase session | `src/proxy.ts:10-34` |
| Instrumentation | `src/instrumentation.ts` (`onRequestError`) | — |
| Build | `next build`; Drizzle CLI for DB (`db:push`/`generate`/`migrate`/`studio`) | `package.json` scripts |
| Styling | **Tailwind CSS v4**, CSS-first `@theme inline` (no `tailwind.config.js`) | `postcss.config.mjs`, `src/app/globals.css` (~305 lines) |
| ORM/DB driver | **Drizzle ORM** over **`postgres`** (postgres-js) → Supabase Postgres | `src/lib/db/index.ts`, `package.json` |
| Not single-file | This is a full framework app — the staged migration must respect Next 16 layout, **not** flatten it | — |

---

## 2. Routing

App Router with route groups. Three product surfaces + marketing + system:

- **Marketing/public:** `/` (`src/app/page.tsx`), `/waitlist`, `/terms`, `/trust/[...slug]`, `/company/[companySlug]`
- **Auth:** `(auth)/login`, `(auth)/signup` — group `src/app/(auth)/`
- **Creator app:** `/dashboard/**` (~55 routes) — shell at `src/components/dashboard/shell.tsx`
- **Client workspace:** `/client/(workspace)/**` (14 routes) + `/client/onboarding`, `/client/subscriptions` — shell at `src/components/client/client-shell.tsx`
- **Admin:** `/dashboard/admin`, `/dashboard/admin/payments`
- **API:** `/api/**` (8 routes — see §7)

Gating happens in **layouts** (`dashboard/layout.tsx`, `client/layout.tsx`) and **server actions**, not in `proxy.ts` (which only refreshes the session).

---

## 3. Database (Supabase Postgres + Drizzle)

**32 tables**, all in one 748-line file `src/lib/db/schema.ts`. App connects as the `postgres` role which **bypasses RLS** → server-side authz lives in code (`requireUser` + `where userId = uid`); RLS in `supabase/rls.sql` guards only the browser/anon-key surface.

### Relationship tree (FK map, `references(() => …)`)

```
user (23)  ── identity root; almost everything FKs to user.id
├─ profile (43), portfolio_item (79), creator_package (98)
├─ shop (113) → product (134) → purchase (162)
├─ academy (183) → academy_enrollment (203)
│                → learning_path (220) → lesson (241) → lesson_progress (261)
├─ contract (287)  [client + creator both → user]
│     ├─ contract_version (312)
│     └─ dispute (360)
├─ review (335)
├─ subscription (434)  [plan source of truth] · usage (449)
├─ vault (501) → file (526) · vault_permission (558) · vault_invite (578)   [vault also → contract]
├─ payment_account (629)
├─ payment (649)  [clientId + creatorId → user]  → payout (680)
└─ audit_event (468), consent (479)
Standalone / system: feature_flag (388), waitlist (397), app_config (419),
                     domain_event (606), payment_event (701)
```

### ⚠️ Major structural gap (key onboarding insight)
**There is no `job`, `booking`, `project`, `company`, `message`, `notification`, `department`, or `task` table** (`grep` count = 0). The marketplace's core transactional entities — the things the client workspace, Job Board, Booking, Projects, and Messaging pages render — are **mock data** (`src/lib/grid-data.ts`) + `localStorage`. This is why the new payment layer is deliberately **item-agnostic** (`payment.itemType`/`itemId`) — it has no real entity to FK to yet. Any future "real" marketplace work needs these tables first.

### Legacy DB artifacts
- **`local.db`** (SQLite, gitignored) + **`@libsql/client`** dep — leftovers from the pre-Supabase **Turso** era. `@libsql/client` is imported **nowhere in `src/`**. Dead.
- Shop code comments still say "lives in SQLite for now" (`src/lib/shop-actions.ts`) — stale comment; storage is Supabase.

---

## 4. Auth & roles

**Active auth = Supabase Auth** (`@supabase/ssr`), cookie-bound.
- Browser: `src/lib/auth-client.ts` (`supabase.auth.signInWithPassword/signUp/signOut/onAuthStateChange`).
- Server: `src/lib/supabase/server.ts` (`createSupabaseServerClient` respects RLS; `createSupabaseAdminClient` service-role bypasses RLS).
- Guards: `src/lib/security/auth-guard.ts` (`getCurrentUser`, `requireUser`→401, `requireAdmin`→403).
- Session refresh: `src/proxy.ts`.
- A DB trigger mirrors `auth.users` → `public.user`; `ensureUserRow()` (`src/lib/demo-user.ts`) is a belt-and-suspenders upsert for FK-backed writes.
- Guest/demo: `src/lib/demo-auth.ts` uses real `signInAnonymously()`.

### ❗ Correction / dead-auth finding
**better-auth is fully retired but still physically present.** `src/lib/auth.ts` constructs a `betterAuth(...)` instance — but **nothing imports `@/lib/auth`** (precise grep: 0 importers). The catch-all `src/app/api/auth/[...all]/route.ts` is a **410 stub** whose own comment says *"Better Auth has been retired in favour of Supabase Auth… Safe to delete in the cleanup pass."* So the following are **dead legacy**: `src/lib/auth.ts`, the `[...all]` route, the **`better-auth`** dependency, the `auth:generate` script, and the `BETTER_AUTH_SECRET` env declaration.

### Roles
- **`creator | client`** is a **pure UX layer** in `localStorage` (`grid:role`), toggled by `experience-toggle.tsx` / `role-context.tsx` — **not a DB column.** Same account sees both surfaces.
- **Admin** = email match only (`src/lib/admin.ts` `isAdminEmail`, demo `joingrid@demo.com` + `ADMIN_EMAILS`). No DB role.
- **Entitlements** (server source of truth): `src/lib/entitlements.ts` reads `subscription.plan`. Creator plans `free|silver|diamond|platinum` (`plans.ts`); client plans `free|agency|enterprise` (`client-plans.ts`). **`DEMO_MODE=true` short-circuits all gating** (`src/lib/client/config.ts:15`).

---

## 5. Payments

**Model: Stripe Connect, SEPARATE CHARGES & TRANSFERS** (not destination charges, not a third-party escrow account). Confirmed in `src/lib/services/stripe.service.ts`.

- **Charge (hold):** client pays `price + platform fee` to the **GRID platform account** via Checkout; `transfer_group=<paymentId>`. Nothing reaches the creator yet.
- **Transfer (release):** on client approval, `transferToCreator()` moves exactly `creatorAmount` (= price) to the creator's connected account; GRID keeps the fee. `stripe.service.ts:170-187`.
- **Fee = ON TOP, config-driven** (`src/lib/payments/fee.ts`): reads `app_config.platform_fee_bps`, tier-based, ≤5% guardrail, **not hardcoded** (default 3.5%).
- **Amounts in minor units (cents)**, server-resolved from the item record (`src/lib/payments/items.ts`); client never supplies a price.
- **PayPal** (`src/lib/services/paypal.service.ts`, REST, no SDK): client checkout is real (Orders v2 create/capture/refund + webhook verify). **Creator PayPal payouts are intentionally "coming soon / manual verification"** — not faked.
- **Webhooks:** `/api/webhooks/stripe`, `/api/webhooks/paypal`, `/api/payments/paypal/return` (server-side capture). Signature-verified on raw body (`src/lib/security/webhook.ts`), idempotent via `unique(provider, event_id)` on `payment_event`.
- **Tables:** `payment_account`, `payment`, `payout`, `payment_event` (schema.ts:629-713).

### ⚠️ Legacy/mock money surfaces still live alongside the real system
| Surface | File | State |
|---|---|---|
| Shop "Buy" | `src/lib/shop-actions.ts` `purchaseProduct` + `buy-sheet.tsx` | **Mock** — inserts a free `purchase` row; a real-pay link was added beside it |
| Booking | `src/components/dashboard/sheets.tsx` (BookSheet) | **Mock** — "sign & fund" UI, no charge, no `booking` table |
| Finance/withdraw | `src/app/dashboard/finance/page.tsx` + `src/lib/bank.ts` | **Mock** — `localStorage` bank details, `setTimeout` payout, random "instant" estimate |
| Landing "escrow" | `src/components/landing/escrow.tsx` | **Mock** marketing animation |

### "Escrow" language (you want it standardized → "separate charges & transfers / 90-day hold", no "escrow" wording)
- **Keep:** the CSS color token **`escrow-green`** (`--color-escrow-green` in `globals.css`; `ACCENT.escrow` in `ui.tsx`) — purely cosmetic, used everywhere. Renaming it is a large cosmetic churn with no functional value; recommend leaving as a token or renaming separately.
- **Change (conceptual/user-facing "escrow"):** `src/components/landing/escrow.tsx` (section), `src/lib/trust.ts:51,213-263` ("Payments & Escrow" article), `src/lib/legal-terms.ts:82-87` (legal defs), `src/lib/operation.ts:95,111-114` (`"In escrow"` status string), schema comments `schema.ts:300-302,623`, doc comments in `stripe.service.ts`/`payment-actions.ts`. This is a **copy/comment pass**, isolated from payment logic.

---

## 6. Creator / client / admin flows

- **Creator** → `dashboard/layout.tsx` wraps `RoleProvider`+`PlanProvider`+`FeatureGate`; nav `navFor(role)` in `shell.tsx:27-83`; pages gated by `feature-gate.tsx` (allow/trial/locked/exhausted).
- **Client** → `client/layout.tsx` wraps `ClientProvider` (plan/company/toasts in `localStorage`); `client-shell.tsx` nav from `src/lib/client/nav.ts`. **Entirely demo-backed today** (no job/project/company tables).
- **Admin** → `dashboard/admin/page.tsx` guards via `isAdminEmail` → `admin-panel.tsx`: feature-flag toggles, `PLATFORM_LIVE` switch, audit. Actions in `admin-actions.ts`.
- **Cross-surface:** `experience-toggle.tsx` flips `localStorage` role and routes `/dashboard ↔ /client/dashboard`.

---

## 7. API routes (`/api/*`)

| Route | Purpose | Notes |
|---|---|---|
| `api/auth/[...all]` | **410 stub** (better-auth retired) | **Dead — archive** |
| `api/webhooks/stripe` | Stripe events → payment state | sig-verified, idempotent |
| `api/webhooks/paypal` | PayPal events | sig-verified, idempotent |
| `api/payments/paypal/return` | Server-side PayPal capture on return | — |
| `api/ai/campaign` | Anthropic campaign generation | `services/ai.service.ts` |
| `api/cron/domain-security` | Vercel Cron (every 6h), `CRON_SECRET` Bearer | `vercel.json` |
| `api/admin/domain-security` | Admin-triggered domain scan | `requireAdmin` |
| `api/unsubscribe` | Email unsubscribe | CAN-SPAM |

---

## 8. Components & styling

- **Three loosely-coordinated UI kits** (not unified): `components/dashboard/ui.tsx` (588 ln, the main design system: `ACCENT`, `Surface`, `Card`, `Button`, `StatusPill`…), `components/client/ui.tsx` (206 ln), `components/landing/ui.tsx` (88 ln). Icons in `dashboard/icons.tsx` (411 ln).
- **Groups:** `landing/*` (marketing), `dashboard/*` (creator app, ~6k ln), `client/*` (client workspace), root (`theme.tsx`, `cookie-consent.tsx`, `experience-toggle.tsx`).
- **Styling:** Tailwind v4, tokens in `globals.css` (`--color-grid-blue #0071e3`, `--color-client-green`, `--color-escrow-green`, etc.), dark default + `[data-theme="light"]`, custom animations (`grid-rise`, `radar-scan`), `--ease-grid` spring.
- **Top split candidates (>600 ln):** `db/schema.ts` (748, expected), `grid-data.ts` (683 — split types vs demo data), `dashboard/operation/page.tsx` (677), `dashboard/sheets.tsx` (669 — 4+ unrelated modals), `client/(workspace)/jobs/page.tsx` (667), `company/[companySlug]/page.tsx` (619), `client/(workspace)/tasks/page.tsx` (600). Full top-20 captured.

---

## 9. Environment variables

Canonical declared set lives in **`src/lib/env.ts`** (lazy zod validation; optional integrations degrade gracefully). Grouped:

- **Core:** `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`, `NODE_ENV`
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Payments:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`
- **AI/email/storage/cache/monitoring:** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `WAITLIST_NOTIFY_EMAIL`, `COMPANY_POSTAL_ADDRESS`, `S3_*`, `UPSTASH_REDIS_*`, `SENTRY_DSN`
- **Cron/auth:** `CRON_SECRET`, `WEBHOOK_SIGNING_SECRET`, demo `DEMO_EMAIL/PASSWORD/NAME`
- **OAuth (declared via `process.env`, not enabled):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **🪦 Legacy declarations to drop:** `BETTER_AUTH_SECRET`, `DATABASE_AUTH_TOKEN` (better-auth/Turso era)

`.env.local` is **gitignored** (verified); no secret keys are committed anywhere in the tree.

---

## 10. Deployment

- **Vercel.** `vercel.json` defines one cron: `/api/cron/domain-security` every 6h. `.vercel/` present.
- **GitHub:** remote `origin = https://github.com/sixteenhundred/grids.git` → Vercel auto-deploy is the implied path. ⚠️ `PROJECT_STATE.md` notes the working branch may not be pushed — **confirm the deploy branch** before relying on auto-deploy.

---

## 11. Feature flags

- **`DEMO_MODE`** — `src/lib/client/config.ts:15` (`= true`). Compile-time constant; unlocks all gated features. *Recommend moving to `app_config` like `PLATFORM_LIVE`.*
- **`PLATFORM_LIVE`** — `app_config` row, **fail-closed** (absent/error → not live → visitors routed to `/waitlist`; admins bypass). `config-store.ts:47`.
- **Per-feature flags** — `feature_flag` table + `src/lib/features.ts` catalog, toggled in the admin panel; nav auto-filters via `featureKeyForHref()`.

---

## 12. Duplicated / dead / demo / legacy inventory

**Dead (0 importers — archive-safe after a final grep):**
- `src/lib/auth.ts` + `src/app/api/auth/[...all]/route.ts` (better-auth, retired)
- `better-auth` & `@libsql/client` deps; `BETTER_AUTH_SECRET`, `DATABASE_AUTH_TOKEN` env; `auth:generate` script
- `src/lib/env.client.ts` (0 importers), `src/lib/client/mock.ts` (0 importers)
- `waitlist-clone.html` (root scratch from a prior task)

**Duplicated logic (consolidate into `/lib`):**
- **`money()` defined 5×** with inconsistent currency — `grid-data.ts:35` (€, canonical, has `per`), `clienthq.ts:13` (€), `createearn.ts:240` (€), `operation.ts:15` (**$**), `first-in-line/page.tsx:17` (€). The new payment UIs use a 6th inline `Intl.NumberFormat`. → one shared formatter.
- **`genId()`/`newId()` defined 4×** (`shop-actions`, `profile-actions`, `academy-actions`, `payments/records`) → one `lib/id.ts`.

**Demo/mock (active in demo paths — keep, but label clearly; swap at launch):**
- `grid-data.ts` (683 ln, powers ~35 pages), `clienthq.ts`, `createearn.ts`, `operation.ts`, `firstinline.ts`, `studio.ts`, `campaign.ts`, `community.ts` — demo content modules
- `profile-store.ts`, `contracts-store.ts`, `bank.ts` — `localStorage` stand-ins for real server state

**Tests:** only `src/lib/security/domain-security.test.ts` (Node `node:test`, run via `test:security`). No runner config, no broader suite.

**Doc sprawl (root):** 18 markdown files (`HANDOFF.md`, `PROJECT_STATE.md`, `NOTES.md`, `SYSTEM_INDEX.md`, `SCALE.md`, `SECURITY_AUDIT.md`, `SECURITY_CHECKLIST.md`, `POLICY_CONSTRAINTS.md`, `VAULT_ARCHITECTURE.md`, `FEATURE_ROADMAP.md`, `DEPLOY.md`, `SETUP.md`, `brand.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, plus `docs/`). Several stale (`NOTES.md`/`DEPLOY.md`/`SETUP.md` reference the old better-auth/Turso stack). → consolidate into `/docs`.

**Loose dirs:** `mockups/`, `mockup2/` (design PNGs), `reference/grid-prototype.html` (429 KB), `loadtest/browse.js`, `scripts/*.mjs` (RLS/storage/test utilities — active).

---

## 13. Dependency-graph notes (for safe moves)

- `grid-data.ts` is the **highest-fan-in module** (~35 importers) and mixes **types + demo data + the `money()` helper + `Accent`/`Tile` design types**. Splitting it (types → `/types`, demo data → a demo module, `money` → shared util) is the **single highest-leverage, highest-risk** move — touches the most files. Stage it carefully and late.
- `*-actions.ts` files are the server-action layer; each pairs with a data/store module (`shop-actions`↔`shop`, `academy-actions`↔`academy`, `campaign-actions`↔`campaign`/`campaign-ai`, `profile-actions`↔`profile-store`). These map cleanly onto feature modules.
- `services/` (stripe, paypal, email, storage, ai) and `security/` and `payments/` and `db/` and `supabase/` are **already cleanly grouped** — good anchors to build the target structure around.

---

## 14. Top tangles a new engineer hits (the "why this is hard to onboard")

1. **Dead better-auth coexists with live Supabase auth** — two auth stories, one real. (§4)
2. **No DB tables for jobs/bookings/projects/messages/companies** — half the UI is demo data, not obvious which half. (§3)
3. **Real payments + mock money UIs side by side** (real checkout vs mock Buy/Booking/Finance). (§5)
4. **`grid-data.ts` is a 683-line junk-drawer** (types + demo + helpers) imported everywhere. (§13)
5. **5× `money()`, 4× `genId()`** — no shared util layer. (§12)
6. **DEMO_MODE is a compile-time kill-switch** that unlocks everything — easy to forget when reasoning about access. (§11)
7. **Legacy Turso/SQLite remnants** (`local.db`, `@libsql/client`, stale comments). (§3)
8. **18 root markdown docs**, several stale. (§12)

---

## 15. Proposed next step (pending your go-ahead — no moves yet)

If you approve this recon, I'll produce a **staged migration plan** (Section 1): an ordered list of independent, reversible stages, each verified (routes resolve · imports intact · `tsc` + `next build` green · no new env required) and checkpoint-committed. Likely ordering, lowest-risk first:

1. **Archive the truly dead** (better-auth files/dep, `@libsql/client`, `env.client.ts`, `client/mock.ts`, `waitlist-clone.html`) → `/archive/legacy-code`, after a final import grep each.
2. **Create the shared `/lib` utilities** (`money`, `id`) and point imports at them.
3. **Consolidate docs** → `/docs`; consolidate loose dirs.
4. **Group feature modules** (auth · profiles · shop · academy · payments · contracts · vault · admin · client-workspace · waitlist · trust/legal) — moving `*-actions` + data + components together, fixing imports per stage.
5. **Split `grid-data.ts`** (types → `/types`, demo → demo module) — last, highest blast radius.
6. **Standardize "escrow" → "separate charges & transfers / 90-day hold"** copy/comment pass (color token left as-is unless you want it renamed).

I will **not** start any of this until you approve. **Awaiting your review.**
