/**
 * CAN-SPAM unsubscribe endpoint. One-click, no login, no email in the URL —
 * only the opaque per-signup token. Honours the opt-out by stamping
 * `unsubscribed_at` (suppression flag) so the address is never emailed again.
 * Idempotent: a prefetched or repeated visit is safe.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/security/rate-guard";

export const runtime = "nodejs";

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/><title>${title}</title></head>
<body style="margin:0;background:#08090c;color:#e9eaee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:12vh auto;padding:0 24px;text-align:center;">
<div style="font-size:22px;font-weight:700;color:#fff;">Grid<span style="color:#0071e3;">.</span></div>
<h1 style="margin-top:24px;font-size:20px;color:#fff;">${title}</h1>
<p style="margin-top:12px;font-size:14px;line-height:1.6;color:#b8bbc2;">${body}</p>
</div></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  try {
    await enforceRateLimit("auth");
  } catch {
    return page("Too many requests", "Please slow down and try again in a few minutes.", 429);
  }
  const token = new URL(req.url).searchParams.get("t")?.trim();
  if (!token) {
    return page("Invalid link", "This unsubscribe link is missing its token. Please use the link from your email.");
  }
  try {
    const row = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.unsubscribeToken, token))
      .limit(1)
      .then((r) => r[0]);
    if (row) {
      await db.update(waitlist).set({ unsubscribedAt: new Date() }).where(eq(waitlist.id, row.id));
    }
    // Always show success (don't reveal whether a token matched).
    return page("You're unsubscribed", "You won't receive further emails from the Grid waitlist. You can rejoin any time from our site.");
  } catch {
    return page("Something went wrong", "We couldn't process that just now. Please try again, or email support to be removed.");
  }
}
