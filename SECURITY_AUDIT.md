# SECURITY_AUDIT.md — GRID pre-launch security pass

Covers the four hardening asks (rate limiting, secret hygiene, input validation, full audit) plus the standing posture. Dated against the 2026-06 backend buildout.

## 1. Secrets & credentials — PASS
- `git grep` for live secret material (`sb_secret_`, `sb_publishable_`, service-role key, DB password, `sk_live_`/`sk_test_`, private keys) across tracked source: **none found**. The only match is a commented `sk_test_...` placeholder in `.env.example`.
- `.gitignore` ignores `.env*` and re-includes only `.env.example`. `.env.local` is **not tracked**.
- `NEXT_PUBLIC_*` exposure is limited to the app URL + Supabase **publishable/anon** key only — no secret is bundled into the client. Server secrets are read via `src/lib/env.ts` (server-only, with a client/`env.client.ts` split).
- Matches the published Trust claim "secrets… never in source code."

## 2. Rate limiting — IMPROVED
- `rateLimit()` (fixed-window, in-memory; swappable for Upstash Redis without call-site changes) now guards:
  - `/api/ai/campaign` — 5 / 60s per user (pre-existing).
  - `joinWaitlist` — 8 / 10 min **per IP** (public, unauthenticated).
  - `addReview` — 10 / hour per user.
  - product + portfolio upload-URL issuers — 60 / 15 min per user.
- **Authentication** routes are hosted by **Supabase Auth**, not this app; brute-force/OTP/signup rate limits are enforced by Supabase and configurable in the Supabase dashboard (Auth → Rate Limits). The clip's "5 attempts / 15 min on auth routes" maps to that setting — confirm it before launch.
- Caveat: in-memory limiter is **per server instance**. On multi-instance serverless it's a per-instance abuse guard, not a hard global cap. For hard global limits set `UPSTASH_REDIS_REST_URL/TOKEN` (the function signature already anticipates this).

## 3. Input validation / payload limits — IMPROVED
- API routes use Zod with size caps (campaign route caps brand text, image count + per-image bytes).
- Server actions now cap string inputs: profile name/specialty/city (80), bio (4000), package name (80)/detail (300), review body (4000), file names (300); waitlist email validated + capped at 254 (RFC).
- File uploads: per-file ≤ 5 GB (`checkFileSize`) + per-profile ≤ 50 GB (`reserveStorage`, atomic) enforced before issuing a signed upload URL and again at record time.

## 4. Authorization / data isolation — STRONG (verified)
- Two enforcement layers: app-layer `requireUser()` + `WHERE user_id = uid` on every query (Drizzle as `postgres` bypasses RLS), and **RLS on all 19 tables** locking the publishable-key/PostgREST surface.
- Verified by automated isolation tests: original tables (`scripts/test-rls.mjs`, 6/6), new domain tables (contract/version/review/dispute, 12/12 incl. EXISTS-subquery party reads), profile/portfolio/package backing (8/8 + 5/5 E2E). Cross-user read/write denied; anon denied; server-only tables locked.
- Entitlement gates on creator write paths (`requireFeatureAccess`); buyer/learner paths intentionally open.

## 5. Remaining vulnerabilities / gaps (ranked)
1. **Promised-but-unbuilt security features** (see POLICY_CONSTRAINTS.md §2): MFA for payout/wallet/security actions, session review/terminate, and an append-only audit trail are published as live but not implemented. Build before launch or downgrade the claim. *(Liability + security gap.)*
2. **In-memory rate limiter** is per-instance — wire Upstash for global limits before scale.
3. **No CSRF token on server actions** — Next.js server actions are POST-only with same-origin checks, which mitigates most CSRF, but high-impact actions (future payout/withdraw) should add an explicit re-auth/MFA step.
4. **No automated dependency / SAST scan in CI** — add `npm audit` + a SAST step (the clip's "Security Agent").
5. **No security headers/CSP audit** — add a Content-Security-Policy and standard headers (`X-Frame-Options`, `Referrer-Policy`, HSTS) via `next.config`/proxy before launch.
6. **Unsubscribe link is a GET** — token-protected and idempotent, but email-client prefetch could auto-unsubscribe a waitlister (low impact; they can rejoin).
7. **DMCA agent** must be registered with the U.S. Copyright Office (offline) for safe-harbor; the policy text + contact are in place.

## 6. Subscription / FTC compliance (from the launch clips) — Phase 3
These belong to the payments/subscription flow (not built; Stripe is last, Rule 1). Tracked as Phase-3 requirements:
- Auto-renewal disclosure **on the checkout screen** (amount, cadence, that it renews until cancelled).
- **Easy cancellation** with no dark patterns (cancel without contacting support) — already promised in the Trust Center; must be honoured.
- **Free-trial reminder before charge.**
- Apple/Google **in-app purchase** rules apply only to native iOS/Android apps; **N/A for the web app + Stripe web checkout**. Revisit only if native apps ship.
