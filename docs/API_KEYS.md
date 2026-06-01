# GRID — API Keys & Third-Party Integrations

How GRID handles secrets, environment variables, and external services — safely.

> **Golden rule:** no API key, secret, webhook secret, DB password, or auth
> secret may ever reach frontend code, client bundles, browser dev tools,
> console logs, screenshots, or committed files. Only `NEXT_PUBLIC_*` values are
> client-safe — and only when the provider marks them public.

---

## 1. Architecture

| Layer | File(s) | Role |
|---|---|---|
| Server env (validated) | `src/lib/env.ts` | Single source of truth for server secrets + `isXConfigured()`. **Server-only.** Lazy, non-fatal validation. |
| Client env | `src/lib/env.client.ts` | `NEXT_PUBLIC_*` only, inlined at build. Safe in client components. |
| Service layer | `src/lib/services/*.service.ts` | The only place external SDKs are constructed. Returns normalized `ServiceResult`. |
| Security helpers | `src/lib/security/*` | `requireUser`/`requireAdmin`, `rateLimit`, webhook signature verification. **Server-only.** |
| API routes | `src/app/api/**/route.ts` | Authenticated, rate-limited, validated entry points. Secrets used here only. |

**Flow for any external call:** client component → server action **or** `/api/*` route → security guards → service layer → provider. The browser never holds a secret or calls a paid API directly.

---

## 2. Environment variables

Legend: 🔒 = server-only (never exposed) · 🌐 = client-safe (`NEXT_PUBLIC_`)

### Core (in use today)
| Variable | Vis | Service | Read in |
|---|---|---|---|
| `DATABASE_URL` | 🔒 | Turso/libSQL (prod) or local SQLite | `src/lib/db/index.ts` |
| `DATABASE_AUTH_TOKEN` | 🔒 | Turso auth | `src/lib/db/index.ts` |
| `BETTER_AUTH_SECRET` | 🔒 | Better Auth session signing | better-auth (internal) |
| `ADMIN_EMAILS` | 🔒 | Admin allowlist (comma-sep) | `src/lib/admin.ts` |
| `DEMO_EMAIL` / `DEMO_PASSWORD` / `DEMO_NAME` | 🔒 | Built-in demo account | `src/lib/demo*.ts` |
| `ANTHROPIC_API_KEY` | 🔒 | Claude (Campaign AI) | `src/lib/services/ai.service.ts`, `campaign-ai.ts` |
| `NEXT_PUBLIC_APP_URL` | 🌐 | App base URL | `src/lib/auth-client.ts`, `env.client.ts` |

### Optional integrations (scaffolded — unset by default)
| Variable | Vis | Service | Activate with |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | 🔒 | Stripe payments/escrow | `npm i stripe` |
| `STRIPE_WEBHOOK_SECRET` | 🔒 | Stripe webhook verify | `npm i stripe` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🌐 | Stripe.js (publishable) | — |
| `RESEND_API_KEY` | 🔒 | Resend email | `npm i resend` |
| `EMAIL_FROM` | 🔒 | Default From address | `npm i resend` |
| `S3_REGION` / `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` | 🔒 | S3 / Cloudflare R2 | `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` |
| `WEBHOOK_SIGNING_SECRET` | 🔒 | Generic HMAC webhooks | — |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 🔒 | Durable rate-limit backend | `npm i @upstash/redis` |

> Anything containing `SECRET`, `PRIVATE`, `TOKEN`, `PASSWORD`, `WEBHOOK_SECRET`,
> `ACCESS_KEY`, or `API_KEY` is server-only unless the provider explicitly says
> it is public. **Never prefix a secret with `NEXT_PUBLIC_`.**

---

## 3. Adding variables

### Locally
1. Copy `.env.example` → `.env.local` (gitignored).
2. Fill in real values. `.env.local` is **never** committed.
3. Restart the dev server (env is read at boot).

### On Vercel
1. Project → **Settings → Environment Variables**.
2. Add each var, choosing the scope: **Development / Preview / Production** (keep test keys out of Production).
3. **Redeploy** — env changes don't apply to existing deployments.
4. Do **not** rely on `.env.local` in production; it isn't deployed.

The validator is **lazy and non-fatal**: missing *optional* keys just log a one-time warning and the related service reports "unavailable" — the app still builds and boots. Use `requireServerEnv("X")` where a value is truly mandatory and you want a clear request-time error.

---

## 4. Activating a scaffolded integration (Stripe / Storage / Email)

The scaffolds in `src/lib/services/` contain **no SDK imports**, so the build stays green before install. To turn one on:

1. `npm install <sdk>` (see table above).
2. Set the service's env vars (locally + Vercel).
3. In the service file, **uncomment** the `get<Service>()` slot and implement the methods.
   - ⚠️ Keep the dynamic `import("<sdk>")` line commented until the package is installed — bundlers statically resolve literal import specifiers, so referencing an uninstalled package breaks `tsc` and `next build`.
4. Re-run `npx tsc --noEmit && npm run build`, then test.

---

## 5. Webhooks

- Create the route under `src/app/api/.../route.ts` with `export const runtime = "nodejs"`.
- Read the **raw** body: `const raw = await req.text()` (never the parsed JSON).
- Verify the signature with `@/lib/security/webhook`:
  - `verifyStripeSignature({ payload: raw, header: req.headers.get("stripe-signature"), secret: getServerEnv().STRIPE_WEBHOOK_SECRET })`
  - or `verifyGenericHmac({ payload: raw, signatureHeader, secret: getServerEnv().WEBHOOK_SIGNING_SECRET })`
- Reject (400) on failure **before** any work.
- Make handlers **idempotent**: store processed event IDs and skip duplicates.
- Log only safe metadata (event id, type) — never payload contents.

---

## 6. Key rotation

1. Create the new key in the provider dashboard.
2. Update the var in Vercel (and `.env.local`).
3. **Redeploy.**
4. Test the integration end-to-end.
5. Revoke the old key in the provider dashboard.

Because every key lives in an env var (never hardcoded), rotation never requires a code change.

### 🚨 If a key leaks
1. **Revoke/rotate it in the provider dashboard immediately.**
2. Replace it in Vercel + `.env.local`; redeploy.
3. Check provider logs/usage for abuse; refund/limit if needed.
4. If it was committed: rotate first (assume compromised), then purge from git history (`git filter-repo`) and force-push. Rotation matters more than history scrubbing.
5. Confirm `.gitignore` still covers `.env*` and that no secret is in `.env.example`.

---

## 7. Security rules enforced here

- Secrets only in env vars, only used server-side (`env.ts`, services, routes).
- `env.ts` is server-only; client code uses `env.client.ts` (`NEXT_PUBLIC_*` only).
- Every external route: authenticate → rate-limit → validate → act → safe response.
- Provider errors are normalized; never forwarded raw to the client.
- Payments/escrow/subscription tier: always computed and verified server-side — never trust client values.
- File uploads: validate type/size/permission/ownership server-side; prefer signed URLs.
- AI routes: rate-limited + input-size cost guard, tied to the authenticated user.
- Webhooks: signature-verified, idempotent.
- Never log secrets, auth headers, tokens, contracts, messages, or PII.
