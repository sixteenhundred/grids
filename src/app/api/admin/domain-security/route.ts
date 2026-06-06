import { NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/security/auth-guard";
import { verifyDomainSecurity } from "@/lib/security/domain-security";
import { logAudit } from "@/lib/audit";

/**
 * Admin: latest domain-security report for our own domain.
 * (The brief's `/admin/domains/:id/security` is scoped to our single domain —
 * there is no multi-tenant `domains` table.) Admin-only; the access is audited.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return authErrorResponse(e);
  }

  let host: string | null = null;
  try {
    host = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : null;
  } catch {
    host = null;
  }
  if (!host) {
    return NextResponse.json({ error: "No domain configured (set NEXT_PUBLIC_APP_URL)." }, { status: 400 });
  }

  const report = await verifyDomainSecurity(host);
  await logAudit(admin.id, "DOMAIN_SECURITY_REPORT_VIEWED", { domain: host, summary: report.summary });
  return NextResponse.json(report);
}
