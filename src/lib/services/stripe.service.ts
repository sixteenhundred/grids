/**
 * Stripe service — SCAFFOLD (payments, Connect, escrow, subscriptions).
 *
 * The `stripe` SDK is NOT installed, so this file imports nothing from it and
 * the build stays green. Every method reports "unavailable" until activated.
 *
 * ── To ACTIVATE ───────────────────────────────────────────────────────────
 *   1. `npm install stripe`
 *   2. Set STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET for webhooks) in env.
 *   3. Uncomment the `getStripe()` slot below and implement the methods.
 *   ⚠️ Keep the dynamic import COMMENTED until the package is installed — a
 *      literal `import("stripe")` is statically resolved by the bundler and
 *      would break `tsc` / `next build` (TS2307) before the dep exists.
 *
 * ── SECURITY (non-negotiable) ──────────────────────────────────────────────
 *   • Amounts, fees, currency, escrow state, and subscription tier are ALWAYS
 *     computed and verified server-side here — never trusted from the client.
 *   • Webhooks must be signature-verified (see @/lib/security/webhook).
 *   • Only NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is client-safe; the secret and
 *     webhook secret are server-only.
 */
import { isStripeConfigured } from "@/lib/env";
import { ServiceUnavailableError } from "./types";

export function stripeReady(): boolean {
  return isStripeConfigured();
}

// async function getStripe() {
//   if (!isStripeConfigured()) throw new ServiceUnavailableError("stripe");
//   const { default: Stripe } = await import("stripe"); // add ONLY after `npm i stripe`
//   return new Stripe(getServerEnv().STRIPE_SECRET_KEY!);
// }

export type CreateCheckoutParams = {
  /** Server-resolved price id — never a client-supplied amount. */
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

/** Returns the hosted Checkout URL. Verify the buyer + resolve price server-side before calling. */
export async function createCheckoutSession(_params: CreateCheckoutParams): Promise<{ url: string }> {
  throw new ServiceUnavailableError("stripe");
}
