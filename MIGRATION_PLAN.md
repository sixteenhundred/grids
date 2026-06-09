# GRID — STAGED MIGRATION PLAN

Follows `RECON_REPORT.md`. **Nothing has moved yet.** This plan is the second approval gate — review it, then I execute one stage at a time, verifying + checkpoint-committing after each.

---

## Operating model

- **`grids/` (source) stays READ-ONLY and untouched.** All work happens in a new sibling **`GRID-CLEAN-ENGINEERING/`**, which begins as a faithful copy and is restructured in place.
- **Fresh git history in the target** (`git init`) so every stage is one clean, revertable checkpoint commit. The source repo keeps its own history.
- **One stage at a time.** Each stage is independent, reversible, and ends at a green build. If a stage can't be made green, I roll it back (`git reset --hard` the stage) and report rather than push forward on a broken base.
- **Verification gate after every stage** (the same checklist each time — see below).
- **Running log** appended to `docs/REFACTOR_NOTES.md` in the target per stage (what moved, what broke, what was fixed).

### Verification gate (run after each stage)
1. `npx tsc --noEmit` → clean (catches every broken import + client/server boundary).
2. `npm run build` → green.
3. **Route-manifest diff** — compare the built route list against the Stage-0 baseline; count must match (no route lost/renamed unintentionally).
4. `grep` for new `process.env.*` / `getServerEnv` keys → none silently introduced.
5. `next dev` smoke (curl `/`, `/waitlist`, `/dashboard`, `/client/dashboard`, `/dashboard/admin`) at Stage 0 and at the final stage.
6. Commit `stage-N: <name>` only after 1–4 pass.

---

## Decisions baked in (veto any before I start)

1. **Dead code → archived, not deleted.** Everything provably unused moves to `archive/legacy-code/` (your Section 7 default). Nothing is hard-deleted.
2. **"Escrow" rename = conceptual/user-facing wording only.** The `escrow-green` *color token* stays (renaming it is pure cosmetic churn touching hundreds of lines for zero structural gain). User-facing copy + doc comments standardize to "separate charges & transfers / 90-day hold."
3. **`RECON_REPORT.md` + `MIGRATION_PLAN.md` location.** Kept at the source root for now (additive, reversible); copied into `GRID-CLEAN-ENGINEERING/docs/` during the migration. Say if you want them elsewhere.

---

## Target structure (adapted to Next.js 16 — `app/` must hold routes)

```
GRID-CLEAN-ENGINEERING/
├─ src/
│  ├─ app/            # routes ONLY; pages become thin wrappers importing features
│  │  └─ (auth)/ dashboard/ client/ company/ trust/ waitlist/ api/ …
│  ├─ features/       # ★ the main win: each domain self-contained
│  │  └─ <domain>/    # actions.ts · components/ · types.ts · data.ts(demo) · utils
│  │     auth · creator-profile · client-workspace · shop · academy · payments
│  │     contracts · vault · campaign · operation · community · admin
│  │     waitlist · trust-legal · subscription
│  ├─ components/
│  │  ├─ ui/          # consolidated design system (dashboard+client+landing kits)
│  │  └─ layout/      # shells, nav, context providers, theme
│  ├─ server/         # server-only cross-cutting (was lib/security): auth-guard,
│  │                  #   rate-guard, webhook, entitlements, audit, monitoring
│  ├─ services/       # stripe · paypal · email · storage · ai      (was lib/services)
│  ├─ db/             # schema · client                              (was lib/db)
│  ├─ lib/            # truly shared utils: format(money) · id · validation · cache
│  ├─ config/         # env · features · client/config · config-store
│  ├─ types/          # shared types extracted from grid-data
│  ├─ hooks/          # use-local-state, …
│  ├─ styles/         # globals.css
│  ├─ proxy.ts · instrumentation.ts
├─ docs/              # all markdown consolidated + new architecture docs
├─ tests/             # domain-security.test + scaffolding
├─ scripts/           # existing .mjs utilities (unchanged)
├─ archive/legacy-code/   # dead code, with a README explaining each item
├─ public/ · supabase/ · config files (next.config.ts, drizzle.config.ts, vercel.json…)
└─ GRID_PROJECT_MAP.md
```

Routes stay in `app/`; the restructure moves **logic and components** out of fat pages into `features/`, so `app/` pages get thin and traceable.

---

## Stages (ordered low-risk → high-blast-radius)

### Stage 0 — Clean target + baseline  *(no source mutation)*
- Copy `grids/` working tree → `GRID-CLEAN-ENGINEERING/`, excluding `.git`, `node_modules`, `.next`, `.vercel`, `local.db`, `tsconfig.tsbuildinfo`.
- `git init` + initial commit; `npm install`; run full verification gate to **capture the baseline** (record route count + build result in `docs/REFACTOR_NOTES.md`).
- **Rollback:** delete the folder. **Commit:** `stage-0-baseline`.

### Stage 1 — Archive provably-dead code
- Grep each for importers (final confirmation), then move to `archive/legacy-code/`: `src/lib/auth.ts`, `src/app/api/auth/[...all]/`, `src/lib/env.client.ts`, `src/lib/client/mock.ts`, `waitlist-clone.html`.
- Drop `better-auth` + `@libsql/client` from `package.json`; remove `auth:generate` script; remove `BETTER_AUTH_SECRET` + `DATABASE_AUTH_TOKEN` from `src/lib/env.ts`. `npm install` to refresh the lockfile.
- **Verify** gate. **Rollback:** revert the stage commit. **Commit:** `stage-1-archive-dead`.

### Stage 2 — Shared utilities (`money`, `id`)
- Create `src/lib/format.ts` (one canonical `money()` — €, with `per`) and `src/lib/id.ts` (one `genId`). Repoint the 5 `money()` + 4 `genId()` call sites; remove the local copies.
- **Verify.** **Commit:** `stage-2-shared-utils`.

### Stage 3 — Promote already-grouped infra (`services/`, `server/`, `db/`, `config/`, `styles/`, `hooks/`)
- Move `src/lib/services → src/services`, `src/lib/db → src/db`, `src/lib/security → src/server`, `globals.css → src/styles/`, `use-local-state → src/hooks/`; gather env/features/config-store into `src/config/`. Update imports (mechanical, greppable; `@/` alias unchanged).
- Done as **sub-commits per move** so each is independently revertable.
- **Verify** after each move. **Commit(s):** `stage-3a-services` … `stage-3e-config`.

### Stage 4 — Extract shared types out of `grid-data.ts`
- Move pure types (`Role`, `Accent`, `Tile`, `Review`, `Job`, `Contract`, …) → `src/types/`. Leave the demo *data* in place for now (split in Stage 6). Repoint imports.
- **Verify.** **Commit:** `stage-4-types`.

### Stage 5 — Feature modules
- One sub-stage per domain. For each, co-locate its `*-actions.ts` + data module + components under `src/features/<domain>/`, thin the route page to a wrapper, update imports, **verify**, commit. Order: payments → shop → academy → contracts → vault → campaign → operation → community → admin → creator-profile → client-workspace → waitlist → trust-legal → auth.
- Each domain is its own checkpoint (`stage-5-payments`, `stage-5-shop`, …) so any single feature move is revertable in isolation.

### Stage 6 — Split the oversized files
- `grid-data.ts` (683) → types already out (Stage 4); demo data → per-feature `data.ts`. `sheets.tsx` (669) → one modal per file. Thin the >600-line pages (`operation`, `jobs`, `tasks`, `company/[slug]`). Highest blast radius → done late, one file per commit.
- **Verify** per file. **Commit(s):** `stage-6-split-<file>`.

### Stage 7 — "Escrow" language standardization
- Copy/comment pass per Decision 2 (landing section, trust/legal copy, `operation.ts` status string, schema/service doc comments). Color token untouched.
- **Verify.** **Commit:** `stage-7-language`.

### Stage 8 — Docs consolidation + authored docs
- Move all root markdown → `docs/` (mark stale ones). Author: `ARCHITECTURE.md`, `FOLDER_STRUCTURE.md`, `PAYMENTS.md` (separate charges & transfers, 90-day hold, no escrow language), `AUTH.md`, `DATABASE.md`, `ENVIRONMENT_VARIABLES.md`, `DEVELOPER_ONBOARDING.md`, `REFACTOR_NOTES.md` (the running log, finalized). Write `GRID_PROJECT_MAP.md` at root.
- **Commit:** `stage-8-docs`.

### Stage 9 — Final verification + report
- Full gate + `next dev` smoke across all surfaces. Produce the Final Report (moved/renamed/archived, imports fixed, errors found, env needed, build/test/dev results, recommended next steps).
- **Commit:** `stage-9-final`.

---

## Risk register
- **Highest risk:** Stage 5 (feature moves) + Stage 6 (`grid-data.ts` split) — broadest import churn. Mitigated by per-domain/per-file commits + verify-after-each.
- **Import paths:** the `@/* → src/*` alias means most moves only change the segment after `@/`; all greppable. No alias trickery — real paths.
- **No behavior change intended** anywhere. This is structural. Payment/auth/permission *logic* is moved verbatim, never rewritten (Rule 1). Any change that would alter money/auth behavior stops for explicit sign-off.
- **Env:** no new env vars introduced; two legacy ones removed (Stage 1).

---

## To proceed
Reply **"go"** to execute **Stage 0** (create `GRID-CLEAN-ENGINEERING/`, install, capture baseline) — I'll report the baseline before touching Stage 1. Or tell me what to adjust.
