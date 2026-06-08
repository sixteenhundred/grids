import "server-only";

/**
 * Platform fee — ON TOP of the item price (the client pays price + fee; the
 * creator receives the full price). The rate is CONFIG-DRIVEN, never hardcoded:
 * GRID takes 2–5%, lowered by the payer's subscription tier. Exact rates are TBD
 * — stored in `app_config` under `platform_fee_bps` = { default, byTier } and
 * resolved here. All amounts are MINOR units (cents). Server-side only.
 */
import { getConfigValue } from "../config-store";

export type AmountBreakdown = { price: number; platformFee: number; amountTotal: number; creatorAmount: number };

// Placeholder defaults (basis points) until the owner sets the final rates via
// app_config. Within the agreed 2–5% band; lower for higher tiers.
const DEFAULT_FEE_BPS = 350; // 3.5%
const DEFAULT_BY_TIER: Record<string, number> = {
  free: 500, silver: 400, diamond: 300, platinum: 200, agency: 300, enterprise: 200,
};
const MAX_BPS = 500; // hard 5% guardrail

/** Resolve the fee (basis points) for a payer tier from config, clamped to ≤5%. */
export async function platformFeeBps(tier?: string | null): Promise<number> {
  const cfg = await getConfigValue<{ default?: number; byTier?: Record<string, number> }>("platform_fee_bps", {});
  const byTier = { ...DEFAULT_BY_TIER, ...(cfg.byTier ?? {}) };
  const raw = (tier && byTier[tier] != null ? byTier[tier] : cfg.default ?? DEFAULT_FEE_BPS) as number;
  return Math.min(MAX_BPS, Math.max(0, Math.round(raw)));
}

/** price (minor units) → fee-on-top breakdown. creatorAmount = price; client pays price + fee. */
export async function computeAmounts(priceMinor: number, tier?: string | null): Promise<AmountBreakdown> {
  const price = Math.max(0, Math.round(Number(priceMinor) || 0));
  const bps = await platformFeeBps(tier);
  const platformFee = Math.round((price * bps) / 10000);
  return { price, platformFee, amountTotal: price + platformFee, creatorAmount: price };
}
