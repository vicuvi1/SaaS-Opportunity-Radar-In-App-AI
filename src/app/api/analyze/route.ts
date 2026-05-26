import { streamText, Output } from "ai";
import { gatherDemandSnippets, snippetsToPromptDigest } from "@/lib/demand/gather";
import { extractSearchQuery } from "@/lib/demand/extract-query";
import { getAnalystModel } from "@/lib/ai/model";
import { ANALYST_SYSTEM, buildAnalystPrompt } from "@/lib/ai/prompts";
import { ideaReportSchema } from "@/lib/schemas/idea-report";
import { requireCredits, deductCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/stripe";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireCredits(CREDIT_COSTS.validate);
    if (authError) return authError;

    const body = (await req.json()) as {
      topic?: string;
      founderProfile?: string;
      pastedSignals?: string;
      digest?: string;
    };

    const topic = String(body.topic ?? "").trim().slice(0, 2000);
    if (!topic) {
      return Response.json({ error: "Topic is required." }, { status: 400 });
    }

    const founderProfile = body.founderProfile ? String(body.founderProfile).slice(0, 2000) : "";
    const pastedSignals = body.pastedSignals ? String(body.pastedSignals).slice(0, 12000) : "";

    // Use client-prefetched digest if provided, otherwise gather server-side as fallback.
    let digest: string;
    let gatherErrorsBlock = "";

    if (body.digest && body.digest.trim().length > 0) {
      digest = body.digest;
    } else {
      const searchQuery = await extractSearchQuery(topic);
      console.log(`[analyze] topic="${topic.slice(0, 80)}…" → query="${searchQuery}"`);
      const { snippets, errors } = await gatherDemandSnippets(searchQuery);
      digest = snippetsToPromptDigest(snippets);
      if (errors.length) {
        gatherErrorsBlock = `\n\nINGESTION NOTES:\n${errors.map((e) => `- ${e}`).join("\n")}`;
      }
    }

    const manualBlock = pastedSignals.trim()
      ? `\n\nUSER-PASTED RAW SIGNALS / NOTES:\n${pastedSignals.trim().slice(0, 12000)}`
      : "";

    let model;
    try {
      model = getAnalystModel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Model configuration error.";
      return Response.json(
        { error: msg, hint: "Set ANTHROPIC_API_KEY in .env" },
        { status: 503 },
      );
    }

    const deducted = await deductCredits(user.id, CREDIT_COSTS.validate, `Validate: ${topic.slice(0, 80)}`);
    if (!deducted) {
      return Response.json({ error: "Insufficient credits.", required: CREDIT_COSTS.validate }, { status: 402 });
    }

    const result = streamText({
      model,
      output: Output.object({ schema: ideaReportSchema }),
      system: ANALYST_SYSTEM,
      prompt: buildAnalystPrompt({ topic, founderProfile, digest, manualBlock, gatherErrorsBlock }),
      temperature: 0.2,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Analyze failed." }, { status: 500 });
  }
}
