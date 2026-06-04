import "server-only";

/**
 * Central rate-limit guard for server actions and route handlers.
 *
 * One place defines the policy; call sites just name a `scope`. Built on the
 * in-memory `rateLimit()` primitive (swap that for Upstash to go global — call
 * sites here won't change).
 *
 * Keying strategy (matters as much as the numbers):
 *  - Always throttle per authenticated uid when known (per-user fairness).
 *  - Also throttle per client IP for every non-read scope. This is what defeats
 *    the anonymous-sign-in bypass: minting fresh uids no longer resets the limit,
 *    because the IP bucket still counts. Unauthenticated calls fall back to IP.
 *  - Reads are uid-only on purpose: an IP bucket would false-positive on the many
 *    legitimate users behind one corporate/NAT/mobile-carrier address.
 *
 * Every window stays inside the 10–20 minute band (also clamped in rateLimit()).
 */
import { headers } from "next/headers";
import { rateLimit } from "./rate-limit";

export type RateScope =
  | "read" // heavy/list reads (marketplace, browse, listings)
  | "write" // generic mutations
  | "upload" // mint a signed upload URL / record an uploaded object
  | "download" // mint a signed download URL
  | "purchase" // purchase / enroll
  | "review" // post a review (abuse-sensitive)
  | "sensitive" // irreversible / heavy (account delete, data export, destructive admin)
  | "ai" // paid model calls
  | "auth"; // anonymous sign-in, waitlist — unauth, IP-keyed

const SCOPES: Record<RateScope, { limit: number; windowMs: number; byIp: boolean }> = {
  read: { limit: 300, windowMs: 10 * 60_000, byIp: false },
  write: { limit: 80, windowMs: 15 * 60_000, byIp: true },
  upload: { limit: 60, windowMs: 15 * 60_000, byIp: true },
  download: { limit: 60, windowMs: 15 * 60_000, byIp: true },
  purchase: { limit: 30, windowMs: 15 * 60_000, byIp: true },
  review: { limit: 10, windowMs: 20 * 60_000, byIp: true },
  sensitive: { limit: 5, windowMs: 20 * 60_000, byIp: true },
  ai: { limit: 5, windowMs: 15 * 60_000, byIp: true },
  auth: { limit: 12, windowMs: 15 * 60_000, byIp: true },
};

/** Best-effort client IP from proxy headers (Next 16: `headers()` is async). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
}

/** Thrown when a rate limit trips. `status` lets route handlers map it to 429. */
export class RateLimitError extends Error {
  readonly status = 429;
  constructor(message = "Too many requests. Please slow down and try again shortly.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Enforce the limit for `scope`. Pass the caller's uid when known. Throws
 * RateLimitError(429) when exceeded. Both the uid and IP buckets (when applicable)
 * must pass — whichever trips first stops the request.
 */
export async function enforceRateLimit(scope: RateScope, uid?: string | null): Promise<void> {
  const cfg = SCOPES[scope];
  if (uid && !rateLimit(`${scope}:u:${uid}`, cfg).ok) throw new RateLimitError();
  if (cfg.byIp || !uid) {
    const ip = await clientIp();
    if (!rateLimit(`${scope}:ip:${ip}`, cfg).ok) throw new RateLimitError();
  }
}
