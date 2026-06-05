/**
 * Email service (Resend). Single place all transactional email is sent.
 *
 * Safe before keys exist: if RESEND_API_KEY/EMAIL_FROM are unset, sendEmail()
 * logs and returns a no-op success so callers (e.g. waitlist) never fail — the
 * email simply isn't delivered until the keys are configured.
 *
 * RULES: server-only; centralize all sends here; log only safe metadata
 * (to-domain, subject) — never full bodies or PII.
 */
import { Resend } from "resend";
import { getServerEnv, isResendConfigured } from "@/lib/env";
import { hasConsent } from "@/lib/consent";
import { ok, fail, type ServiceResult } from "./types";

export function emailReady(): boolean {
  return isResendConfigured();
}

let client: Resend | null = null;
function getResend(): Resend {
  if (!client) client = new Resend(getServerEnv().RESEND_API_KEY);
  return client;
}

export type SendEmailParams = {
  to: string;
  subject: string;
  /** Pre-rendered HTML. */
  html: string;
  from?: string;
  /**
   * Set ONLY for marketing/promotional email: the recipient's user id. The send
   * is blocked unless that user has granted marketing consent. Transactional
   * mail (e.g. waitlist confirmation) omits this. (Objective 1 — consent gate.)
   */
  marketingConsentUserId?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<ServiceResult<{ id: string }>> {
  const toDomain = params.to.split("@")[1] ?? "?";
  // Consent gate: a marketing send requires explicit marketing consent from the
  // recipient. No-ops the send (does not throw) so a caller can't accidentally
  // mail a non-consenting user.
  if (params.marketingConsentUserId && !(await hasConsent(params.marketingConsentUserId, "marketing"))) {
    console.info(`[email] skipped (no marketing consent) → to=@${toDomain}`);
    return fail("unauthorized", "Recipient has not granted marketing consent.");
  }
  if (!isResendConfigured()) {
    // No-op until keys are set — never block the caller.
    console.info(`[email] skipped (Resend not configured) → to=@${toDomain} subject="${params.subject}"`);
    return ok({ id: "noop" });
  }
  try {
    const from = params.from ?? getServerEnv().EMAIL_FROM ?? "Grid <hello@grid.no>";
    const { data, error } = await getResend().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.warn(`[email] send failed → to=@${toDomain}: ${error.message}`);
      return fail("provider_error", error.message);
    }
    console.info(`[email] sent id=${data?.id} → to=@${toDomain} subject="${params.subject}"`);
    return ok({ id: data?.id ?? "sent" });
  } catch (e) {
    return fail("internal", e instanceof Error ? e.message : "Email send error");
  }
}
