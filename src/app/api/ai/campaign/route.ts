/**
 * Reference SECURE AI route — the template for every external-API route.
 *
 * Pipeline: authenticate → rate-limit (per user) → validate input (Zod, with
 * size caps as the cost guard) → call the server-side AI-backed action → return
 * a safe JSON response. The Anthropic key is read server-side only; provider
 * errors are never forwarded to the client.
 *
 * `runtime = "nodejs"` because the Anthropic SDK is not Edge-compatible.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, authErrorResponse, type AuthedUser } from "@/lib/security/auth-guard";
import { canAccessFeature } from "@/lib/entitlements";
import { rateLimit } from "@/lib/security/rate-limit";
import { reportError } from "@/lib/monitoring";
import { generateConcepts } from "@/lib/campaign-actions";

export const runtime = "nodejs";

const BriefSchema = z.object({
  brand: z.string().max(2_000).default(""),
  images: z.array(z.string().max(2_000_000)).max(4).default([]), // cost guard: cap count + size
  ageMin: z.number().int().min(0).max(120),
  ageMax: z.number().int().min(0).max(120),
  interests: z.array(z.string().max(60)).max(20).default([]),
  budget: z.number().min(0).max(100_000_000),
  weeks: z.number().int().min(1).max(104),
});

export async function POST(req: Request) {
  // 1) Authenticate the caller.
  let user: AuthedUser;
  try {
    user = await requireUser();
  } catch (err) {
    return authErrorResponse(err);
  }

  // 1.5) Entitlement gate — "campaign" is a paid feature. Mirrors the client
  // nav-hide so a direct POST can't bypass it. No-op while DEMO_MODE is on.
  if (!(await canAccessFeature(user.id, "campaign"))) {
    return NextResponse.json({ error: "This feature requires a higher plan." }, { status: 403 });
  }

  // 2) Rate-limit per user — AI calls are paid, so cap abuse and cost.
  const rl = rateLimit(`ai:campaign:${user.id}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) } },
    );
  }

  // 3) Validate input (size caps double as the cost guard).
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = BriefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", fields: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  // 4) Run the AI-backed action (server-side key; transparent sample fallback when unkeyed).
  try {
    const result = await generateConcepts(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    await reportError(err, { route: "/api/ai/campaign", userId: user.id });
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
