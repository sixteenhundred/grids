/**
 * Central SERVER-side environment access + validation.
 *
 * ⚠️ SERVER-ONLY. Never import this from a client component or anything a client
 * component transitively imports — it references server secrets. Client code
 * must use `@/lib/env.client` (NEXT_PUBLIC_* only).
 *
 * Validation is LAZY and NON-FATAL by design:
 *  - It runs on the first `getServerEnv()` call, never at module-eval/import time
 *    (a top-level throw would crash `next build` in CI when optional integration
 *    keys are unset).
 *  - Optional integrations (Stripe, Resend, S3…) are simply `undefined` when
 *    unset — the app boots fine; the service layer reports "unavailable".
 *  - Use `requireServerEnv(key)` at a call site that genuinely needs a value and
 *    wants to fail loudly *at request time* with a clear message.
 *
 * This module is the single source of truth for which keys exist and whether an
 * integration is configured (`isXConfigured()`).
 */
import { z } from "zod";

const serverEnvSchema = z.object({
  // ---- Core ----
  // Required at runtime; the DB layer (db/index.ts) fails loud if it's missing.
  // No default here — a bogus fallback would mask a misconfiguration.
  DATABASE_URL: z.string().optional(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),

  // ---- Demo account ----
  DEMO_EMAIL: z.string().optional(),
  DEMO_PASSWORD: z.string().optional(),
  DEMO_NAME: z.string().optional(),

  // ---- AI (Anthropic — installed) ----
  ANTHROPIC_API_KEY: z.string().optional(),

  // ---- Payments (Stripe — optional scaffold) ----
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ---- Email (Resend) ----
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  WAITLIST_NOTIFY_EMAIL: z.string().optional(),
  // CAN-SPAM requires a valid physical postal address in commercial email.
  COMPANY_POSTAL_ADDRESS: z.string().optional(),

  // ---- Supabase ----
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // ---- Storage (S3 / Cloudflare R2 — optional scaffold) ----
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // ---- Webhooks / rate-limit + cache backend (optional) ----
  WEBHOOK_SIGNING_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ---- Monitoring (Sentry — optional; needs `npm i @sentry/nextjs`) ----
  SENTRY_DSN: z.string().optional(),
  // Package name read at runtime so the optional import isn't bundle-resolved.
  SENTRY_PKG: z.string().default("@sentry/nextjs"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;
let warned = false;

/** Validated, cached view of server env. Lazy — call inside functions, not at module top level. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (parsed.success) {
    cached = parsed.data;
    return cached;
  }
  // Non-fatal: warn once, then fall back to a permissive read so a single
  // malformed OPTIONAL var never takes the whole app/build down.
  if (!warned) {
    warned = true;
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    console.warn(`[env] server environment has validation issues (continuing): ${detail}`);
  }
  cached = serverEnvSchema.partial().parse(process.env) as ServerEnv;
  return cached;
}

/** Read a single server var that MUST be present; throws a clear error at call time if missing. */
export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = getServerEnv()[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }
  return value as NonNullable<ServerEnv[K]>;
}

/* ---- Integration readiness (server-only; never expose to the client) ---- */
export const isAnthropicConfigured = (): boolean => !!getServerEnv().ANTHROPIC_API_KEY;
export const isStripeConfigured = (): boolean => !!getServerEnv().STRIPE_SECRET_KEY;
export const isResendConfigured = (): boolean => !!getServerEnv().RESEND_API_KEY;
export const isS3Configured = (): boolean => {
  const e = getServerEnv();
  return !!e.S3_ACCESS_KEY_ID && !!e.S3_SECRET_ACCESS_KEY && !!e.S3_BUCKET;
};
export const isCacheConfigured = (): boolean => {
  const e = getServerEnv();
  return !!e.UPSTASH_REDIS_REST_URL && !!e.UPSTASH_REDIS_REST_TOKEN;
};
export const isSentryConfigured = (): boolean => !!getServerEnv().SENTRY_DSN;
