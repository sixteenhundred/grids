"use server";

/**
 * Campaign generation — server action.
 *
 * Tries live web research via Claude (`campaign-ai`); on no API key, an API
 * error, or unparseable output it transparently falls back to the deterministic
 * generator in `campaign.ts`. The caller gets concepts either way, plus the
 * `source` so the UI can show whether it's live or sample data.
 */

import { generateCampaignsWithAI } from "./campaign-ai";
import { generateCampaigns, type CampaignBrief, type CampaignConcept } from "./campaign";

export async function generateConcepts(
  brief: CampaignBrief,
): Promise<{ concepts: CampaignConcept[]; source: "ai" | "sample" }> {
  const ai = await generateCampaignsWithAI(brief);
  if (ai) return { concepts: ai, source: "ai" };
  return { concepts: generateCampaigns(brief), source: "sample" };
}
