"use server";

/**
 * Payment server actions — the client/creator/admin entry points for GRID
 * payments. Every amount is resolved server-side from the item record; the
 * client is never trusted with a price, fee, or payout figure.
 *
 *  Client:  getPaymentBreakdown · startCheckout · releasePayment · refundPayment
 *           · listClientPayments
 *  Creator: getPaymentConnections · connectStripe · refreshStripeConnection
 *           · disconnectStripe · registerPayPalPayoutInterest · listCreatorEarnings
 *  Admin:   getAdminPaymentsOverview
 *
 * GRID only ever shows its own transaction activity — never the creator's real
 * Stripe/PayPal balance.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { requireUser as requireAuth } from "./security/auth-guard";
import { isAdminEmail } from "./admin";
import { getEntitlement } from "./entitlements";
import { ensureUserRow } from "./demo-user";
import { enforceRateLimit, type RateScope } from "./security/rate-guard";
import { getServerEnv } from "./env";
import { db } from "./db";
import { paymentAccount, payment, payout } from "./db/schema";
import { computeAmounts } from "./payments/fee";
import { resolvePayableItem } from "./payments/items";
import {
  createPaymentRecord,
  setPaymentStatus,
  getPayment,
  createPayoutRecord,
} from "./payments/records";
import {
  stripeReady,
  createConnectAccount,
  createAccountLink,
  getAccountStatus,
  createCheckoutSession,
  getChargeIdForIntent,
  transferToCreator,
  refundPaymentIntent,
} from "./services/stripe.service";
import { paypalReady, createOrder, refundCapture } from "./services/paypal.service";

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function appUrl(): string {
  return getServerEnv().NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function requireUser(scope: RateScope = "write") {
  const u = await requireAuth();
  await ensureUserRow(u);
  await enforceRateLimit(scope, u.id);
  return u;
}

/* ───────────────────────────── Client: pay ─────────────────────────────── */

export type PriceBreakdown = {
  name: string;
  price: number; // creator's price (minor units)
  platformFee: number; // GRID fee, on top
  amountTotal: number; // what the client pays
  currency: string;
};

/** Read-only price breakdown for the checkout UI. Never used to charge — the
 *  charge re-resolves server-side in startCheckout. */
export async function getPaymentBreakdown(itemType: string, itemId: string): Promise<PriceBreakdown | null> {
  const u = await requireUser("read");
  const item = await resolvePayableItem(itemType, itemId);
  if (!item) return null;
  const ent = await getEntitlement(u.id);
  const a = await computeAmounts(item.priceMinor, ent.plan);
  return { name: item.name, price: a.price, platformFee: a.platformFee, amountTotal: a.amountTotal, currency: item.currency };
}

/** Start a real checkout (Stripe hosted checkout or PayPal approval). Returns a
 *  redirect URL. Amount + fee are computed here from the item record. */
export async function startCheckout(input: {
  itemType: string;
  itemId: string;
  provider: "stripe" | "paypal";
}): Promise<{ url: string }> {
  const u = await requireUser("purchase");
  const item = await resolvePayableItem(input.itemType, input.itemId);
  if (!item) throw new Error("This item is not available for purchase.");
  if (item.creatorId && item.creatorId === u.id) throw new Error("You can't purchase your own item.");

  const ent = await getEntitlement(u.id);
  const amounts = await computeAmounts(item.priceMinor, ent.plan);
  if (amounts.amountTotal <= 0) throw new Error("This item has no payable price.");

  const paymentId = await createPaymentRecord({
    itemType: item.itemType,
    itemId: item.itemId,
    clientId: u.id,
    creatorId: item.creatorId,
    provider: input.provider,
    amountTotal: amounts.amountTotal,
    platformFee: amounts.platformFee,
    creatorAmount: amounts.creatorAmount,
    currency: item.currency,
  });

  const successUrl = `${appUrl()}/dashboard/payments?status=success&pid=${paymentId}`;
  const cancelUrl = `${appUrl()}/dashboard/payments?status=cancel&pid=${paymentId}`;

  if (input.provider === "stripe") {
    if (!stripeReady()) throw new Error("Card payments are unavailable right now.");
    const { url, checkoutId } = await createCheckoutSession({
      paymentId,
      amountTotal: amounts.amountTotal,
      currency: item.currency,
      productName: item.name,
      clientEmail: u.email,
      successUrl,
      cancelUrl,
      itemType: item.itemType,
      itemId: item.itemId,
      creatorId: item.creatorId,
    });
    await setPaymentStatus(paymentId, "pending", { providerCheckoutId: checkoutId });
    return { url };
  }

  if (!paypalReady()) throw new Error("PayPal is unavailable right now.");
  const { orderId, approveUrl } = await createOrder({
    paymentId,
    amountTotal: amounts.amountTotal,
    currency: item.currency,
    description: item.name,
    // PayPal appends ?token=<orderId>&PayerID=…; our return route captures it.
    returnUrl: `${appUrl()}/api/payments/paypal/return?pid=${paymentId}`,
    cancelUrl,
  });
  await setPaymentStatus(paymentId, "pending", { providerCheckoutId: orderId });
  return { url: approveUrl };
}

/** Escrow release — the CLIENT who paid approves the work; GRID transfers the
 *  creator's amount to their connected account. */
export async function releasePayment(paymentId: string): Promise<void> {
  const u = await requireUser("write");
  const pay = await getPayment(paymentId);
  if (!pay) throw new Error("Payment not found.");
  if (pay.clientId !== u.id) throw new Error("Only the client who paid can release this payment.");
  if (pay.status !== "paid") throw new Error("This payment isn't ready to release.");
  if (!pay.creatorId) throw new Error("There is no creator to pay.");
  if (pay.provider !== "stripe") throw new Error("Only Stripe payments can be released right now.");

  const acct = await db
    .select()
    .from(paymentAccount)
    .where(and(eq(paymentAccount.userId, pay.creatorId), eq(paymentAccount.provider, "stripe")))
    .limit(1)
    .then((r) => r[0]);
  if (!acct?.providerAccountId || !acct.payoutsEnabled) {
    throw new Error("The creator hasn't finished setting up payouts yet.");
  }

  const source = pay.providerPaymentId ? await getChargeIdForIntent(pay.providerPaymentId) : null;
  const { transferId } = await transferToCreator({
    amount: pay.creatorAmount,
    currency: pay.currency,
    destinationAccountId: acct.providerAccountId,
    transferGroup: pay.id,
    sourceTransaction: source,
  });
  await setPaymentStatus(pay.id, "released", { releasedAt: new Date() });
  await createPayoutRecord({
    paymentId: pay.id,
    creatorId: pay.creatorId,
    provider: "stripe",
    providerPayoutId: transferId,
    amount: pay.creatorAmount,
    currency: pay.currency,
    status: "paid",
  });
}

/** Refund a held (or disputed) payment. Allowed for the paying client or an admin. */
export async function refundPayment(paymentId: string): Promise<void> {
  const u = await requireUser("write");
  const pay = await getPayment(paymentId);
  if (!pay) throw new Error("Payment not found.");
  if (pay.clientId !== u.id && !isAdminEmail(u.email)) throw new Error("You can't refund this payment.");
  if (!["paid", "disputed"].includes(pay.status)) throw new Error("This payment can't be refunded.");
  if (!pay.providerPaymentId) throw new Error("Missing provider payment reference.");

  if (pay.provider === "stripe") {
    await refundPaymentIntent({ paymentIntentId: pay.providerPaymentId });
  } else {
    await refundCapture({ captureId: pay.providerPaymentId, amount: pay.amountTotal, currency: pay.currency });
  }
  await setPaymentStatus(pay.id, "refunded", { refundedAt: new Date() });
}

export type ClientPaymentView = {
  id: string;
  itemType: string;
  name: string | null;
  amountTotal: number;
  platformFee: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: number;
};

/** GRID payment history for the signed-in client. */
export async function listClientPayments(): Promise<ClientPaymentView[]> {
  const u = await requireUser("read");
  const rows = await db.select().from(payment).where(eq(payment.clientId, u.id)).orderBy(desc(payment.createdAt));
  return rows.map((r) => ({
    id: r.id,
    itemType: r.itemType,
    name: r.itemId,
    amountTotal: r.amountTotal,
    platformFee: r.platformFee,
    currency: r.currency,
    status: r.status,
    provider: r.provider,
    createdAt: r.createdAt.getTime(),
  }));
}

/* ─────────────────────── Creator: connect & earnings ───────────────────── */

export type ConnectionView = {
  provider: "stripe" | "paypal";
  status: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
};

async function stripeRow(userId: string) {
  return db
    .select()
    .from(paymentAccount)
    .where(and(eq(paymentAccount.userId, userId), eq(paymentAccount.provider, "stripe")))
    .limit(1)
    .then((r) => r[0]);
}

/** Connection status for both providers (safe metadata only — never balances). */
export async function getPaymentConnections(): Promise<ConnectionView[]> {
  const u = await requireUser("read");
  const rows = await db.select().from(paymentAccount).where(eq(paymentAccount.userId, u.id));
  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  const view = (p: "stripe" | "paypal"): ConnectionView => {
    const r = byProvider.get(p);
    return {
      provider: p,
      status: r?.status ?? "not_connected",
      chargesEnabled: !!r?.chargesEnabled,
      payoutsEnabled: !!r?.payoutsEnabled,
      onboardingComplete: !!r?.onboardingComplete,
    };
  };
  return [view("stripe"), view("paypal")];
}

/** Begin (or resume) Stripe Connect onboarding. Returns the hosted onboarding URL. */
export async function connectStripe(): Promise<{ url: string }> {
  const u = await requireUser("write");
  if (!stripeReady()) throw new Error("Stripe is unavailable right now.");

  const existing = await stripeRow(u.id);
  let accountId = existing?.providerAccountId ?? null;
  if (!accountId) {
    const created = await createConnectAccount({ userId: u.id, email: u.email });
    accountId = created.accountId;
    if (existing) {
      await db
        .update(paymentAccount)
        .set({ providerAccountId: accountId, status: "pending", updatedAt: new Date() })
        .where(eq(paymentAccount.id, existing.id));
    } else {
      await db.insert(paymentAccount).values({
        id: genId("pacct"),
        userId: u.id,
        provider: "stripe",
        providerAccountId: accountId,
        status: "pending",
      });
    }
  }

  const link = await createAccountLink({
    accountId,
    refreshUrl: `${appUrl()}/dashboard/payments/connect?refresh=1`,
    returnUrl: `${appUrl()}/dashboard/payments/connect?done=1`,
  });
  return { url: link.url };
}

/** Pull the latest Connect status from Stripe and persist the safe view. */
export async function refreshStripeConnection(): Promise<ConnectionView> {
  const u = await requireUser("read");
  const row = await stripeRow(u.id);
  if (!row?.providerAccountId) {
    return { provider: "stripe", status: "not_connected", chargesEnabled: false, payoutsEnabled: false, onboardingComplete: false };
  }
  const s = await getAccountStatus(row.providerAccountId);
  const status = s.disabledReason
    ? "disabled"
    : s.chargesEnabled && s.payoutsEnabled
      ? "connected"
      : s.currentlyDue.length > 0
        ? "action_required"
        : "pending";
  await db
    .update(paymentAccount)
    .set({
      status,
      chargesEnabled: s.chargesEnabled,
      payoutsEnabled: s.payoutsEnabled,
      onboardingComplete: s.detailsSubmitted,
      metadataSafe: { currentlyDue: s.currentlyDue, disabledReason: s.disabledReason },
      updatedAt: new Date(),
    })
    .where(eq(paymentAccount.id, row.id));
  return {
    provider: "stripe",
    status,
    chargesEnabled: s.chargesEnabled,
    payoutsEnabled: s.payoutsEnabled,
    onboardingComplete: s.detailsSubmitted,
  };
}

/** Disconnect Stripe (keeps the account id so the creator can reconnect). */
export async function disconnectStripe(): Promise<void> {
  const u = await requireUser("write");
  await db
    .update(paymentAccount)
    .set({ status: "not_connected", chargesEnabled: false, payoutsEnabled: false, onboardingComplete: false, updatedAt: new Date() })
    .where(and(eq(paymentAccount.userId, u.id), eq(paymentAccount.provider, "stripe")));
}

/** PayPal creator payouts aren't live yet — record honest "pending manual
 *  verification" interest (does NOT claim a connection exists). */
export async function registerPayPalPayoutInterest(): Promise<void> {
  const u = await requireUser("write");
  const existing = await db
    .select()
    .from(paymentAccount)
    .where(and(eq(paymentAccount.userId, u.id), eq(paymentAccount.provider, "paypal")))
    .limit(1)
    .then((r) => r[0]);
  if (existing) {
    await db
      .update(paymentAccount)
      .set({ status: "pending", metadataSafe: { note: "manual_verification_pending" }, updatedAt: new Date() })
      .where(eq(paymentAccount.id, existing.id));
  } else {
    await db.insert(paymentAccount).values({
      id: genId("pacct"),
      userId: u.id,
      provider: "paypal",
      status: "pending",
      metadataSafe: { note: "manual_verification_pending" },
    });
  }
}

export type CreatorEarningsView = {
  payments: Array<{ id: string; itemType: string; creatorAmount: number; currency: string; status: string; createdAt: number }>;
  releasedTotal: number; // minor units actually paid out
  heldTotal: number; // minor units held in escrow (paid, not yet released)
  currency: string;
};

/** GRID earnings + escrow status for the signed-in creator (NOT a wallet balance). */
export async function listCreatorEarnings(): Promise<CreatorEarningsView> {
  const u = await requireUser("read");
  const rows = await db.select().from(payment).where(eq(payment.creatorId, u.id)).orderBy(desc(payment.createdAt));
  let releasedTotal = 0;
  let heldTotal = 0;
  for (const r of rows) {
    if (r.status === "released") releasedTotal += r.creatorAmount;
    else if (r.status === "paid") heldTotal += r.creatorAmount;
  }
  return {
    payments: rows.map((r) => ({
      id: r.id,
      itemType: r.itemType,
      creatorAmount: r.creatorAmount,
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt.getTime(),
    })),
    releasedTotal,
    heldTotal,
    currency: rows[0]?.currency ?? "eur",
  };
}

/* ──────────────────────────────── Admin ────────────────────────────────── */

export type AdminPaymentsOverview = {
  totals: { count: number; grossMinor: number; feeMinor: number; payoutMinor: number };
  byStatus: Record<string, number>;
  recent: Array<{ id: string; itemType: string; status: string; amountTotal: number; platformFee: number; currency: string; provider: string; createdAt: number }>;
};

export async function getAdminPaymentsOverview(): Promise<AdminPaymentsOverview> {
  const u = await requireAuth();
  if (!isAdminEmail(u.email)) throw new Error("Admin access required.");

  const [agg] = await db
    .select({
      count: sql<number>`count(*)`,
      gross: sql<number>`coalesce(sum(${payment.amountTotal}), 0)`,
      fee: sql<number>`coalesce(sum(${payment.platformFee}), 0)`,
    })
    .from(payment)
    .where(sql`${payment.status} in ('paid','released','refunded','disputed')`);

  const [paid] = await db
    .select({ payoutSum: sql<number>`coalesce(sum(${payout.amount}), 0)` })
    .from(payout)
    .where(eq(payout.status, "paid"));

  const statusRows = await db
    .select({ status: payment.status, n: sql<number>`count(*)` })
    .from(payment)
    .groupBy(payment.status);

  const recent = await db.select().from(payment).orderBy(desc(payment.createdAt)).limit(50);

  return {
    totals: {
      count: Number(agg?.count ?? 0),
      grossMinor: Number(agg?.gross ?? 0),
      feeMinor: Number(agg?.fee ?? 0),
      payoutMinor: Number(paid?.payoutSum ?? 0),
    },
    byStatus: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.n)])),
    recent: recent.map((r) => ({
      id: r.id,
      itemType: r.itemType,
      status: r.status,
      amountTotal: r.amountTotal,
      platformFee: r.platformFee,
      currency: r.currency,
      provider: r.provider,
      createdAt: r.createdAt.getTime(),
    })),
  };
}
