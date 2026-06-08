import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/services/paypal.service";
import {
  recordEventOnce,
  getPayment,
  setPaymentStatus,
  findPaymentByProviderPaymentId,
} from "@/lib/payments/records";

/**
 * PayPal webhook — verifies authenticity against PAYPAL_WEBHOOK_ID, dedupes by
 * event id (payment_event), then advances the matching GRID payment. Backstops
 * the synchronous return-capture and handles async refund/dispute/denial.
 *
 * Events: PAYMENT.CAPTURE.COMPLETED · PAYMENT.CAPTURE.DENIED ·
 * PAYMENT.CAPTURE.REFUNDED · CUSTOMER.DISPUTE.CREATED.  POST /api/webhooks/paypal
 */
export const runtime = "nodejs";
export const maxDuration = 30;

type PayPalEvent = {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    custom_id?: string;
    disputed_transactions?: Array<{ seller_transaction_id?: string }>;
  };
};

export async function POST(req: Request) {
  const raw = await req.text();

  const valid = await verifyWebhook({ headers: req.headers, rawBody: raw }).catch(() => false);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: PayPalEvent;
  try {
    event = JSON.parse(raw) as PayPalEvent;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const resource = event.resource ?? {};
  const paymentId = resource.custom_id ?? null;

  const fresh = await recordEventOnce("paypal", event.event_type, event.id, paymentId, {
    id: event.id,
    type: event.event_type,
  });
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        if (paymentId) {
          const pay = await getPayment(paymentId);
          if (pay && pay.status !== "paid" && pay.status !== "released") {
            await setPaymentStatus(paymentId, "paid", {
              paidAt: new Date(),
              ...(resource.id ? { providerPaymentId: resource.id } : {}),
            });
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED": {
        if (paymentId) {
          const pay = await getPayment(paymentId);
          if (pay && ["created", "pending"].includes(pay.status)) await setPaymentStatus(paymentId, "failed");
        }
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED": {
        // Refund resource carries the original capture id in custom_id flows or
        // via the captured payment; try custom_id first, then capture id.
        let pay = paymentId ? await getPayment(paymentId) : undefined;
        if (!pay && resource.id) pay = await findPaymentByProviderPaymentId("paypal", resource.id);
        if (pay && pay.status !== "refunded") await setPaymentStatus(pay.id, "refunded", { refundedAt: new Date() });
        break;
      }

      case "CUSTOMER.DISPUTE.CREATED": {
        const captureId = resource.disputed_transactions?.[0]?.seller_transaction_id ?? null;
        const pay = captureId ? await findPaymentByProviderPaymentId("paypal", captureId) : undefined;
        if (pay && pay.status !== "disputed") await setPaymentStatus(pay.id, "disputed", { disputedAt: new Date() });
        break;
      }

      default:
        break; // recorded above for the audit trail
    }
  } catch (e) {
    console.error("[paypal-webhook]", event.event_type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
