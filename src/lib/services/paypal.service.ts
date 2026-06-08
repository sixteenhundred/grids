import "server-only";

/**
 * PayPal service — client checkout via the REST API (no SDK; plain fetch).
 *
 * SCOPE: client → GRID payments are fully real (Orders v2: create + capture +
 * refund + webhook verification). Creator PAYOUTS via PayPal are intentionally
 * NOT wired here — the connection UI shows "coming soon / manual verification"
 * and the records layer is provider-agnostic, so payouts can be added later
 * without schema changes. We never claim a PayPal payout happened when it didn't.
 *
 * SECURITY: amounts are server-computed (minor units → decimal string here);
 * the client never supplies them. Webhooks are verified against PAYPAL_WEBHOOK_ID.
 */
import { getServerEnv, isPayPalConfigured } from "@/lib/env";
import { ServiceError, ServiceUnavailableError } from "./types";

export function paypalReady(): boolean {
  return isPayPalConfigured();
}

function baseUrl(): string {
  return getServerEnv().PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/** Minor units (cents) → PayPal decimal string, e.g. 1500 → "15.00". */
function toDecimal(minor: number): string {
  return (Math.max(0, Math.round(minor)) / 100).toFixed(2);
}

let _token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (!isPayPalConfigured()) throw new ServiceUnavailableError("paypal");
  // Cheap monotonic-free cache: reuse until ~60s before expiry (Date.now is fine
  // server-side here; the workflow-script restriction does not apply to app code).
  if (_token && _token.expiresAt - 60_000 > Date.now()) return _token.value;
  const env = getServerEnv();
  const basic = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new ServiceError("provider_error", `PayPal auth failed (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  _token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return _token.value;
}

async function api<T>(path: string, init: RequestInit & { idempotencyKey?: string }): Promise<T> {
  const token = await accessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.idempotencyKey) headers["PayPal-Request-Id"] = init.idempotencyKey;
  const res = await fetch(`${baseUrl()}${path}`, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ServiceError("provider_error", `PayPal ${path} failed (${res.status}): ${json?.message ?? "error"}`);
  }
  return json as T;
}

type PayPalOrder = { id: string; status: string; links?: Array<{ rel: string; href: string }> };

/** Create an Orders-v2 CAPTURE order for the full amount; returns id + approve URL. */
export async function createOrder(params: {
  paymentId: string;
  amountTotal: number;
  currency: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const order = await api<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    idempotencyKey: `order_${params.paymentId}`,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: params.paymentId,
          description: params.description?.slice(0, 127),
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: toDecimal(params.amountTotal),
          },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
  });
  const approve = order.links?.find((l) => l.rel === "approve")?.href;
  if (!approve) throw new ServiceError("provider_error", "PayPal did not return an approve URL");
  return { orderId: order.id, approveUrl: approve };
}

type CaptureResult = {
  id: string;
  status: string;
  purchase_units?: Array<{ payments?: { captures?: Array<{ id: string; status: string }> } }>;
};

/** Capture an approved order. Returns the order status + capture id. */
export async function captureOrder(orderId: string): Promise<{ status: string; captureId: string | null }> {
  const result = await api<CaptureResult>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    idempotencyKey: `capture_${orderId}`,
    body: "{}",
  });
  const captureId = result.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
  return { status: result.status, captureId };
}

/** Refund a capture (full when amount omitted). */
export async function refundCapture(params: {
  captureId: string;
  amount?: number;
  currency?: string;
}): Promise<{ refundId: string; status: string }> {
  const body =
    params.amount != null && params.currency
      ? JSON.stringify({ amount: { value: toDecimal(params.amount), currency_code: params.currency.toUpperCase() } })
      : "{}";
  const result = await api<{ id: string; status: string }>(`/v2/payments/captures/${params.captureId}/refund`, {
    method: "POST",
    body,
  });
  return { refundId: result.id, status: result.status };
}

/** Verify a webhook came from PayPal (uses PAYPAL_WEBHOOK_ID). */
export async function verifyWebhook(params: {
  headers: Headers;
  rawBody: string;
}): Promise<boolean> {
  const env = getServerEnv();
  if (!env.PAYPAL_WEBHOOK_ID) return false;
  const h = params.headers;
  const result = await api<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: h.get("paypal-auth-algo"),
      cert_url: h.get("paypal-cert-url"),
      transmission_id: h.get("paypal-transmission-id"),
      transmission_sig: h.get("paypal-transmission-sig"),
      transmission_time: h.get("paypal-transmission-time"),
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(params.rawBody),
    }),
  });
  return result.verification_status === "SUCCESS";
}
