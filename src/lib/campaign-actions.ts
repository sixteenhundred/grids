"use server";

/**
 * Campaign generation — server action.
 *
 * Tries live web research via Claude (`campaign-ai`); on no API key, an API
 * error, or unparseable output it transparently falls back to the deterministic
 * generator in `campaign.ts`. The caller gets concepts either way, plus the
 * `source` so the UI can show whether it's live or sample data.
 */

import { requireUser } from "./security/auth-guard";
import { enforceRateLimit } from "./security/rate-guard";
import { requireFeatureAccess } from "./entitlements";
import { sanitizeBrief } from "./validation";
import { generateCampaignsWithAI } from "./campaign-ai";
import { generateCampaigns, type CampaignBrief, type CampaignConcept } from "./campaign";

export async function generateConcepts(
  brief: CampaignBrief,
): Promise<{ concepts: CampaignConcept[]; source: "ai" | "sample" }> {
  const u = await requireUser();
  await enforceRateLimit("ai", u.id);
  await requireFeatureAccess(u.id, "campaign"); // paid feature; inert under DEMO_MODE (#4)
  // Bound every untrusted field before it reaches the model / sample generator.
  const safe = sanitizeBrief(brief);
  const ai = await generateCampaignsWithAI(safe);
  if (ai) return { concepts: ai, source: "ai" };
  return { concepts: generateCampaigns(safe), source: "sample" };
}
