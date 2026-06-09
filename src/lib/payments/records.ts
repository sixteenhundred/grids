import "server-only";

/**
 * Payment record layer — the single place GRID's own transaction rows are
 * created/updated. Idempotent: payments are keyed by provider checkout/order id
 * (unique), and webhook events dedupe via (provider, provider_event_id). Never
 * stores card/bank/login data — only GRID transaction activity.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { payment, payout, paymentEvent } from "../db/schema";

export type PaymentStatus =
  | "created" | "pending" | "paid" | "released" | "failed" | "canceled" | "expired" | "refunded" | "disputed";

const newId = (prefix: string): string => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export async function createPaymentRecord(input: {
  itemType: string; itemId?: string | null; clientId: string; creatorId?: string | null;
  provider: "stripe" | "paypal"; providerCheckoutId?: string | null;
  amountTotal: number; platformFee: number; creatorAmount: number; currency: string;
}): Promise<string> {
  const id = newId("pay");
  await db.insert(payment).values({
    id,
    itemType: input.itemType,
    itemId: input.itemId ?? null,
    clientId: input.clientId,
    creatorId: input.creatorId ?? null,
    provider: input.provider,
    providerCheckoutId: input.providerCheckoutId ?? null,
    amountTotal: input.amountTotal,
    platformFee: input.platformFee,
    creatorAmount: input.creatorAmount,
    currency: input.currency,
    status: "created",
  });
  return id;
}

export async function setPaymentStatus(
  id: string,
  status: PaymentStatus,
  patch: Partial<{ providerPaymentId: string; providerCheckoutId: string; paidAt: Date; releasedAt: Date; refundedAt: Date; disputedAt: Date }> = {},
): Promise<void> {
  await db.update(payment).set({ status, updatedAt: new Date(), ...patch }).where(eq(payment.id, id));
}

/**
 * Atomic compare-and-swap on payment status: flip `from → to` only if the row is
 * STILL in a `from` state, in a single UPDATE. Returns true only for the caller
 * that won the transition. This is what makes release/refund concurrency-safe —
 * two clicks (or release racing refund) can't both move the money.
 */
export async function claimPaymentTransition(
  id: string,
  from: PaymentStatus[],
  to: PaymentStatus,
  patch: Partial<{ providerPaymentId: string; paidAt: Date; releasedAt: Date; refundedAt: Date; disputedAt: Date }> = {},
): Promise<boolean> {
  const rows = await db
    .update(payment)
    .set({ status: to, updatedAt: new Date(), ...patch })
    .where(and(eq(payment.id, id), inArray(payment.status, from)))
    .returning({ id: payment.id });
  return rows.length > 0;
}

export const getPayment = (id: string) =>
  db.select().from(payment).where(eq(payment.id, id)).limit(1).then((r) => r[0]);

export const findPaymentByCheckout = (provider: string, checkoutId: string) =>
  db.select().from(payment).where(and(eq(payment.provider, provider), eq(payment.providerCheckoutId, checkoutId))).limit(1).then((r) => r[0]);

export const findPaymentByProviderPaymentId = (provider: string, providerPaymentId: string) =>
  db.select().from(payment).where(and(eq(payment.provider, provider), eq(payment.providerPaymentId, providerPaymentId))).limit(1).then((r) => r[0]);

/** Webhook idempotency: returns false if this event id was already recorded. */
export async function recordEventOnce(
  provider: string, eventType: string, providerEventId: string, relatedPaymentId: string | null, payloadSafe: unknown,
): Promise<boolean> {
  try {
    await db.insert(paymentEvent).values({
      id: newId("pe"), provider, eventType, providerEventId, relatedPaymentId,
      rawPayloadSafe: (payloadSafe ?? null) as object | null, processedAt: new Date(),
    });
    return true;
  } catch {
    return false; // unique(provider, provider_event_id) → already processed
  }
}

export async function createPayoutRecord(input: {
  paymentId: string; creatorId: string; provider: string; providerPayoutId?: string | null;
  amount: number; currency: string; status?: "scheduled" | "paid" | "failed";
}): Promise<string> {
  const id = newId("po");
  const status = input.status ?? "paid";
  await db.insert(payout).values({
    id, paymentId: input.paymentId, creatorId: input.creatorId, provider: input.provider,
    providerPayoutId: input.providerPayoutId ?? null, amount: input.amount, currency: input.currency,
    status, paidAt: status === "paid" ? new Date() : null,
  });
  return id;
}
