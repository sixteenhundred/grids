import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getServerEnv } from "@/lib/env";
import { verifyStripeSignature } from "@/lib/security/webhook";
import { db } from "@/lib/db";
import { paymentAccount } from "@/lib/db/schema";
import {
  recordEventOnce,
  getPayment,
  setPaymentStatus,
  findPaymentByProviderPaymentId,
} from "@/lib/payments/records";

/**
 * Stripe webhook. Verifies the `Stripe-Signature` over the RAW body (no SDK),
 * dedupes by event id (payment_event), then advances the matching GRID payment.
 * Only a SAFE subset of each event is persisted — never card/customer details.
 *
 * Events: checkout.session.completed · payment_intent.succeeded ·
 * payment_intent.payment_failed · charge.refunded · charge.dispute.created ·
 * account.updated.  URL: POST /api/webhooks/stripe
 */
export const runtime = "nodejs";
export const maxDuration = 30;

type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

function asString(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "id" in v && typeof (v as { id: unknown }).id === "string") {
    return (v as { id: string }).id;
  }
  return null;
}

/** Reconcile what Stripe actually charged against our stored record before crediting. */
function amountsMatch(amount: unknown, currency: unknown, expectedMinor: number, expectedCurrency: string): boolean {
  return (
    typeof amount === "number" &&
    amount === expectedMinor &&
    typeof currency === "string" &&
    currency.toLowerCase() === expectedCurrency.toLowerCase()
  );
}

export async function POST(req: Request) {
  const secret = getServerEnv().STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!secret || !verifyStripeSignature({ payload: raw, header: sig, secret })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const obj = event.data?.object ?? {};

  // Resolve the related GRID payment id where the event carries it.
  const metadata = (obj.metadata as Record<string, string> | undefined) ?? undefined;
  const relatedPaymentId =
    metadata?.gridPaymentId ?? (typeof obj.client_reference_id === "string" ? obj.client_reference_id : null) ?? null;

  // Idempotency: first writer wins; a replay short-circuits to 200.
  const fresh = await recordEventOnce("stripe", event.type, event.id, relatedPaymentId, { id: event.id, type: event.type });
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const paymentId = relatedPaymentId;
        const intentId = asString(obj.payment_intent);
        if (paymentId) {
          const pay = await getPayment(paymentId);
          if (pay && pay.status !== "paid" && pay.status !== "released") {
            if (!amountsMatch(obj.amount_total, obj.currency, pay.amountTotal, pay.currency)) {
              console.error("[stripe-webhook] amount/currency mismatch on", paymentId, "— not crediting");
              break;
            }
            await setPaymentStatus(paymentId, "paid", {
              paidAt: new Date(),
              ...(intentId ? { providerPaymentId: intentId } : {}),
            });
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        // Backstop if checkout.session.completed was missed.
        const paymentId = metadata?.gridPaymentId ?? null;
        const intentId = asString(obj.id);
        if (paymentId) {
          const pay = await getPayment(paymentId);
          if (pay && pay.status !== "paid" && pay.status !== "released") {
            const received = (obj.amount_received ?? obj.amount) as unknown;
            if (!amountsMatch(received, obj.currency, pay.amountTotal, pay.currency)) {
              console.error("[stripe-webhook] PI amount/currency mismatch on", paymentId, "— not crediting");
              break;
            }
            await setPaymentStatus(paymentId, "paid", {
              paidAt: new Date(),
              ...(intentId ? { providerPaymentId: intentId } : {}),
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentId = metadata?.gridPaymentId ?? null;
        if (paymentId) {
          const pay = await getPayment(paymentId);
          if (pay && ["created", "pending"].includes(pay.status)) {
            await setPaymentStatus(paymentId, "failed");
          }
        }
        break;
      }

      case "charge.refunded": {
        const intentId = asString(obj.payment_intent);
        if (intentId) {
          const pay = await findPaymentByProviderPaymentId("stripe", intentId);
          if (pay && pay.status !== "refunded") await setPaymentStatus(pay.id, "refunded", { refundedAt: new Date() });
        }
        break;
      }

      case "charge.dispute.created": {
        const intentId = asString(obj.payment_intent);
        if (intentId) {
          const pay = await findPaymentByProviderPaymentId("stripe", intentId);
          if (pay && pay.status !== "disputed") await setPaymentStatus(pay.id, "disputed", { disputedAt: new Date() });
        }
        break;
      }

      case "account.updated": {
        const accountId = asString(obj.id);
        const gridUserId = (obj.metadata as Record<string, string> | undefined)?.gridUserId;
        if (accountId) {
          const chargesEnabled = !!obj.charges_enabled;
          const payoutsEnabled = !!obj.payouts_enabled;
          const detailsSubmitted = !!obj.details_submitted;
          const requirements = (obj.requirements as { disabled_reason?: string | null; currently_due?: string[] } | undefined) ?? {};
          const status = requirements.disabled_reason
            ? "disabled"
            : chargesEnabled && payoutsEnabled
              ? "connected"
              : (requirements.currently_due?.length ?? 0) > 0
                ? "action_required"
                : "pending";
          await db
            .update(paymentAccount)
            .set({
              status,
              chargesEnabled,
              payoutsEnabled,
              onboardingComplete: detailsSubmitted,
              metadataSafe: { currentlyDue: requirements.currently_due ?? [], disabledReason: requirements.disabled_reason ?? null },
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(paymentAccount.provider, "stripe"),
                eq(paymentAccount.providerAccountId, accountId),
                // Bind the payouts-enabled flip to the owner Stripe stamped on the
                // account at creation — never enable payouts on a mismatched row.
                ...(gridUserId ? [eq(paymentAccount.userId, gridUserId)] : []),
              ),
            );
        }
        break;
      }

      default:
        break; // unhandled events are still recorded above (audit trail)
    }
  } catch (e) {
    // Log + 500 so Stripe retries; the event row stays for the audit trail.
    console.error("[stripe-webhook]", event.type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
