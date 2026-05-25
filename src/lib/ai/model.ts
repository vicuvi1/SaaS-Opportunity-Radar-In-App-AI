import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function getLanguageModel(): LanguageModel {
  const provider = process.env.IDEAFORGE_LLM_PROVIDER ?? "openai";

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY is not set.");
    }
    const id =
      process.env.IDEAFORGE_ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    return anthropic(id);
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  const id = process.env.IDEAFORGE_OPENAI_MODEL ?? "gpt-4o-mini";
  return openai(id);
}

// Validation analyst — claude-sonnet-4-6 (selected after eval: zero failures, 40pt good-bad spread)
export function getAnalystModel(): LanguageModel {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");
  return anthropic("claude-sonnet-4-6");
}

// Finisher — gpt-5.4. Anthropic's grammar compiler rejects our large schema;
// OpenAI strict JSON schema handles it without issues.
export function getFinisherModel(): LanguageModel {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return openai("gpt-5.4");
}

// Query extractor for Reddit/HN/GitHub search — gpt-4o-mini (fast, cheap, 4-keyword task)
export function getQueryModel(): LanguageModel {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return openai("gpt-4o-mini");
}
