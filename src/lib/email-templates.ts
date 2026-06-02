/**
 * Transactional email templates (server-only). Plain, inline-styled HTML for
 * broad client support. Keep copy short, on-brand, and SUBJECT LINES HONEST
 * (CAN-SPAM): the subject must accurately describe the message.
 *
 * Commercial email footer (CAN-SPAM): a clear one-click unsubscribe link and a
 * valid physical postal address. `unsubscribeUrl` is supplied for recipient-
 * facing mail; internal/admin notifications omit it.
 */

import { getServerEnv } from "./env";

function postalAddress(): string {
  return getServerEnv().COMPANY_POSTAL_ADDRESS || "GRID — [company postal address pending]";
}

const SHELL = (inner: string, opts?: { unsubscribeUrl?: string }) => `
<div style="margin:0;padding:0;background:#08090c;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e9eaee;">
    <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Grid<span style="color:#0071e3;">.</span></div>
    <div style="margin-top:28px;background:#101114;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px;">
      ${inner}
    </div>
    <p style="margin-top:24px;font-size:12px;line-height:1.6;color:#6b6f78;text-align:center;">
      Grid — the booking layer for visual production.<br/>
      ${postalAddress()}
      ${opts?.unsubscribeUrl ? `<br/><a href="${opts.unsubscribeUrl}" style="color:#8a8e98;text-decoration:underline;">Unsubscribe</a> from these emails.` : ""}
    </p>
  </div>
</div>`;

export function waitlistConfirmation(unsubscribeUrl?: string): { subject: string; html: string } {
  return {
    subject: "You're on the Grid waitlist",
    html: SHELL(`
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">You're on the list 🎬</h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#b8bbc2;">
        Thanks for joining the Grid waitlist. We're building the operating system for
        creative work — verified talent, protected bookings, real delivery.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#b8bbc2;">
        We'll email you the moment your access opens. Get ready to create bigger, move
        faster, and earn more.
      </p>
    `, { unsubscribeUrl }),
  };
}

export function waitlistNotification(email: string, when: string): { subject: string; html: string } {
  return {
    subject: `New Grid waitlist signup: ${email}`,
    html: SHELL(`
      <h1 style="margin:0 0 12px;font-size:18px;color:#ffffff;">New waitlist signup</h1>
      <p style="margin:0 0 8px;font-size:14px;color:#b8bbc2;"><strong style="color:#fff;">Email:</strong> ${email}</p>
      <p style="margin:0;font-size:14px;color:#b8bbc2;"><strong style="color:#fff;">When:</strong> ${when}</p>
    `),
  };
}
