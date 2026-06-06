import { NextResponse } from "next/server";
import { runDomainSecurityMonitor } from "@/lib/security/domain-monitor";

/**
 * Scheduled domain-security monitor (Vercel Cron — see vercel.json).
 * Guarded by CRON_SECRET: Vercel Cron sends it as `Authorization: Bearer <secret>`.
 * Fails CLOSED — if CRON_SECRET is unset the job is not publicly triggerable.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDomainSecurityMonitor();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
