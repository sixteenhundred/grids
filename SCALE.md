# SCALE.md — how GRID handles scale

Maps each scale concern to what's in the codebase vs what the platform (Vercel + Supabase) provides. Most app code is stateless; state lives in Postgres, Storage, and (optionally) Redis.

| Concern | Status | Where |
|---|---|---|
| **Caching** | ✅ built (Upstash-or-memory) | `src/lib/cache.ts` |
| **Async jobs** | ✅ non-blocking via `after()`; queue guidance below | `waitlist-actions.ts` |
| **Fast queries (indexes)** | ✅ 25 indexes on hot columns | `src/lib/db/schema.ts` |
| **Load testing** | ✅ k6 script | `loadtest/browse.js` |
| **Horizontal scaling** | ✅ provided by Vercel (see note) | platform |
| **Locked-down DB** | ✅ RLS on all tables + server-only secrets | `supabase/rls.sql`, `src/lib/env.ts` |
| **Monitoring** | ✅ reporter + `onRequestError`; Sentry optional | `src/lib/monitoring.ts`, `src/instrumentation.ts` |

## Caching
`cached(key, ttlSeconds, fn)` returns a cached value or computes + stores it.
- With `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set → shared Redis cache across all instances.
- Without → per-instance in-memory TTL map (fine for a single instance / dev).
Applied to `listCreators()` (the public marketplace list — expensive: per-creator queries + signed URLs), TTL 30s, invalidated when a creator publishes/edits/changes portfolio. **Rule:** only cache shared or per-key-scoped data, never another user's private data under a shared key.

## Async jobs
Heavy, non-critical work runs **after the response** via Next's `after()` — e.g. waitlist confirmation/notification emails no longer block the signup. For heavier or retryable jobs (document scanning, large exports, batch email), add a durable queue:
- Upstash QStash or a `job` table + a cron/worker route. Keep the same "enqueue → return immediately → process out of band" shape; `after()` covers the lightweight cases today.

## Fast database queries
Indexes on every hot FK + filter column (see the table). Queries are targeted (select only needed columns, `.limit()`, owner-scoped `where`). Re-check `EXPLAIN` on the heaviest reads (`listProducts`, `listCreators`, review aggregation) as data grows.

## Load testing
`k6 run -e BASE_URL=https://your-deploy loadtest/browse.js` ramps to 50 VUs against the public surfaces with p95<800ms / <1% error thresholds. Run against a staging deploy **before** real traffic; tune `stages` to your launch estimate.

## Horizontal scaling
The decided stack is **Vercel**, which already runs the app as many stateless instances behind its edge/load balancer and autoscales with traffic — no ECS/Kubernetes/LB to manage (that would duplicate what Vercel provides and contradict the locked stack). What we owe in return is **statelessness**, which we have, with one caveat:
- The in-memory rate limiter (`security/rate-limit.ts`) and the in-memory cache fallback are **per-instance**. For hard global limits / a shared cache across instances, set the Upstash Redis env vars — both already fall back to Redis behind the same API. Do this before scaling to many instances.
- Supabase (Postgres + Storage) is the shared state tier; use the **IPv4 pooler** connection string in production (serverless connection pooling).

## Lock down the database
- **RLS on every table** (`supabase/rls.sql`): a user can only reach their own rows via the publishable-key/PostgREST surface; the app reads via Drizzle (server) with `requireUser()` + owner-scoped `where`. Proven by `scripts/test-rls.mjs` + the domain-table isolation tests.
- **Secrets are server-side only**: `.env.local` (gitignored), validated/read through `src/lib/env.ts` (server-only) with a `env.client.ts` split for the few `NEXT_PUBLIC_*` values (URL + publishable key). No secret is bundled into the client or committed (see `SECURITY_AUDIT.md`).

## Monitoring
`reportError(error, context)` always logs server-side and forwards to **Sentry** when `SENTRY_DSN` is set and `@sentry/nextjs` is installed (guarded dynamic import — inert until then). `src/instrumentation.ts` `onRequestError` captures server errors automatically; high-value swallowed errors (e.g. the AI route) also call `reportError`. To activate Sentry: `npm i @sentry/nextjs` + set `SENTRY_DSN`.
