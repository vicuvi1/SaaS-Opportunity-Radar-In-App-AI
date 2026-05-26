import { streamText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { DISCOVER_SYSTEM_LEAN, buildDiscoverPrompt } from "@/lib/ai/prompts";
import { ideaDiscoverySchema } from "@/lib/schemas/idea-discovery";
import { requireCredits, deductCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/stripe";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireCredits(CREDIT_COSTS.discover);
    if (authError) return authError;

    const body = (await req.json()) as {
      niche?: string;
      founderProfileText?: string;
    };

    const niche = String(body.niche ?? "").trim().slice(0, 2000);
    const founderProfileText = body.founderProfileText ? String(body.founderProfileText).slice(0, 2000) : undefined;

    if (!niche && !founderProfileText) {
      return Response.json({ error: "Provide a niche or complete your founder profile." }, { status: 400 });
    }

    const deducted = await deductCredits(user.id, CREDIT_COSTS.discover, `Discover: ${niche.slice(0, 80) || "profile-based"}`);
    if (!deducted) {
      return Response.json({ error: "Insufficient credits.", required: CREDIT_COSTS.discover }, { status: 402 });
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
