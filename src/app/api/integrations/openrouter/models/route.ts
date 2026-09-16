import { NextResponse } from "next/server";
import { OpenRouterProvider } from "@/lib/integrations/registry";
import {
  getIntegrationConnection,
  getIntegrationCredentials,
  saveIntegrationConnection,
} from "@/lib/integrations/vault";
import { createServerClient } from "@/lib/supabase/server";
import type { OpenRouterModelRoleConfig } from "@/lib/integrations/types";

const PRESETS: Record<string, OpenRouterModelRoleConfig> = {
  FREE_ONLY: {
    preset: "FREE_ONLY",
    roles: {
      discovery: "meta-llama/llama-3.3-70b-instruct:free",
      analysis: "meta-llama/llama-3.3-70b-instruct:free",
      scoring: "meta-llama/llama-3.3-70b-instruct:free",
      chat: "meta-llama/llama-3.3-70b-instruct:free",
      fallback: "meta-llama/llama-3.3-70b-instruct:free",
    },
  },
  FREE_FIRST: {
    preset: "FREE_FIRST",
    roles: {
      discovery: "meta-llama/llama-3.3-70b-instruct:free",
      analysis: "anthropic/claude-3.7-sonnet",
      scoring: "meta-llama/llama-3.3-70b-instruct:free",
      chat: "anthropic/claude-3.7-sonnet",
      fallback: "meta-llama/llama-3.3-70b-instruct:free",
    },
  },
  BALANCED: {
    preset: "BALANCED",
    roles: {
      discovery: "google/gemini-2.0-flash-001",
      analysis: "anthropic/claude-3.7-sonnet",
      scoring: "openai/gpt-4o",
      chat: "anthropic/claude-3.7-sonnet",
      fallback: "meta-llama/llama-3.3-70b-instruct:free",
    },
  },
  CUSTOM: {
    preset: "CUSTOM",
    roles: {
      discovery: "google/gemini-2.0-flash-001",
      analysis: "anthropic/claude-3.7-sonnet",
      scoring: "openai/gpt-4o",
      chat: "anthropic/claude-3.7-sonnet",
      fallback: "meta-llama/llama-3.3-70b-instruct:free",
    },
  },
};

export async function GET() {
  try {
    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const creds = await getIntegrationCredentials<{ apiKey?: string }>(userId, "openrouter");
    const apiKey = creds?.apiKey || process.env.OPENROUTER_API_KEY;

    const provider = new OpenRouterProvider();
    let models = await provider.fetchCatalog(apiKey);

    // If fetch failed or no internet, provide sensible default models
    if (models.length === 0) {
      models = [
        {
          id: "meta-llama/llama-3.3-70b-instruct:free",
          name: "Llama 3.3 70B Instruct (Free)",
          description: "Free high-performance open model by Meta",
          contextLength: 131072,
          pricing: { prompt: 0, completion: 0 },
          isFree: true,
        },
        {
          id: "anthropic/claude-3.7-sonnet",
          name: "Claude 3.7 Sonnet",
          description: "Anthropic's flagship intelligent model with hybrid reasoning",
          contextLength: 200000,
          pricing: { prompt: 3.0, completion: 15.0 },
          isFree: false,
        },
        {
          id: "openai/gpt-4o",
          name: "GPT-4o",
          description: "OpenAI versatile multimodal flagship model",
          contextLength: 128000,
          pricing: { prompt: 2.5, completion: 10.0 },
          isFree: false,
        },
        {
          id: "google/gemini-2.0-flash-001",
          name: "Gemini 2.0 Flash",
          description: "Google ultra-fast next-generation model",
          contextLength: 1048576,
          pricing: { prompt: 0.1, completion: 0.4 },
          isFree: false,
        },
      ];
    }

    const conn = await getIntegrationConnection(userId, "openrouter");
    const activeConfig: OpenRouterModelRoleConfig =
      (conn?.accountMetadata?.modelRoles as OpenRouterModelRoleConfig) || PRESETS.BALANCED;

    return NextResponse.json({
      models,
      presets: PRESETS,
      activeConfig,
    });
  } catch (err: any) {
    console.error("[openrouter/models] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load OpenRouter models", details: err.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const body = (await req.json()) as OpenRouterModelRoleConfig;
    if (!body || !body.roles) {
      return NextResponse.json({ error: "Invalid model configuration" }, { status: 400 });
    }

    const conn = await getIntegrationConnection(userId, "openrouter");

    await saveIntegrationConnection({
      userId,
      provider: "openrouter",
      status: conn?.status || "CONNECTED",
      category: "ai",
      accountName: conn?.accountName || "OpenRouter Configured",
      accountMetadata: {
        ...(conn?.accountMetadata || {}),
        modelRoles: body,
      },
    });

    return NextResponse.json({
      success: true,
      activeConfig: body,
    });
  } catch (err: any) {
    console.error("[openrouter/models] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save model roles", details: err.message },
      { status: 500 },
    );
  }
}
