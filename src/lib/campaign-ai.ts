/**
 * Campaign generator — live web research via Claude.
 *
 * Uses Claude (Opus 4.8) with the server-side `web_search` tool to research
 * real, current campaigns / posts / articles, then returns three structured
 * campaign concepts. The model researches the web and writes the concepts in
 * one streamed request; we parse its final JSON into our CampaignConcept shape.
 *
 * Server-only: reads ANTHROPIC_API_KEY and talks to the Anthropic API. Imported
 * exclusively by the `campaign-actions` server action, which falls back to the
 * deterministic generator in `campaign.ts` whenever this returns null.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Accent } from "./grid-data";
import type { CampaignBrief, CampaignConcept, Reference } from "./campaign";

const MODEL = "claude-opus-4-8";
const ACCENTS: Accent[] = ["purple", "cyan", "gold"];
const ARCHETYPES: CampaignConcept["archetype"][] = ["viral", "premium", "community"];

/** Stable instructions — cached so repeat calls only pay for the brief. */
const SYSTEM = `You are GRID's senior creative strategist. Given a brand brief, you research the live web for proven, current marketing campaigns and produce THREE distinct, world-class campaign concepts.

Process:
1. Use the web_search tool to find REAL, recent campaigns, posts, videos and articles relevant to the brand's category, audience and interests. Look at how leaders like MrBeast, Jake Paul, Nike, Aesop, A24, TED, Bloomberg, Forbes, Glossier, Red Bull and current viral creators win attention.
2. Ground each concept in what you actually found — cite real names, platforms and handles in the "references".
3. Make the three concepts genuinely distinct strategies (e.g. bold/viral, premium/editorial, community/UGC).

Return ONLY a single fenced \`\`\`json code block containing an array of EXACTLY 3 objects. No prose before or after the block. Each object must have these keys:
- "archetype": one of "viral" | "premium" | "community"
- "name": short concept name (string)
- "tagline": one short line (string)
- "bigIdea": 1-2 sentences (string)
- "rationale": why it works for this audience, 1-2 sentences (string)
- "videoStyle": array of 3-4 short strings
- "photoStyle": array of 3 short strings
- "shortForm": array of 3-4 short strings (TikTok/Reels/Shorts plan)
- "longForm": array of 2-3 short strings (YouTube/film/editorial plan)
- "strategy": array of 4 short strings (the genius marketing moves)
- "references": array of 3-4 objects, each { "name", "platform", "handle", "takeaway" } drawn from real campaigns you researched
- "channels": array of 3-5 short strings
- "budgetSplit": array of 4 objects { "label", "pct" } where pct are integers summing to 100
- "timeline": array of objects { "week", "focus" } spanning the brief's time frame

Keep every string tight and punchy. Use the brand's real name. Output valid JSON only.`;

type RawConcept = {
  archetype?: string;
  name?: string;
  tagline?: string;
  bigIdea?: string;
  rationale?: string;
  videoStyle?: string[];
  photoStyle?: string[];
  shortForm?: string[];
  longForm?: string[];
  strategy?: string[];
  references?: Reference[];
  channels?: string[];
  budgetSplit?: { label?: string; pct?: number }[];
  timeline?: { week?: string; focus?: string }[];
};

function briefToPrompt(b: CampaignBrief): string {
  const interests = b.interests.length ? b.interests.join(", ") : "general";
  return [
    `Brand / what we're launching: ${b.brand || "(see attached references)"}`,
    `Target audience age: ${b.ageMin}-${b.ageMax}`,
    `Audience interests: ${interests}`,
    `Budget: €${b.budget.toLocaleString()}`,
    `Time to produce: ${b.weeks} ${b.weeks === 1 ? "week" : "weeks"}`,
    ``,
    `Research the live web, then return the three concepts as specified.`,
  ].join("\n");
}

/** Pull the JSON array out of the model's final text (tolerant of fences). */
function extractConcepts(text: string): RawConcept[] | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
  try {
    const parsed = JSON.parse(candidate.trim());
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed as RawConcept[];
  } catch {
    /* fall through */
  }
  return null;
}

function strs(v: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return out.length ? out : fallback;
}

/** Normalise a model concept into our strict CampaignConcept shape. */
function toConcept(raw: RawConcept, i: number, b: CampaignBrief): CampaignConcept | null {
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : null;
  const bigIdea = typeof raw.bigIdea === "string" && raw.bigIdea.trim() ? raw.bigIdea.trim() : null;
  if (!name || !bigIdea) return null; // missing essentials → reject the whole batch

  const archetype = ARCHETYPES.includes(raw.archetype as CampaignConcept["archetype"])
    ? (raw.archetype as CampaignConcept["archetype"])
    : ARCHETYPES[i] ?? "viral";

  const references: Reference[] = Array.isArray(raw.references)
    ? raw.references
        .filter((r) => r && typeof r.name === "string")
        .slice(0, 4)
        .map((r) => ({
          name: String(r.name),
          platform: String(r.platform ?? ""),
          handle: String(r.handle ?? ""),
          takeaway: String(r.takeaway ?? ""),
          tags: [],
        }))
    : [];

  const budgetSplit = Array.isArray(raw.budgetSplit)
    ? raw.budgetSplit
        .filter((s) => s && typeof s.label === "string" && typeof s.pct === "number")
        .map((s) => ({ label: String(s.label), pct: Math.max(0, Math.round(Number(s.pct))) }))
    : [];

  const timeline = Array.isArray(raw.timeline)
    ? raw.timeline
        .filter((t) => t && (t.week || t.focus))
        .map((t) => ({ week: String(t.week ?? ""), focus: String(t.focus ?? "") }))
    : [];

  return {
    id: `cc${i + 1}`,
    archetype,
    name,
    tagline: typeof raw.tagline === "string" ? raw.tagline : "",
    bigIdea,
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
    videoStyle: strs(raw.videoStyle),
    photoStyle: strs(raw.photoStyle),
    shortForm: strs(raw.shortForm),
    longForm: strs(raw.longForm),
    strategy: strs(raw.strategy),
    references,
    channels: strs(raw.channels, ["Instagram", "TikTok", "YouTube"]),
    budgetSplit: budgetSplit.length ? budgetSplit : [{ label: "Production", pct: 100 }],
    timeline: timeline.length ? timeline : [{ week: `Wk 1-${b.weeks}`, focus: "Produce & launch" }],
    accent: ACCENTS[i] ?? "purple",
  };
}

/**
 * Research the web and return 3 concepts, or null to signal the caller should
 * fall back to the deterministic generator (no key, API error, or bad output).
 */
export async function generateCampaignsWithAI(b: CampaignBrief): Promise<CampaignConcept[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic();

  try {
    // Server-side web_search runs Claude's research loop; it can pause at the
    // 10-iteration cap (`pause_turn`) — continue a few times, then read text.
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: briefToPrompt(b) },
    ];
    let finalText = "";

    for (let attempt = 0; attempt < 4; attempt++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        messages,
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue; // resume the server-side search loop
      }

      finalText = message.content
        .filter((blk): blk is Anthropic.TextBlock => blk.type === "text")
        .map((blk) => blk.text)
        .join("\n");
      break;
    }

    const raw = extractConcepts(finalText);
    if (!raw) return null;

    const concepts = raw
      .slice(0, 3)
      .map((c, i) => toConcept(c, i, b))
      .filter((c): c is CampaignConcept => c !== null);

    return concepts.length === 3 ? concepts : null;
  } catch {
    return null; // any API/parse failure → deterministic fallback
  }
}
