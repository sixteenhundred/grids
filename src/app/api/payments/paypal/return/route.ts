import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { captureOrder } from "@/lib/services/paypal.service";
import { getPayment, setPaymentStatus } from "@/lib/payments/records";

/**
 * PayPal return handler — the payer is redirected here after approving the
 * order. We capture it SERVER-SIDE (Orders v2 does not auto-capture), advance
 * the GRID payment to `paid`, then redirect to the dashboard. The capture call
 * is idempotent (PayPal-Request-Id) and guarded by a status check, so a refresh
 * or a racing webhook never double-processes.  GET /api/payments/paypal/return
 */
export const runtime = "nodejs";

function dash(path: string): string {
  const base = getServerEnv().NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid");
  const orderId = url.searchParams.get("token"); // PayPal appends the order id as ?token

  if (!pid || !orderId) return NextResponse.redirect(dash("/dashboard/payments?status=error"));

  const pay = await getPayment(pid);
  // Validate the order id belongs to THIS payment before capturing.
  if (!pay || pay.provider !== "paypal" || pay.providerCheckoutId !== orderId) {
    return NextResponse.redirect(dash("/dashboard/payments?status=error"));
  }
  if (pay.status === "paid" || pay.status === "released") {
    return NextResponse.redirect(dash(`/dashboard/payments?status=success&pid=${pid}`));
  }

  try {
    const { status, captureId } = await captureOrder(orderId);
    if (status === "COMPLETED") {
      await setPaymentStatus(pid, "paid", { paidAt: new Date(), ...(captureId ? { providerPaymentId: captureId } : {}) });
      return NextResponse.redirect(dash(`/dashboard/payments?status=success&pid=${pid}`));
    }
    return NextResponse.redirect(dash(`/dashboard/payments?status=pending&pid=${pid}`));
  } catch (e) {
    console.error("[paypal-return]", e instanceof Error ? e.message : e);
    return NextResponse.redirect(dash(`/dashboard/payments?status=error&pid=${pid}`));
  }
}
