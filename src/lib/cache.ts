import "server-only";

/**
 * Tiny cache helper. Uses Upstash Redis (REST) when configured so a result
 * computed for one user is reused for the next, instead of recomputing every
 * time; falls back to a per-instance in-memory TTL map otherwise. Same
 * `cached()` signature either way — call sites never change.
 *
 * Cache only NON-sensitive, shared, or per-key-scoped data (e.g. the public
 * marketplace list). Never cache another user's private data under a shared key.
 */
import { getServerEnv } from "./env";

type Entry = { v: unknown; exp: number };
const mem = new Map<string, Entry>();
const MAX_KEYS = 5_000;

function upstash(): { url: string; token: string } | null {
  const e = getServerEnv();
  return e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN
    ? { url: e.UPSTASH_REDIS_REST_URL.replace(/\/$/, ""), token: e.UPSTASH_REDIS_REST_TOKEN }
    : null;
}

async function redisCmd<T = unknown>(cmd: unknown[]): Promise<T | null> {
  const u = upstash();
  if (!u) return null;
  const res = await fetch(u.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${u.token}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: T };
  return json.result ?? null;
}

/** Get `key` from cache or compute it via `fn`, storing the result for `ttlSeconds`. */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  if (upstash()) {
    try {
      const hit = await redisCmd<string>(["GET", key]);
      if (hit != null) return JSON.parse(hit) as T;
    } catch {
      /* fall through to compute */
    }
    const value = await fn();
    redisCmd(["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)]).catch(() => {});
    return value;
  }

  // In-memory fallback (per server instance).
  const now = Date.now();
  const e = mem.get(key);
  if (e && e.exp > now) return e.v as T;
  const value = await fn();
  if (mem.size > MAX_KEYS) for (const [k, b] of mem) if (b.exp <= now) mem.delete(k);
  mem.set(key, { v: value, exp: now + ttlSeconds * 1000 });
  return value;
}

/** Drop a cached key (call after a write that changes it). */
export async function invalidate(key: string): Promise<void> {
  mem.delete(key);
  if (upstash()) await redisCmd(["DEL", key]).catch(() => {});
}
