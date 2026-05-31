# GRID — PROJECT STATE

> Snapshot of the GRID platform. Read this first when picking up the project.
> Last updated: 2026-05-31

---

## 0. AT A GLANCE

| | |
|---|---|
| **Product** | GRID — marketplace + business OS for visual creatives (photographers, cinematographers, drone pilots) and the clients who hire them. |
| **Git branch** | `feat/studio-shop-academy` |
| **Latest commit** | `4af880a` — "feat: built-in demo login (works with no database)" |
| **Working tree** | clean (all committed) |
| **Pushed to GitHub?** | ❌ No — committed locally only. Remote (`github.com/sixteenhundred/grids`) does not yet have this work. |
| **Build status** | ✅ `npm run build` passes |
| **Deploy target** | Vercel (+ Turso for the database). See `DEPLOY.md`. |
| **Demo login** | `Alexanderhopebooking@gmail.com` / `Masterkey2403!` (works with no DB). Local test accounts: `test@grid.com` / `testpassword123`, `sara@grid.com` / `sarapassword123`. |

---

## 1. CURRENT ARCHITECTURE

- **Framework:** Next.js **16.2.6** (App Router, Turbopack, React **19.2.4**). ⚠️ This is a newer/non-standard Next — read `node_modules/next/dist/docs/` before relying on training-data assumptions (see `AGENTS.md`).
- **Language:** TypeScript (strict). Production build runs `tsc` — type errors block the build even though Turbopack dev skips them.
- **Styling:** Tailwind CSS **v4** (via `@tailwindcss/postcss`). Brand tokens defined in `src/app/globals.css` under `@theme inline` (off-black `#08090c`, off-white `#f5f5f7`, accent palette). Custom utilities: `.glass`, `.glass-hover`, `.rise`, `ring-sweep`, `radar-scan`, `no-scrollbar`.
- **Animation:** `motion` (Framer Motion v12) — used in `sheet.tsx`, `role-context.tsx`, landing. Most dashboard animation is pure CSS for robustness.
- **Auth:** Better Auth **1.6.11** (email/password), Drizzle adapter, `nextCookies()` plugin. Catch-all API route. Plus a **built-in demo login** (cookie-based) that works without a DB.
- **Database:** Drizzle ORM **0.45.2** over **libSQL** (`@libsql/client`). Local = SQLite file; production = **Turso** (`libsql://...` + auth token). `src/lib/db/index.ts` supports both via env.
- **Data strategy (IMPORTANT):** Two tiers —
  1. **DB-backed (Drizzle/SQLite/Turso):** auth, **Shop**, **Academy** only.
  2. **localStorage / static mock (client-side):** everything else — Studio, Community, Finance withdraw/bank, Contract versions, File Transfers/deliveries, Content Planner, Creative CRM, My Operation workspace, profile overrides, etc. This is intentional for demo velocity; see §12.
- **Server Actions:** used for the DB features (`shop-actions.ts`, `academy-actions.ts`, `demo-auth.ts`). `serverActions.bodySizeLimit` raised to **6mb** in `next.config.ts` (data-URL image uploads).
- **Roles:** A single user toggles **Creator ⇄ Client** via `role-context.tsx` (persisted to `localStorage` `grid:role`). Navigation, home, and many pages branch on role. There is no separate account type — role is a UI mode.

---

## 2. FILE STRUCTURE

```
grids/
├── AGENTS.md / CLAUDE.md      # "this is NOT the Next.js you know" warning
├── DEPLOY.md                  # Vercel + Turso deploy guide
├── NOTES.md                   # session handoff notes (pricing rundown plan)
├── PROJECT_STATE.md           # this file
├── brand.md                   # full brand guidelines
├── .env.example               # env var template
├── next.config.ts             # serverActions bodySizeLimit: 6mb
├── drizzle.config.ts          # sqlite local / turso prod (auto-detect)
├── reference/grid-prototype.html   # original static prototype (design source)
└── src/
    ├── app/
    │   ├── layout.tsx, page.tsx, globals.css, favicon.ico
    │   ├── terms/page.tsx                 # public Terms of Service
    │   ├── (auth)/                         # login, signup, auth-ui, layout
    │   ├── api/auth/[...all]/route.ts      # Better Auth handler
    │   └── dashboard/
    │       ├── layout.tsx                  # auth guard + demo session + DEMO_USER
    │       ├── page.tsx                    # role-aware home
    │       ├── operation/                  # My Operation HQ (creator)
    │       ├── browse, jobs, projects, contracts(+[id]), finance, transfer,
    │       │   profile, radar, community, saved, news(+[id]), trends,
    │       │   creative/[id]
    │       ├── studio, collab, first-in-line          # creator: Create & Earn
    │       ├── vault, planner, sales, crm, pricing, match   # creator: Create & Earn
    │       ├── shop(+/browse,/customize,/[shopId])    # DB-backed
    │       ├── academy(+/browse,/customize,/[academyId],/course/[courseId],/lesson/[lessonId])  # DB-backed
    │       └── concierge, builder, content-vault, tracker, advisor, performance  # client: Client HQ
    ├── components/
    │   ├── dashboard/   # ui, cards, sheet, sheets, shell, icons, role-context,
    │   │                # storefront, academy-ui, buy-sheet
    │   └── landing/     # landing sections (hero, nav, pricing, talent, escrow,
    │                    # jobs, audience, trust, how-it-works, final-cta, ui, motion, reveal…)
    └── lib/
        ├── db/{index.ts, schema.ts}
        ├── auth.ts, auth-client.ts
        ├── demo.ts, demo-auth.ts           # built-in demo login
        ├── grid-data.ts                    # the big static dataset (creatives, jobs, etc.)
        ├── shop.ts + shop-actions.ts        # DB
        ├── academy.ts + academy-actions.ts  # DB
        ├── studio.ts, community.ts, bank.ts, contracts-store.ts,
        │   transfers.ts, profile-store.ts   # localStorage stores
        ├── createearn.ts, clienthq.ts, firstinline.ts, operation.ts  # feature data
        └── legal-terms.ts                   # ToS content
```

---

## 3. DATABASE SCHEMA (`src/lib/db/schema.ts`)

SQLite/libSQL via Drizzle. **13 tables:**

**Auth (Better Auth core):**
- `user` (id, name, email, emailVerified, image, timestamps)
- `session` (token, expiresAt, ipAddress, userAgent, userId→user)
- `account` (providerId, password hash, tokens, userId→user)
- `verification` (identifier, value, expiresAt)

**App:**
- `profile` — 1:1 user extension (handle, role, bio, location)
- `shop` — one per user (name, description, logo, banner, layout)
- `product` — many per shop (title, description, price, type, coverImage, fileName, fileSize)
- `purchase` — buyer ↔ product
- `academy` — one per user (name, description, logo, banner, **price**)
- `academy_enrollment` — learner ↔ academy (paid access)
- `learning_path` — courses inside an academy (title, level, coverImage)
- `lesson` — within a path (title, content, duration, position)
- `lesson_progress` — completion per user per lesson

Migrations: `npm run db:push` (drizzle-kit). For Turso, set `DATABASE_AUTH_TOKEN`.

---

## 4. API ROUTES

- `POST/GET /api/auth/[...all]` — Better Auth catch-all (sign-in, sign-up, session, sign-out).
- **All other server logic is Server Actions**, not REST routes:
  - `src/lib/shop-actions.ts` — `getMyShop, updateShopConfig, createProduct, removeProduct, listProducts, listShops, getShopById, purchaseProduct, listMyPurchases`
  - `src/lib/academy-actions.ts` — `getMyAcademy, updateAcademyConfig, createPath, removePath, createLesson, removeLesson, listAcademies, getAcademyById, getPath, getLesson, setLessonComplete, enrollAcademy, listMyEnrollments`
  - `src/lib/demo-auth.ts` — `demoLogin, demoLogout, hasDemoSession`

---

## 5. UI COMPONENTS BUILT (`src/components/dashboard/`)

- **`ui.tsx`** — design system: `Surface, Card, PageHeader, SectionHeader, MetricCard, StatusPill, TrustBadge, Tag, Stars/StarRow, Avatar, MediaTile` (gradient + optional uploaded image), `StageTracker, Progress, Button, IconTile, AmbientGlow, Ring` (CSS-animated circular score), `ACCENT` map. Re-exports `Icon, Verified`.
- **`icons.tsx`** — dependency-free SVG icon set + `ICONS` map + `<Icon name=…/>`. ~60 icons.
- **`cards.tsx`** — `CreativeCard, FeaturedCreativeCard, JobCard, JobRow, ProjectCard, PostCard, ReviewCard, PackageRow, CourseCard, ProductCard`.
- **`sheet.tsx`** — bottom-sheet/modal provider (`useSheet`, `open/close`), `SheetHeader, SheetRow`.
- **`sheets.tsx`** — `BookingFlow, PostJobSheet, UploadSheet, NotificationsSheet, InviteSheet, AddCrewSheet, ManageCrewSheet, ApplyJobSheet, MessageSheet, QuickProfileSheet`.
- **`shell.tsx`** — dashboard chrome: collapsible icon sidebar (persisted), role-aware nav, topbar (search, RoleToggle, +, notifications, **universal Back button** on nested routes), mobile bottom nav + drawer.
- **`storefront.tsx`** — shared Shop/Academy header + product layouts (`ShopLogo, ProductTile, ProductRow, ProductLayout, StorefrontHeader`).
- **`academy-ui.tsx`** — `CourseTile, AddCourseSheet, AddLessonSheet, EnrollAcademySheet, PriceTag, ImageUpload`.
- **`buy-sheet.tsx`** — escrow-style product checkout.
- **`role-context.tsx`** — `RoleProvider, useRole, RoleToggle`.

---

## 6. FEATURES — COMPLETED ✅

**Core marketplace**
- Landing page (all sections, CTAs wired to /signup, /login, /terms, section anchors).
- Auth: email/password sign-up/in/out + **built-in demo login** (no DB needed).
- Role toggle Creator ⇄ Client (persisted), drives nav + page content.
- Browse/Hire (search + category + **budget slider**), Creative profiles (role-aware **Book / Message / Check profile**), Saved.
- Jobs board + **Apply popup** (quick message + apply), Post a job.
- Projects (+ delivery feed), Contracts list + **detail with edit & immutable version history**.
- Finance (escrow ledger + **Withdraw popup** with editable bank details, instant / 1–3 day payout).
- Radar (urgent jobs → apply, nearby → quick profile), Community (**post + like**, interactive), News (**article pages**), Trends (**clickable detail**).
- Profile (creator + client) — **editable & persisted**, portfolio manage.

**DB-backed**
- **Shop** — storefront (logo/banner/3 layouts), product upload (cover/file), buyer browse + per-shop pages + **escrow checkout**.
- **Academy** — school customize + **optional price**, courses → lessons, progress tracking, browse, read-only storefronts, **enrollment gate** for priced academies.

**File delivery (escrow-gated)**
- Creator Transfer → pick client → drag-drop upload → mark delivery.
- Client receives **watermarked previews**; **Accept** unlocks full files + releases escrow. Notifications both ways; status in Projects.

**Create & Earn (creator)** — `First In Line` (opportunity intel + AI proposal builder), `Brand Vault`, `Content Planner` (drag-drop calendar), `AI Sales Assistant` (radar/missions), `Creative CRM` (drag pipeline), `Price Intelligence` (sliders + earnings graph), `Match Score` (animated rings), plus existing `AI Studio, Shop, Academy, Collab`.

**Client HQ (client)** — `Creative Concierge`, `AI Project Builder`, `Content Vault`, `Deliverable Tracker`, `Marketing Advisor`, `Content Performance`.

**My Operation HQ (creator)** — personalized command center: status bar, Today's Priorities, Active Operations (advance → auto-archive), Timeline, Pipeline (drag), Deliverables, Financial Command Center, Client Health, AI Assistant, Feed, Archive. **Customizable:** rename (reflected in nav), banner upload, accent/mood, widget collapse/hide/reorder — all persisted.

**Platform polish** — collapsible sidebar, universal back button, full **Terms of Service** page, **dead-link audit** (0 dead buttons/links across the app).

---

## 7. FEATURES — PARTIALLY COMPLETE / DEMO-ONLY ⚠️

These work in-session but are **not wired to a real backend**:
- **Messaging** — `MessageSheet` sends to a success state; there is **no inbox / conversation persistence**.
- **AI features** (proposals, concierge, project builder, studio, marketing advisor) — outputs are **deterministic mock generators**, not real model calls. No API keys.
- **File uploads** — images stored as **data URLs** (downscaled); **product/delivery file bytes are metadata only** (name + size) — no object storage.
- **Payments / escrow / withdrawals** — **simulated** (no Stripe/processor). Bank details + transactions are localStorage/mock.
- **localStorage-backed features** (Studio, Community, Finance, Contracts versions, Transfers, Planner, CRM, My Operation config, profile edits) — **per-device, per-browser**; not shared across users/devices.
- **Notifications** — static list + delivery-derived entries; no real-time/push.
- **Search bar** (topbar) links to Browse; not a real search.
- **Pricing** — numbers are placeholders; a realistic pricing pass is the planned next task (see NOTES.md).

---

## 8. PENDING BUGS / KNOWN ROUGH EDGES

- **My Operation greeting** shows "Welcome back, creator" instead of the user's name in **demo mode** (home page uses Better-Auth `useSession`, which has no session under demo cookie). Avatar/sidebar correctly show "John Hope". Cosmetic.
- **Nav label for custom workspace name** updates on navigation/reload, not instantly after renaming on the same page (shell reads localStorage on `pathname` change).
- **Shop / Academy require a real database.** Under the demo login with no DB connected, those two pages will hang on "Loading…" (every other page works). With Turso connected they work for the demo user.
- **Terms of Service** contains bracketed placeholders (`[Legal Company Name]`, `[Insert Jurisdiction]`, dates, contact) that must be filled before any real launch, and needs attorney review.
- **`.env.local`** was rewritten by the Vercel CLI (now contains `VERCEL_OIDC_TOKEN`); local dev DB/secret may need restoring from `.env.example` if local auth/DB breaks.
- No automated tests exist.

---

## 9. NEXT PRIORITIES

1. **Realistic pricing pass** (planned — see NOTES.md): one canonical Grid fee model; day-rate bands by category/tier; deliverable unit economics; align Price Intelligence, Project Builder, Concierge. Current fees are inconsistent on purpose (booking 10%, shop 5%, academy 5%).
2. **Push to GitHub** + finish Vercel/Turso deploy for a stable shareable link.
3. **Real messaging** (inbox + `conversation`/`message` tables) — most-requested missing backend.
4. **Object storage** (S3/R2) for real file delivery + product/lesson media; then real watermarking.
5. **Real payments/escrow** (Stripe Connect or similar).
6. Move high-value localStorage features (contracts versioning especially — it's an audit trail) to the database.
7. **My Operation phase 2:** multiple workspaces, template marketplace, AI workspace designer, custom-widget builder, ambience controls.
8. Real AI integration (Anthropic/OpenAI) behind the existing generator interfaces.

---

## 10. IMPORTANT IMPLEMENTATION DECISIONS

- **libSQL/Drizzle chosen** so the same code runs local SQLite and prod Turso with only env changes (`src/lib/db/index.ts`).
- **`DATABASE_URL` must be an ABSOLUTE path locally** (`file:/Users/.../grid/local.db`). A relative path broke when the preview server launched from the home dir.
- **Hydration safety:** components that read `localStorage` initialize from defaults and hydrate in `useEffect` (never read storage in `useState` initializers) — this caused a real hydration-mismatch bug on My Operation that was fixed.
- **Sheets manage their own local state.** `open(<Sheet/>)` captures a node once; sheets that bind inputs to a passed-in prop freeze. (This bug hit the My Operation Customize sheet — fixed by local state.)
- **Demo login is intentional** — `src/lib/demo-auth.ts` hard-codes one account and signs in via cookie so the product is fully demoable with no DB. Password lives server-side only (never shipped to the client bundle). Delete the file + its callers to remove.
- **`NEXT_PUBLIC_DEMO_MODE=1`** = fully open (no login at all). Unset = login wall where the demo creds work.
- **`Brandable` type** (storefront) is the minimal `{name, description, logo, banner}` so Shop and Academy share the header — do not add `layout` to it (a `ShopLogo` config with `layout` broke the build).
- **Drizzle push needs a TTY** to confirm not-null column adds; in non-interactive shells apply DDL directly via a `@libsql/client` script.
- **Accent system:** all role/tone colors flow through `ACCENT` in `ui.tsx`. Use literal Tailwind class strings (JIT can't see computed ones).

---

## 11. THINGS THAT SHOULD **NEVER** BE CHANGED (without deliberate care)

- **Do NOT commit secrets.** `.env.local`, `local.db`, and archive zips are gitignored — keep it that way. Never hardcode `BETTER_AUTH_SECRET` or DB tokens in committed files.
- **Do NOT read `localStorage` in `useState` initializers** (or any render path) — always hydrate in `useEffect`. Breaks SSR hydration.
- **Do NOT make a sheet's fields read from a prop captured at `open()` time** — give editable sheets their own local state.
- **Do NOT remove the `.catch(() => null)` on `auth.api.getSession`** in `dashboard/layout.tsx` / action `requireUser` — it keeps the app loading when no DB is configured (demo).
- **Do NOT make `DATABASE_URL` relative** for local dev — use an absolute path.
- **Do NOT add non-async exports to `"use server"` files** (`shop-actions.ts`, `academy-actions.ts`, `demo-auth.ts`) — only async functions. Shared constants live in plain modules (`demo.ts`, `shop.ts`, `academy.ts`).
- **Do NOT widen the `Brandable` type** in `storefront.tsx`.
- **Do NOT assume standard Next.js behavior** — this is Next 16; check `node_modules/next/dist/docs/` per `AGENTS.md`.
- **Do NOT delete `reference/grid-prototype.html`** — it's the original design source of truth.
- **Build gate:** production `next build` type-checks. Keep it green — Turbopack dev will not catch type errors.

---

*Generated from the live repo at commit `4af880a`.*
