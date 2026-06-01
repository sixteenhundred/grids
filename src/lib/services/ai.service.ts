/**
 * AI service — the REFERENCE integration. Wraps the already-installed Anthropic
 * SDK. This is the only place new code should construct the raw client.
 *
 * SERVER-ONLY. Reads ANTHROPIC_API_KEY via the env validator, applies a cost
 * guard (input-length cap + output-token cap), and returns a normalized
 * ServiceResult — provider errors are never forwarded to the caller verbatim.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getServerEnv, isAnthropicConfigured } from "@/lib/env";
import { fail, ok, type ServiceResult } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_PROMPT_CHARS = 8_000; // cost guard: reject oversized prompts
const DEFAULT_MAX_TOKENS = 1_024;
const HARD_MAX_TOKENS = 4_096;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!isAnthropicConfigured()) return null;
  if (!client) client = new Anthropic({ apiKey: getServerEnv().ANTHROPIC_API_KEY });
  return client;
}

export { isAnthropicConfigured };

export type RunChatOptions = {
  model?: string;
  maxTokens?: number;
  system?: string;
};

/** Single typed entry point for a one-shot chat completion. */
export async function runChat(prompt: string, opts: RunChatOptions = {}): Promise<ServiceResult<string>> {
  const c = getClient();
  if (!c) return fail("unavailable", "AI is not configured on this deployment.");
  if (typeof prompt !== "string" || !prompt.trim()) return fail("invalid_input", "A non-empty prompt is required.");
  if (prompt.length > MAX_PROMPT_CHARS) return fail("invalid_input", `Prompt exceeds the ${MAX_PROMPT_CHARS}-character limit.`);

  try {
    const message = await c.messages.create({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: Math.min(opts.maxTokens ?? DEFAULT_MAX_TOKENS, HARD_MAX_TOKENS),
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return ok(text);
  } catch {
    // Do NOT leak provider error details (which can contain keys/org info) to callers.
    return fail("provider_error", "The AI provider request failed. Please try again.");
  }
}
