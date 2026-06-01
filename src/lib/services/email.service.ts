/**
 * Email service — SCAFFOLD (Resend). Single place all transactional email is sent.
 *
 * No `resend` import exists, so the build stays green without the package.
 * sendEmail() reports "unavailable" until activated.
 *
 * ── To ACTIVATE ───────────────────────────────────────────────────────────
 *   1. `npm install resend`
 *   2. Set RESEND_API_KEY and EMAIL_FROM in env.
 *   3. Uncomment the client slot and implement sendEmail().
 *   ⚠️ Keep the import COMMENTED until installed (literal dynamic import breaks the build).
 *
 * ── RULES ──────────────────────────────────────────────────────────────────
 *   • Server-only. Centralize all sends here (avoid duplicates).
 *   • Log only safe metadata (to-domain, template id, message id) — never full
 *     message bodies or recipient PII beyond what's necessary.
 */
import { isResendConfigured } from "@/lib/env";
import { fail, type ServiceResult } from "./types";

export function emailReady(): boolean {
  return isResendConfigured();
}

// async function getResend() {
//   const { Resend } = await import("resend"); // add ONLY after `npm i resend`
//   return new Resend(getServerEnv().RESEND_API_KEY!);
// }

export type SendEmailParams = {
  to: string;
  subject: string;
  /** Pre-rendered HTML or a template reference resolved server-side. */
  html: string;
  from?: string;
};

export async function sendEmail(_params: SendEmailParams): Promise<ServiceResult<{ id: string }>> {
  if (!isResendConfigured()) return fail("unavailable", "Email is not configured on this deployment.");
  // Activation: const resend = await getResend();
  //   const { data } = await resend.emails.send({ from: _params.from ?? getServerEnv().EMAIL_FROM!, ... });
  //   return ok({ id: data.id });
  return fail("unavailable", "Email sending is not implemented yet.");
}
