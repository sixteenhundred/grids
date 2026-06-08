import "server-only";

/**
 * Stripe service — payments, Connect (Express), and escrow (separate charges &
 * transfers). The `stripe` SDK is loaded lazily via a cached dynamic import so
 * any bundle that never calls a method stays Stripe-free, and so the service
 * reports "unavailable" (never crashes) when STRIPE_SECRET_KEY is unset.
 *
 * ── ESCROW MODEL (hold & release) ──────────────────────────────────────────
 *   1. Client checks out → we charge the FULL amount (price + platform fee) to
 *      the GRID platform account. Funds are HELD on GRID's balance. We do NOT
 *      use destination charges / transfer_data, so nothing reaches the creator
 *      yet. The PaymentIntent carries `transfer_group = <gridPaymentId>`.
 *   2. Client approves the work → `transferToCreator()` moves exactly the
 *      creator amount (price, fee retained by GRID) to the creator's connected
 *      account via a Transfer with `source_transaction = <charge>`.
 *   3. Refund / dispute → handled against the original PaymentIntent.
 *
 * ── SECURITY (non-negotiable) ──────────────────────────────────────────────
 *   • Amounts, fees, currency and escrow state are computed server-side by the
 *     caller (see @/lib/payments/fee) — never trusted from the client.
 *   • Only NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is client-safe; secret + webhook
 *     secret are server-only.
 *   • Webhooks are signature-verified in the route (see @/lib/security/webhook).
 */
import type Stripe from "stripe";
import { getServerEnv, isStripeConfigured } from "@/lib/env";
import { ServiceError, ServiceUnavailableError } from "./types";

let _stripe: Stripe | null = null;

export function stripeReady(): boolean {
  return isStripeConfigured();
}

/** Lazily-constructed, cached Stripe client. Throws ServiceUnavailableError when unconfigured. */
export async function getStripe(): Promise<Stripe> {
  if (!isStripeConfigured()) throw new ServiceUnavailableError("stripe");
  if (_stripe) return _stripe;
  const { default: StripeCtor } = await import("stripe");
  _stripe = new StripeCtor(getServerEnv().STRIPE_SECRET_KEY!, {
    appInfo: { name: "GRID", url: getServerEnv().NEXT_PUBLIC_APP_URL || undefined },
  });
  return _stripe;
}

/* ─────────────────────────── Connect (Express) ─────────────────────────── */

/** Create an Express connected account for a creator. Returns the acct_… id. */
export async function createConnectAccount(params: {
  userId: string;
  email?: string | null;
  country?: string | null;
}): Promise<{ accountId: string }> {
  const stripe = await getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: params.email ?? undefined,
    country: params.country || undefined,
    capabilities: { transfers: { requested: true } },
    metadata: { gridUserId: params.userId },
  });
  return { accountId: account.id };
}

/** Hosted onboarding link for a connected account. URL is single-use + short-lived. */
export async function createAccountLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = await getStripe();
  const link = await stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: "account_onboarding",
  });
  return { url: link.url };
}

/** A login link to the Express dashboard (post-onboarding). */
export async function createLoginLink(accountId: string): Promise<{ url: string }> {
  const stripe = await getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return { url: link.url };
}

export type ConnectStatus = {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  disabledReason: string | null;
  currentlyDue: string[];
};

/** Safe, GRID-relevant view of a connected account — never the creator's balance. */
export async function getAccountStatus(accountId: string): Promise<ConnectStatus> {
  const stripe = await getStripe();
  const a = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: !!a.charges_enabled,
    payoutsEnabled: !!a.payouts_enabled,
    detailsSubmitted: !!a.details_submitted,
    disabledReason: a.requirements?.disabled_reason ?? null,
    currentlyDue: a.requirements?.currently_due ?? [],
  };
}

/* ──────────────────────────── Checkout (hold) ──────────────────────────── */

/**
 * Hosted Checkout for the FULL amount (price + platform fee) charged to the GRID
 * platform account — escrow hold. `amountTotal` is server-computed minor units.
 */
export async function createCheckoutSession(params: {
  paymentId: string;
  amountTotal: number;
  currency: string;
  productName: string;
  clientEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
  itemType: string;
  itemId?: string | null;
  creatorId?: string | null;
}): Promise<{ url: string; checkoutId: string }> {
  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.currency,
          unit_amount: params.amountTotal,
          product_data: { name: params.productName },
        },
      },
    ],
    customer_email: params.clientEmail ?? undefined,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.paymentId,
    metadata: { gridPaymentId: params.paymentId },
    payment_intent_data: {
      transfer_group: params.paymentId,
      metadata: {
        gridPaymentId: params.paymentId,
        itemType: params.itemType,
        itemId: params.itemId ?? "",
        creatorId: params.creatorId ?? "",
      },
    },
  });
  if (!session.url) throw new ServiceError("provider_error", "Stripe did not return a checkout URL");
  return { url: session.url, checkoutId: session.id };
}

/** The charge id behind a PaymentIntent — used as `source_transaction` on release. */
export async function getChargeIdForIntent(paymentIntentId: string): Promise<string | null> {
  const stripe = await getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const latest = pi.latest_charge;
  return typeof latest === "string" ? latest : (latest?.id ?? null);
}

/* ─────────────────────────── Release / refund ──────────────────────────── */

/** Escrow release: transfer the creator amount to their connected account. */
export async function transferToCreator(params: {
  amount: number;
  currency: string;
  destinationAccountId: string;
  transferGroup: string;
  sourceTransaction?: string | null;
}): Promise<{ transferId: string }> {
  const stripe = await getStripe();
  const transfer = await stripe.transfers.create({
    amount: params.amount,
    currency: params.currency,
    destination: params.destinationAccountId,
    transfer_group: params.transferGroup,
    source_transaction: params.sourceTransaction ?? undefined,
  });
  return { transferId: transfer.id };
}

/** Full or partial refund against the original PaymentIntent. */
export async function refundPaymentIntent(params: {
  paymentIntentId: string;
  amount?: number;
}): Promise<{ refundId: string }> {
  const stripe = await getStripe();
  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amount,
  });
  return { refundId: refund.id };
}
