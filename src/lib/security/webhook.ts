/**
 * Webhook signature verification — Node 'crypto' only, no SDKs (build-safe).
 *
 * Use on `runtime = 'nodejs'` routes. Always verify against the RAW request body
 * (`await req.text()`), never the parsed JSON. Reject on mismatch before doing
 * any work, and make handlers idempotent (dedupe by event id).
 */
import crypto from "node:crypto";

/** Constant-time compare of two hex strings (length-guarded to avoid throws). */
function timingSafeEqualHex(a: string, b: string): boolean {
  let ab: Buffer;
  let bb: Buffer;
  try {
    ab = Buffer.from(a, "hex");
    bb = Buffer.from(b, "hex");
  } catch {
    return false;
  }
  if (ab.length === 0 || ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Generic HMAC-hex verification (e.g. a `X-Signature: <hex>` header). */
export function verifyGenericHmac(opts: {
  payload: string;
  signatureHeader: string | null | undefined;
  secret: string | undefined;
  algo?: "sha256" | "sha1" | "sha512";
}): boolean {
  if (!opts.signatureHeader || !opts.secret) return false;
  const expected = crypto.createHmac(opts.algo ?? "sha256", opts.secret).update(opts.payload, "utf8").digest("hex");
  return timingSafeEqualHex(expected, opts.signatureHeader.trim());
}

/**
 * Stripe-style `Stripe-Signature: t=...,v1=...` verification WITHOUT the stripe
 * SDK. Recomputes HMAC-SHA256 over `${t}.${payload}` and enforces a timestamp
 * tolerance to defeat replay.
 */
export function verifyStripeSignature(opts: {
  payload: string;
  header: string | null | undefined;
  secret: string | undefined;
  toleranceSec?: number;
}): boolean {
  if (!opts.header || !opts.secret) return false;
  const parts: Record<string, string> = {};
  for (const seg of opts.header.split(",")) {
    const idx = seg.indexOf("=");
    if (idx > 0) parts[seg.slice(0, idx).trim()] = seg.slice(idx + 1).trim();
  }
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  const ts = Number(t);
  const tolerance = opts.toleranceSec ?? 300;
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > tolerance) return false;

  const expected = crypto.createHmac("sha256", opts.secret).update(`${t}.${opts.payload}`, "utf8").digest("hex");
  return timingSafeEqualHex(expected, v1);
}
