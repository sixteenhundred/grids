/**
 * Contest domain — shared types, the fixed terms-of-admission block, and the
 * prize-token split math. No server imports: this is safe to use from client
 * components (the admin editor + creator submit UI) and server actions alike.
 * All money is MINOR units (cents).
 */

export type ContestType = "video" | "image";
export type ContestStatus = "draft" | "pending_funding" | "live" | "closed" | "finalized" | "canceled";
export type FundingSource = "grid" | "brand";

/** Fixed terms of admission — auto-attached to every contest, shown before submit. */
export const CONTEST_TERMS =
  "All submissions remain the private property of the submitting creator until purchased. " +
  "The contest host pays exclusively via the contest's prize tokens — each token carries a set " +
  "portion of the prize amount. A submission's ownership and usage rights transfer only when the " +
  "host redeems a token to purchase that specific work. Viewing a submission as a preview grants no usage rights.";

export const DEFAULT_TOKEN_COUNT = 3;
export const DEFAULT_TOKEN_SPLIT = [50, 30, 20]; // % for the default 3 tokens
export const DEFAULT_TOKEN_LABELS = ["1st place", "2nd place", "3rd place", "4th place", "5th place", "6th place"];

/** Upload limits per contest type (enforced client-side before upload + recorded server-side). */
export const VIDEO_MAX_BYTES = 2_000_000_000; // generous ceiling for a 4K ≤2-min clip
export const VIDEO_MAX_SECONDS = 120; // 2 minutes
export const IMAGE_MAX_BYTES = 5_000_000_000; // up to 5GB of image storage

export type TokenInput = { label: string; amount: number }; // amount = minor units

export type ContestView = {
  id: string;
  title: string;
  description: string;
  type: ContestType;
  status: ContestStatus;
  fundingSource: FundingSource;
  prizeAmount: number;
  platformFee: number;
  currency: string;
  submitCutoffAt: number | null;
  winnerPickAt: number | null;
  tokens: { id: string; idx: number; label: string; amount: number; status: string }[];
  submissionCount: number;
  createdAt: number;
};

/** A token split is valid only when the per-token amounts sum EXACTLY to the prize. */
export function validateSplit(
  tokens: { amount: number }[],
  prizeAmount: number,
): { ok: boolean; sum: number; error?: string } {
  if (!tokens.length) return { ok: false, sum: 0, error: "At least one prize token is required." };
  if (tokens.some((t) => !Number.isFinite(t.amount) || t.amount < 0)) {
    return { ok: false, sum: 0, error: "Token amounts must be zero or more." };
  }
  const sum = tokens.reduce((s, t) => s + Math.round(t.amount), 0);
  const prize = Math.round(prizeAmount);
  if (sum !== prize) {
    return { ok: false, sum, error: `Token amounts must sum to the prize (${(prize / 100).toFixed(2)}). Currently ${(sum / 100).toFixed(2)}.` };
  }
  return { ok: true, sum };
}

/** Convert a percentage split into exact minor-unit amounts (rounding drift lands on the 1st token). */
export function splitFromPercentages(prizeAmount: number, pcts: number[]): number[] {
  const prize = Math.max(0, Math.round(prizeAmount));
  const amounts = pcts.map((p) => Math.round((prize * p) / 100));
  const drift = prize - amounts.reduce((s, a) => s + a, 0);
  if (amounts.length) amounts[0] += drift;
  return amounts;
}

/** A sensible default percentage split for N tokens (50/30/20 for 3, else even). */
export function defaultPercentages(count: number): number[] {
  if (count === 3) return [...DEFAULT_TOKEN_SPLIT];
  const even = Math.floor(100 / count);
  const arr = Array.from({ length: count }, () => even);
  arr[0] += 100 - even * count; // remainder on the 1st
  return arr;
}
