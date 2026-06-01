/**
 * Best-effort in-memory rate limiter (fixed window). Zero dependencies.
 *
 * Keyed by an identifier you choose — prefer a userId, falling back to client IP.
 * NOTE: state is per server instance, so on serverless/multi-instance it limits
 * per-instance, not globally. That's fine as an abuse guard; for hard global
 * limits swap the Map for Upstash Redis (UPSTASH_REDIS_REST_URL/TOKEN) behind
 * this same `rateLimit()` signature — call sites won't change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000; // backstop against unbounded growth

export type RateLimitResult = { ok: boolean; limit: number; remaining: number; resetAt: number };

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size > MAX_TRACKED_KEYS) sweep(now);
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit: opts.limit, remaining: opts.limit - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  return { ok: existing.count <= opts.limit, limit: opts.limit, remaining, resetAt: existing.resetAt };
}

/** Best-effort client identifier from a request (proxy headers → "anon"). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}

function sweep(now: number): void {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}
