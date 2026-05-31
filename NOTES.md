# GRID — Working Notes

> Scratchpad for picking up across sessions. A new Claude chat starts fresh, so
> read this file first to get caught up.

## Where we are

- **Branch:** `feat/studio-shop-academy`
- **Latest commit:** `921974c` — "First In Line, escrow delivery, messaging, Create & Earn + Client HQ suites"
- **State:** working tree clean, all committed locally. **Not pushed** to GitHub yet
  (clone has no push auth). To back up remotely: `git push -u origin feat/studio-shop-academy`.
- Backup zip exists at `~/Downloads/grids-921974c.zip`.

### Local setup reminders
- Node lives at `/usr/local/bin` (Node 24). Dev server: `npm run dev` (port 3000).
- `.env.local` (gitignored) must exist with `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`,
  and `DATABASE_URL=file:/Users/johnhope/grids/local.db` (absolute path — relative broke when the
  dev server launched from the home dir).
- DB tables: `npm run db:push`. drizzle-kit push needs a TTY to confirm not-null column adds;
  if blocked, apply DDL directly via a `@libsql/client` script in the project dir.
- Test accounts: `test@grid.com` / `testpassword123` (John Hope), `sara@grid.com` / `sarapassword123`.

## What's built (high level)

- **Creator + Client roles** via the top toggle (`role-context`, persisted to `grid:role`).
- **DB-backed (Drizzle/SQLite):** Shop (storefront + buyer checkout), Academy (courses/lessons +
  optional price/enrollment gate). Tables in `src/lib/db/schema.ts`.
- **localStorage-backed (demo):** AI Studio, Community feed, Finance bank/withdraw, Contract
  versions, File Transfer/deliveries, Content Planner, Creative CRM moves.
- **First In Line** (creator) — opportunity intel + AI proposal builder.
- **File Transfer + escrow delivery** — watermarked previews → client accepts → full files + escrow release.
- **Profile messaging** — role-aware Book/Message/Check-profile.
- **Create & Earn (creator):** Brand Vault, Content Planner, AI Sales, Creative CRM, Price Intel, Match Score.
- **Client HQ (client):** Concierge, AI Project Builder, Content Vault, Deliverable Tracker,
  Marketing Advisor, Content Performance.

## NEXT UP (tomorrow): realistic pricing pass

Goal: set realistic, consistent pricing across the whole site — what creators expect to earn
vs. what clients will pay. Reconcile every hardcoded number + the fee model.

### Where pricing currently lives
- `src/lib/grid-data.ts` — `CREATIVES[].rate` (day rates), `Package` prices, `JOBS[].budget`,
  `PROJECTS[].budget`, `CONTRACTS[].total`, `METRICS`.
- **Fee logic (inconsistent on purpose right now):**
  - Booking fee 10% — `src/components/dashboard/sheets.tsx` (`BookingFlow`)
  - Shop fee 5% — `src/components/dashboard/buy-sheet.tsx`
  - Academy enroll fee 5% — `src/components/dashboard/academy-ui.tsx` (`EnrollAcademySheet`)
  - Withdrawals — `src/lib/bank.ts` (`payoutEstimate`)
- `src/lib/createearn.ts` — Price Intelligence `MARKET` (avg/suggested/premium), slider ranges;
  CRM/Sales lead `value`s; Match budget ranges.
- `src/lib/clienthq.ts` — Project Builder per-deliverable `unit` prices; Concierge `budgetLow/High`.
- Shop product prices + Academy course/lesson context.

### Open questions for the rundown
- One canonical Grid fee, or different per surface? (currently 10% booking / 5% shop+academy)
- Day-rate bands by category (Photo/Video/Drone) and by tier (new vs top-rated).
- Deliverable unit economics (per photo / reel / film / drone) — make Project Builder + Concierge agree.
- Market comparison anchors in Price Intelligence should match the real day-rate bands.
