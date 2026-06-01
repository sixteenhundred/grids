# GRID — Session Handoff / Cloning Brief

> Read this first when picking the project back up. Pair with `PROJECT_STATE.md`
> (full architecture snapshot) and `AGENTS.md` (Next-16 warning).
> Last updated: 2026-06-01.

---

## 0. Resume in 60 seconds

| | |
|---|---|
| **Repo** | `/Users/johnhope/grids` · remote `github.com/sixteenhundred/grids` |
| **Branch** | `feat/studio-shop-academy` (all session work pushed) |
| **Run** | `cd /Users/johnhope/grids && npm run dev` → http://localhost:3000 (or the "Grid Dev Server" launch config, port 3000) |
| **Build gate** | `./node_modules/.bin/tsc --noEmit` — **`next build` does NOT run eslint** |
| **Login (demo = admin)** | `joingrid@demo.com` / `joingrid2026` — but **auth is non-blocking**, so you can also just open `/dashboard` or click "Continue as guest" |
| **Stack** | Next.js **16.2.6** (App Router, Turbopack, React **19.2.4**), Tailwind **v4**, Drizzle + libSQL/Turso, Better Auth |

⚠️ **This is NOT the Next.js you know** (v16). Check `node_modules/next/dist/docs/` before relying on training-data assumptions. Server dynamic-page `params` is a **Promise** (await it).

---

## 1. Key routes

- `/` landing · `/login` `/signup` (both have "Continue as guest") · `/terms`
- `/dashboard` + all features · `/dashboard/admin` (Control Panel, admin-only)
- `/dashboard/campaign` (AI marketing concepts) · `/dashboard/operation` (My Operation HQ)
- `/waitlist` (pre-launch rainbow/liquid-glass page + email registry)
- `/trust` + `/trust/[...slug]` (Trust Center — public)
- **Cross-nav is wired**: waitlist ⇄ dashboard ⇄ trust (footer + sidebar links).

---

## 2. What this session built (newest first)

1. **Equal-prominence cookie buttons** — Accept all / Reject all / Customize are now visually identical (Constitution Art. IV; no nudging).
2. **Trust Center (`/trust`) + Cookie consent** — from the 13 GRID governance PDFs (see §4). Data-driven (`src/lib/trust.ts`: 10 categories, ~35 plain-language docs incl. the **published GRID Constitution**), search, dynamic doc/category pages, themed, honest `in-review` badges. Cookie banner (`src/components/cookie-consent.tsx`, mounted in root layout): equal-prominence choices, non-essential off by default, withdrawal via "Cookie settings", consent record stored.
3. **Real profile photos** — `Avatar` renders a portrait per `id` via CSS `background-image` (Pravatar) with graceful gradient fallback; app-wide, no call-site changes.
4. **Light-mode grey fix** — `.glass` utility was a hardcoded dark layer → tokenised; fixed crm/sales/operation/vault/builder in light mode.
5. **Dark/light theme toggle** — `src/components/theme.tsx` (`ThemeProvider`, **session state, no localStorage**) → `[data-theme]` on `<html>`; glowing sun/moon toggle in topbar. Works because surface/text Tailwind tokens are `var(--c-*)` runtime vars (the `@theme inline` trick) with dark+light sets in `globals.css`. Contrast guaranteed: white↔black buttons invert (`text-grid-black`), accent labels pinned via `--color-on-accent`; AA verified both modes.
6. **Demo mode (non-blocking auth)** — `dashboard/layout.tsx` never redirects (falls back to `DEMO_USER`); `guestLogin()` server action; auth UI preserved.
7. **On-theme demo data** — John Hope (real-estate photographer) rethemed off car brands (Porsche/Meridian Auto → Penthouse/Meridian Estates) in `src/lib/operation.ts`.
8. **Audit cleanup** — 7 unused imports + 1 unescaped entity fixed.

Earlier in the broader session: **Admin Control Panel** (`/dashboard/admin` — feature toggles, server audit/clean/restart, live status, `feature_flag` table), **Campaign feature** (live web research via Claude+`web_search` when `ANTHROPIC_API_KEY` set, else deterministic fallback; `src/lib/campaign*.ts`), **Waitlist** (`waitlist` table registry), env-overridable demo creds.

---

## 3. Open / next steps (priority order)

1. **Audit-log (DB) + Admin surface** — `audit_logs` table + logging service, shown in the Admin Control Panel (EPIC 4 / PRD 4). *Implementable in this stack — recommended next.*
2. **User Rights / "My Data" page** — export / delete / consent history / sessions (EPIC 3 / PRD 3). *Implementable here.*
3. **Demo enrichment (task #4, deferred)** — profile **banners** + **shop/academy** content. Note: shops/academies are **per-user DB records**; for a showcase, prefer a **static demo fallback** (renders rich default content with no DB) over seeding Turso. Profile *photos* are already done.
4. **Cookie "in-review" label decision** — keep / reword / draft fuller policy text (user asked about this; awaiting preference).
5. **Governance backend (large, phased)** — see §4.

---

## 4. The 13 GRID governance documents

Source PDFs: `/Users/johnhope/Downloads/GRID *.pdf`. Extracted text cached at `/tmp/gridtxt/*.txt` (regenerate with `pypdf` if gone — `/tmp` is ephemeral).

Docs: Constitution · Operating System · Master Control Matrix · Security Bible · Payment Manual · Implementation Package (the master spec) · Decision Archive Framework · Enterprise Risk Register · Evidence Architecture Spec · Future Scenarios · Global Governance Directive · Hostile Legal Review Checklist · Regulator Playbook.

**Implemented:** Trust Center (Part 4 / PRD 1), Cookie consent (PRD 2 / EPIC 2), Constitution published, honest disclosure layer.

**NOT implemented (documented phased backend program):** Postgres/Supabase **RLS** + the 20-table schema, 13-role **RBAC**, **escrow/ledger/production-wallet** money movement, **KYC/AML**, **MFA**, **moderation** engine, `audit_logs`/`consent_records` DB tables. **Reality check:** the app runs on **libSQL/Drizzle (not Postgres/Supabase)** — the spec's RLS/schema is a backend migration, not a feature edit. Honor the Implementation Package's **Final Rule** (answer data/access/policy/audit/disclosure/risk/control/failure before building).

---

## 5. Conventions & gotchas — do not break these

- **Hydration:** never read `localStorage` in `useState` initializers — hydrate in `useEffect`. The ~13 `react-hooks/set-state-in-effect` lint "errors" are this **intentional** pattern, **not bugs**. (Also `react-hooks/purity` on a `Date.now()` handler + a disabled `exhaustive-deps` are intentional.)
- **Theming:** surface/text Tailwind tokens resolve to `var(--c-*)` (themeable). In **arbitrary** `bg-[...]` gradients reference `--c-*` (or `--color-*`, which IS emitted to `:root`). Accent-button **labels** use `text-on-accent` (non-flipping light); body text uses `text-white` (flips). `--color-grid-black`/`text-grid-black` flip with theme.
- **`"use server"` files:** only async exports.
- **Build:** `tsc` gates the build; eslint does not.
- **Waitlist:** pure CSS now (Three.js/WebGL was removed — it was context-loss-prone; `three`/`@react-three/*` uninstalled).
- **Dashboard routes:** `export const maxDuration = 60` (Campaign web research can run 20–40s on Vercel).
- **Don't commit secrets**; `.env.local`, `local.db` are gitignored.

---

## 6. Environment variables (Vercel)

`BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN` for Turso), `DEMO_EMAIL`/`DEMO_PASSWORD`/`DEMO_NAME`, `ADMIN_EMAILS` (comma-sep), `ANTHROPIC_API_KEY` (enables live Campaign research; falls back to deterministic if unset). See `.env.example` + `DEPLOY.md`.

---

## 7. New/changed files this session (orientation map)

- `src/app/globals.css` — theme token system (`--c-*` dark/light sets, `.glass` tokens)
- `src/components/theme.tsx` — ThemeProvider + glowing toggle
- `src/components/cookie-consent.tsx` — consent banner + `CookieSettingsButton`
- `src/lib/trust.ts` + `src/app/trust/{layout,page,[...slug]/page,trust-search}.tsx` — Trust Center
- `src/app/dashboard/layout.tsx` — non-blocking auth + ThemeProvider
- `src/lib/demo-auth.ts` — `guestLogin()`
- `src/components/dashboard/{shell,ui,role-context,sheets}.tsx` — theme/contrast + nav links + Avatar photos
- `src/app/(auth)/{login,signup}/page.tsx` — "Continue as guest"
- `src/app/waitlist/page.tsx` — "Enter platform" link
- `src/components/landing/final-cta.tsx` — footer → Trust Center
- `src/lib/operation.ts` — on-theme demo data

`tsc` clean. Working tree clean. Branch pushed.
