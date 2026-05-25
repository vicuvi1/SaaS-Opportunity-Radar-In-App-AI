import { streamText, Output } from "ai";
import { gatherDemandSnippets, snippetsToPromptDigest } from "@/lib/demand/gather";
import { extractSearchQuery } from "@/lib/demand/extract-query";
import { getFinisherModel } from "@/lib/ai/model";
import { getFinisherSystemPrompt, buildFinisherPrompt } from "@/lib/ai/prompts";
import { getGoalTier, getFinisherSchema } from "@/lib/schemas/idea-finisher";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

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
      topic?: string;
      founderProfile?: string;
      report?: unknown;
      planGoal?: string;
    };

    const topic = String(body.topic ?? "").trim().slice(0, 2000);
    if (!topic) {
      return Response.json({ error: "Topic is required." }, { status: 400 });
    }

    let model;
    try {
      model = getFinisherModel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Model configuration error.";
      return Response.json({ error: msg }, { status: 503 });
    }

    let digest = "";
    let gatherErrorsBlock = "";

    if (body.report) {
      console.log(`[finish] topic="${topic.slice(0, 80)}…" → using existing validate report, skipping market gather`);
    } else {
      const searchQuery = await extractSearchQuery(topic);
      console.log(`[finish] topic="${topic.slice(0, 80)}…" → query="${searchQuery}"`);
      const { snippets, errors } = await gatherDemandSnippets(searchQuery);
      digest = snippetsToPromptDigest(snippets);
      gatherErrorsBlock = errors.length
        ? `\n\nINGESTION NOTES:\n${errors.map((e) => `- ${e}`).join("\n")}`
        : "";
    }

    const tier = getGoalTier(body.planGoal);
    const schema = getFinisherSchema(tier);
    const systemPrompt = getFinisherSystemPrompt(tier);

    const result = streamText({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output: Output.object({ schema: schema as any }),
      system: systemPrompt,
      prompt: buildFinisherPrompt({
        topic,
        founderProfile: body.founderProfile ? String(body.founderProfile).slice(0, 2000) : undefined,
        report: body.report,
        digest,
        gatherErrorsBlock,
        planGoal: body.planGoal ? String(body.planGoal).slice(0, 100) : undefined,
      }),
      temperature: 0.6,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Blueprint generation failed." }, { status: 500 });
  }
}
