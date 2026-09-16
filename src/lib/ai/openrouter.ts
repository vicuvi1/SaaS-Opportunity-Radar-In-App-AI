import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type CopilotModelTier = "AUTO" | "FAST" | "DEEP" | "FREE_ONLY" | "CUSTOM";

export interface ModelResolution {
  model: LanguageModel;
  modelName: string;
  provider: string;
  isFallback: boolean;
  tier: CopilotModelTier;
}

// Configurable OpenRouter model IDs with sensible defaults
export function getModelIdForTier(tier: CopilotModelTier): string {
  switch (tier) {
    case "FAST":
      return (
        process.env.OPENROUTER_DISCOVERY_MODEL ||
        process.env.OPENROUTER_FAST_MODEL ||
        "meta-llama/llama-3.3-70b-instruct"
      );
    case "DEEP":
      return (
        process.env.OPENROUTER_ANALYSIS_MODEL ||
        process.env.OPENROUTER_DEEP_MODEL ||
        "anthropic/claude-3.7-sonnet"
      );
    case "FREE_ONLY":
      return (
        process.env.OPENROUTER_FREE_MODEL ||
        "meta-llama/llama-3.3-70b-instruct:free"
      );
    case "CUSTOM":
      return (
        process.env.OPENROUTER_CUSTOM_MODEL ||
        process.env.OPENROUTER_SCORING_MODEL ||
        "openai/gpt-4o"
      );
    case "AUTO":
    default:
      return (
        process.env.OPENROUTER_ANALYSIS_MODEL ||
        process.env.OPENROUTER_DISCOVERY_MODEL ||
        "anthropic/claude-3.7-sonnet"
      );
  }
}

export function getFallbackModelId(): string {
  return (
    process.env.OPENROUTER_FALLBACK_MODEL ||
    "google/gemini-2.0-flash-001"
  );
}

export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

function getOpenRouterClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || "mock-key";
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "https://saas-radar.local",
      "X-Title": "SaaS Opportunity Radar",
    },
  });
}

export function resolveOpenRouterModel(
  tier: CopilotModelTier = "AUTO",
  preferFallback = false,
  customApiKey?: string,
  customModelId?: string,
): ModelResolution {
  const client = getOpenRouterClient(customApiKey);

  if (preferFallback) {
    const fallbackId = customModelId || getFallbackModelId();
    return {
      model: client(fallbackId),
      modelName: fallbackId,
      provider: "OpenRouter (Fallback)",
      isFallback: true,
      tier,
    };
  }

  const modelId = customModelId || getModelIdForTier(tier);
  return {
    model: client(modelId),
    modelName: modelId,
    provider: "OpenRouter",
    isFallback: false,
    tier,
  };
}

// Resilient wrapper: attempts primary model, automatically catches failure and invokes fallback model
export async function executeWithModelFallback<T>(
  tier: CopilotModelTier,
  operation: (resolution: ModelResolution) => Promise<T>,
): Promise<{ result: T; resolution: ModelResolution }> {
  const primary = resolveOpenRouterModel(tier, false);
  try {
    const result = await operation(primary);
    return { result, resolution: primary };
  } catch (err) {
    console.warn(
      `[openrouter] Primary model "${primary.modelName}" failed. Retrying with fallback model...`,
      err,
    );
    const fallback = resolveOpenRouterModel(tier, true);
    const result = await operation(fallback);
    return { result, resolution: fallback };
  }
}
