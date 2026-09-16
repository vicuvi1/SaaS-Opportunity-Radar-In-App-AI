import { anthropic } from "@ai-sdk/anthropic";
import { openai, createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import {
  isOpenRouterConfigured,
  resolveOpenRouterModel,
} from "./openrouter";

export type AiProviderName = "openrouter" | "openai" | "anthropic" | "custom";

export function getActiveProvider(): AiProviderName {
  if (isOpenRouterConfigured()) {
    return "openrouter";
  }
  if (process.env.AI_BASE_URL || process.env.FOUNDERHQ_LLM_PROVIDER === "custom") {
    return "custom";
  }
  if (
    process.env.FOUNDERHQ_LLM_PROVIDER === "anthropic" ||
    (!process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY)
  ) {
    return "anthropic";
  }
  return "openai";
}

export function isAiConfigured(): boolean {
  return !!(
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.AI_BASE_URL
  );
}

function getCustomModel(modelId?: string): LanguageModel {
  const custom = createOpenAI({
    baseURL: process.env.AI_BASE_URL ?? "http://localhost:11434/v1",
    apiKey: process.env.AI_API_KEY ?? "local",
  });
  return custom(modelId ?? process.env.AI_MODEL_ID ?? "llama3");
}

export function getLanguageModel(): LanguageModel {
  const provider = getActiveProvider();

  if (provider === "openrouter") {
    return resolveOpenRouterModel("AUTO").model;
  }

  if (provider === "custom") {
    return getCustomModel();
  }

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");
    const id = process.env.FOUNDERHQ_ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    return anthropic(id);
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  const id = process.env.FOUNDERHQ_OPENAI_MODEL ?? "gpt-4o-mini";
  return openai(id);
}

// Validation analyst
export function getAnalystModel(): LanguageModel {
  const provider = getActiveProvider();

  if (provider === "openrouter") {
    return resolveOpenRouterModel("DEEP").model;
  }

  if (provider === "custom") {
    return getCustomModel(process.env.AI_ANALYST_MODEL ?? "llama3");
  }

  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const id = process.env.FOUNDERHQ_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
    return anthropic(id);
  }

  if (process.env.OPENAI_API_KEY) {
    const id = process.env.FOUNDERHQ_OPENAI_MODEL ?? "gpt-4o";
    return openai(id);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-sonnet-4-6");
  }

  // If no key is set in dev, fallback to openrouter mock or local
  return resolveOpenRouterModel("DEEP").model;
}

// Finisher / Blueprint generator
export function getFinisherModel(): LanguageModel {
  const provider = getActiveProvider();

  if (provider === "openrouter") {
    return resolveOpenRouterModel("DEEP").model;
  }

  if (provider === "custom") {
    return getCustomModel(process.env.AI_FINISHER_MODEL);
  }

  if (process.env.OPENAI_API_KEY) {
    const id = process.env.FOUNDERHQ_OPENAI_MODEL ?? "gpt-4o";
    return openai(id);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-sonnet-4-6");
  }

  return resolveOpenRouterModel("DEEP").model;
}

// Query extractor for Reddit/HN/GitHub search
export function getQueryModel(): LanguageModel {
  const provider = getActiveProvider();

  if (provider === "openrouter") {
    return resolveOpenRouterModel("FAST").model;
  }

  if (provider === "custom") {
    return getCustomModel(process.env.AI_QUERY_MODEL);
  }

  if (process.env.OPENAI_API_KEY) {
    return openai(process.env.FOUNDERHQ_QUERY_MODEL ?? "gpt-4o-mini");
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-3-5-haiku-20241022");
  }

  return resolveOpenRouterModel("FAST").model;
}
