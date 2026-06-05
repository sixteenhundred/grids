# GRID — Session Handoff / Clone Brief

> **Read this first** to continue in a new conversation. It SUPERSEDES older
> snapshots. The Turso→Supabase migration and the Better Auth→Supabase Auth
> cutover are **DONE** — ignore any doc that still says libSQL/Turso or Better Auth.
> Last updated: **2026-06-05**.

> **What changed this session (2026-06-05):** a full code review → then
> (1) **comprehensive rate-limit coverage** (central 10–20 min clamp);
> (2) **Vault system Phase A** — new content-storage foundation (see
> `VAULT_ARCHITECTURE.md`); (3) **remediated the open security findings**
> (forgeable purchases, storage BOLA, paid-content leak, launch-gate fail-open, …);
> (4) a **privacy / edge-case / env refactor** (consent enforcement + accurate
> policy DRAFT, defensive input validation, env hardening). DB now has **28
> tables**; `platform_live` is **fail-closed** (an explicit `platform_live=true`
> row is set in the DB to keep the demo open). Details in §3 / §4 / §6.

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
   · `VAULT_ARCHITECTURE.md` — Vault system design (Phase A built; §15 = open owner decisions).
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
- **Security review + remediation (2026-06-05) ✓** A max-effort review found ~27 issues; the high-severity ones are **fixed** (`07e7206`, `e8e011a`): forgeable `purchase`/`academy_enrollment`/`lesson_progress` rows (RLS now **SELECT-only** on the browser surface → entitlement rows can't be forged via the anon key; proven by `scripts/test-entitlement-rls.mjs`); storage **BOLA** (uploaded paths validated against the caller's uid + quota billed by the **actual** object size); paid-lesson-content leak (redacted server-side when locked); AI route now auth + rate-limit + plan-gated; account deletion erases Storage + forces the `public.user` cascade; **`PLATFORM_LIVE` fail-closed**; `fileSize` int4→**bigint**; reviews need a real relationship + are unique (launch-gated); entitlement cross-family plan-rank; `savePackages` tx; consent FK; **comprehensive rate limits** (`src/lib/security/rate-guard.ts`, uid+IP, 10–20 min). **Deferred (need UI/Rule-2 or a product call):** #10 browse filter, #12 owner-lockout hang, AU1 guest-login error, delete-account MFA step-up, N3 one-click-unsubscribe, P2 fuller consent enforcement.
- **Vault system — Phase A ✓ (2026-06-05)** Ownership-based content storage foundation (`9d5aefd` doc, `5ccfd53` code; design in **`VAULT_ARCHITECTURE.md`**). New tables `vault`/`file`/`vault_permission`/`vault_invite`/`domain_event` + `usage` ledger cols; `StorageProvider` interface (Supabase impl, private service-role **`vaults` bucket**, immutable `files/{id}` keys, 5-min signed URLs); `can(user,vault,action)` chokepoint (`security/vault-guard.ts`); transactional outbox (`events/outbox.ts`); shared `logAudit` (`lib/audit.ts`). RLS: vault tables **read-only + permission-scoped, no browser writes** (forge-proof; `scripts/test-vault.mjs`, 18 checks). **Backend only, not wired into the UI.** Phase B (delivery→content-vault transfer, invites, migration) is **blocked on `VAULT_ARCHITECTURE.md` §15** + Rule 1 (billing) + Rule 2 (vault UI).
- **Privacy / edges / env refactor ✓ (2026-06-05)** `1cd41cd`/`c82e879`/`1172fe3`/`60f43d2`. **Env:** no hardcoded secrets (scan clean); `db/index.ts` **fails loud** on missing `DATABASE_URL`; Anthropic key via `getServerEnv()`; `.env.example` rewritten to the real Supabase stack. **Edges:** `src/lib/validation.ts` (safeInt/safeStr/sanitizeEnumArray/sanitizeBrief) wired into the campaign brief (was sent to the AI unvalidated), profile, reviews, packages, academy, product. **Privacy:** `src/lib/consent.ts` (`hasConsent`/`requireConsent`, fail-closed) + a marketing-email consent gate; `trust.ts`+`legal-terms.ts` corrected for accuracy (names subprocessors incl. **Anthropic** + the brief→AI flow; discloses IP/admin-email; fixes the over-promised "only with consent" claims; adds dev/marketing disclosure) — **all `status:'in-review'` = DRAFT, needs counsel sign-off before live.**
- **Phase 3 — Payments (Stripe) — NOT STARTED.** Gated on Rule 1 + a Stripe account + money decisions (fees/prices/escrow windows). Plan: Connect **separate charges & transfers** ("Grid Escrow" = held on platform balance, ≤90-day guard, `charge.dispute.created` → reverse transfer), Checkout/Billing subscriptions, signature-verified webhook, payment tables, all against **test mode**. **Subscription/FTC compliance** (auto-renewal disclosure at checkout, easy cancellation, free-trial reminder) belongs here. Apple/Google IAP = N/A for web. Document in `PAYMENTS.md`.
- **Phase 4 — Audit + cleanup + docs — pending.** Real tests for every critical flow, money path vs Stripe test mode, dead-code/dep prune (deletes pre-approved but list them), finish PAYMENTS/CHANGELOG.

---

## 4. Data model (28 tables) + the RLS rule

`src/lib/db/schema.ts`. **23 core tables:** `user`(mirror), `profile`, `shop`, `product`, `purchase`, `academy`, `academy_enrollment`, `learning_path`, `lesson`, `lesson_progress`, `feature_flag`, `waitlist`, `app_config`, `subscription`, `usage`(+ `transfer_bytes`/`archive_bytes`), `contract`, `contract_version`, `review`, `dispute`, `portfolio_item`, `creator_package`, `audit_event`(append-only), `consent`. **+ 5 Vault tables (2026-06-05):** `vault`, `file`, `vault_permission`, `vault_invite`, `domain_event`(outbox). `product.file_size`/`portfolio_item.file_size` are now **bigint**.

**RLS architecture (important):** the app reads/writes via Drizzle as the `postgres` role, which **BYPASSES RLS** — server authz is enforced in code (`requireUser()` + `where user_id = uid`). The RLS policies in `supabase/rls.sql` lock the **publishable-key/PostgREST surface** (browser). `user_id` columns are **TEXT holding the auth uid**; policies compare to `(auth.uid())::text`. Money columns are deliberately **absent** from `contract`/etc. (Phase 3 owns money). `DEMO_MODE` (`src/lib/client/config.ts`, currently `true`) short-circuits entitlement gates and enables seed/demo data; flipping it off is a launch step.

**2026-06-05 RLS + security modules:** `purchase`/`academy_enrollment`/`lesson_progress` are now **SELECT-only on the browser surface** (no write grant → entitlement rows can't be forged via the anon key). The **vault tables are read-only + permission-scoped** (writes server-only); `vault_invite`/`domain_event` are fully server-only. New modules: `security/rate-guard.ts` (rate limits, uid+IP), `security/vault-guard.ts` (`can()`), `validation.ts` (defensive input), `consent.ts` (`hasConsent`/`requireConsent`), `storage/provider.ts` (StorageProvider), `events/outbox.ts`, `audit.ts` (shared `logAudit`). **`platform_live` is fail-closed** (`config-store.ts` default false) — an explicit `platform_live=true` row is set in the DB to keep the demo reachable for non-admins (flip via the admin panel). `db/index.ts` now **throws** if `DATABASE_URL` is missing.

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

# Storage bucket/policy (also creates the private `vaults` bucket now)
node scripts/setup-storage.mjs

# RLS regression tests (all expect PASS; self-cleaning — they delete their test rows):
node scripts/test-vault.mjs            # vault RLS + can() (18 checks)
node scripts/test-entitlement-rls.mjs  # purchase/enroll/progress forge-proof (#1)

# Headless DB/storage checks: node --input-type=module -e "...".
#   Use createClient(SUPA_URL, SERVICE_ROLE) + postgres(DATABASE_URL,{ssl:'require'}).
#   ALWAYS delete any rows/users/objects you created (Rule 3).
```

The `.env.local` keys you'll need: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (direct conn for scripts; **IPv4 pooler** string is needed for Vercel deploy).

---

## 6. Open items / what still needs the owner

**Highest priority — needs the owner:**
- **Counsel sign-off on the privacy/legal DRAFT** (`trust.ts` + `legal-terms.ts`, all `status:'in-review'`). Facts to bless: we send campaign briefs to **Anthropic** (+ web search); subprocessors are named; dev/marketing data-use is disclosed on a lawful-basis/consent footing. Not final until reviewed.
- **Vault Phase B decisions** — the 5 items in `VAULT_ARCHITECTURE.md` §15 (quota-on-delivery, signed-URL TTL, team seats, event-processor host, transfer trigger).

**Code still to do:**
- Deferred review findings needing UI (Rule 2) or a product call: **#10** browse category filter (editor must expose `cat`/`categories`), **#12** owner-lockout hang (needs error/upsell state), **AU1** guest-login error, **delete-account MFA step-up**, **N3** one-click-unsubscribe, **P2** fuller consent enforcement.
- Optional follow-ups: wire `consent.ai` to actually gate the AI feature + update the Account toggle copy (UI); drop the dormant `waitlist.city` column (collected nowhere); the **UX-resilience layer** (error boundaries, loading/error/empty states, form-draft persistence) — none exist yet (a big Rule-2 effort).
- Still-mock surfaces — most of `client/(workspace)/*` + many `dashboard/*` (jobs, projects, contracts, community, concierge, saved, news, trends, finance, …), `MY_COMPANY`, the now-gated `/company` page — must be DB-backed or demo-gated before launch.
- Remove "Continue as guest" + flip `DEMO_MODE=false` at launch. Phase 3 (Stripe) + Phase 4 (audit) per §3.

**Needs the owner (external keys/toggles):**
- **Resend** API key (live email) + `COMPANY_POSTAL_ADDRESS`; **IPv4 pooler** conn string (deploy); 2 Supabase toggles (**Anonymous sign-ins ON**, **Confirm email OFF**) + Auth dashboard rate-limit; **Upstash** creds (global cache + **global rate limits** — the limiter is per-instance until then); **Sentry** DSN + `npm i @sentry/nextjs`; **Stripe** account + Phase-3 money decisions. Dead deps to prune at cleanup: `better-auth`, `@libsql/client`.

---

## 7. Git

Branch `feat/studio-shop-academy`, **29 commits ahead of `origin` (not pushed)**. This session (newest first): `60f43d2` policy DRAFT → `1172fe3` consent gate → `c82e879` input validation → `1cd41cd` env hardening → `e8e011a` security remediation → `9ee5c26` roadmap(vault) → `5ccfd53` vault Phase A → `9d5aefd` VAULT_ARCHITECTURE → `07e7206` rate-limit coverage → `b71499d` previous handoff. Working tree clean. **No `.env.local` committed.**
