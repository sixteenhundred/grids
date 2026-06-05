import "server-only";

/**
 * Defensive input helpers (Objective 2). We never assume client-sent values are
 * well-formed — every numeric / string / array boundary is coerced and bounded
 * here so malformed, missing, oversized, or out-of-range input degrades
 * gracefully instead of throwing deep in the data layer (e.g. NaN reaching an
 * integer column) or reaching an external API (the campaign brief → Anthropic).
 */
import { INTERESTS, type CampaignBrief } from "./campaign";
import { TALENT_CATEGORIES } from "./grid-data";

/** Primary creative categories — keep in sync with `Category` in grid-data.ts. */
const PRIMARY_CATEGORIES = ["Photo", "Video", "Drone", "Production", "Editing", "Crew"] as const;
export type PrimaryCategory = (typeof PRIMARY_CATEGORIES)[number];

/** Coerce to a bounded integer. Non-finite / non-numeric → fallback (handles NaN, Infinity, ""). */
export function safeInt(v: unknown, opts: { min?: number; max?: number; fallback?: number } = {}): number {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = min } = opts;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Trim and hard-cap a string. Non-strings → "". */
export function safeStr(v: unknown, max: number): string {
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}

/** Sanitize a client array into a deduped, bounded list restricted to `allowed`. */
export function sanitizeEnumArray<T extends string>(v: unknown, allowed: readonly T[], maxItems = 24): T[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<string>(allowed);
  const out: T[] = [];
  for (const x of v) {
    if (typeof x === "string" && set.has(x) && !out.includes(x as T)) out.push(x as T);
    if (out.length >= maxItems) break;
  }
  return out;
}

/** Validate a primary category value; unknown / non-string → undefined. */
export function safeCategory(v: unknown): PrimaryCategory | undefined {
  return typeof v === "string" && (PRIMARY_CATEGORIES as readonly string[]).includes(v)
    ? (v as PrimaryCategory)
    : undefined;
}

/**
 * Bound EVERY field of an untrusted campaign brief before it reaches the model:
 * brand length-capped, ages integer 0–120 with min ≤ max, interests restricted to
 * the known set, budget/weeks finite & in range, images count/size-capped. Never
 * throws — returns a safe brief so a malformed payload can't crash or run up AI cost.
 */
export function sanitizeBrief(input: unknown): CampaignBrief {
  const b = (input ?? {}) as Record<string, unknown>;
  const ageMin = safeInt(b.ageMin, { min: 0, max: 120, fallback: 13 });
  const ageMax = safeInt(b.ageMax, { min: 0, max: 120, fallback: 70 });
  const images = Array.isArray(b.images)
    ? b.images.filter((x): x is string => typeof x === "string" && x.length <= 2_000_000).slice(0, 6)
    : [];
  return {
    brand: safeStr(b.brand, 2000),
    images,
    ageMin: Math.min(ageMin, ageMax),
    ageMax: Math.max(ageMin, ageMax),
    interests: sanitizeEnumArray(b.interests, INTERESTS, 20),
    budget: safeInt(b.budget, { min: 0, max: 100_000_000, fallback: 0 }),
    weeks: safeInt(b.weeks, { min: 1, max: 260, fallback: 1 }),
  };
}
