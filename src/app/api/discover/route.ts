import { streamText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { DISCOVER_SYSTEM_LEAN, buildDiscoverPrompt } from "@/lib/ai/prompts";
import { ideaDiscoverySchema } from "@/lib/schemas/idea-discovery";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return Response.json({ error: "Auth not configured." }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await req.json()) as {
      niche?: string;
      founderProfileText?: string;
    };

    const niche = String(body.niche ?? "").trim().slice(0, 2000);
    const founderProfileText = body.founderProfileText ? String(body.founderProfileText).slice(0, 2000) : undefined;

    if (!niche && !founderProfileText) {
      return Response.json({ error: "Provide a niche or complete your founder profile." }, { status: 400 });
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: ideaDiscoverySchema }),
      system: DISCOVER_SYSTEM_LEAN,
      prompt: buildDiscoverPrompt({ niche, founderProfileText }),
      temperature: 1,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Discover failed." }, { status: 500 });
  }
}
