import { NextResponse } from "next/server";
import { gatherDemandSnippets, snippetsToPromptDigest } from "@/lib/demand/gather";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { generateObject } from "ai";
import { z } from "zod";

const researchReportSchema = z.object({
  topic: z.string(),
  executiveSummary: z.string(),
  demandStrength: z.enum(["STRONG", "MODERATE", "WEAK"]),
  painClusters: z.array(
    z.object({
      clusterName: z.string(),
      evidenceSnippet: z.string(),
      source: z.string(),
      url: z.string().optional(),
      wtpIndicated: z.boolean(),
    }),
  ),
  competitorGaps: z.array(
    z.object({
      competitorName: z.string(),
      pricingComplaint: z.string(),
      unmetNeed: z.string(),
    }),
  ),
  gradedFindings: z.array(
    z.object({
      claim: z.string(),
      grading: z.enum(["FACT", "SOURCE-BASED CLAIM", "INFERENCE", "HYPOTHESIS", "UNKNOWN"]),
      confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
    }),
  ),
  suggestedNextAction: z.string(),
});

export async function POST(req: Request) {
  try {
    const { topic, opportunityId } = await req.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // 1. Gather live snippets from Reddit, HN, GitHub, Stack Overflow, Product Hunt
    const { snippets, errors } = await gatherDemandSnippets(topic.trim());
    const digest = snippetsToPromptDigest(snippets);

    // 2. Synthesize using OpenRouter DEEP analysis model
    const resolution = resolveOpenRouterModel("DEEP");
    const prompt = `You are a startup evidence intelligence specialist.
Analyze these raw internet demand signals fetched for the topic: "${topic.trim()}"

=== PUBLIC DEMAND SIGNALS ===
${digest.slice(0, 14000)}
=============================

TASK:
1. Extract real pain clusters and customer quotes with willingness-to-pay indicators.
2. Identify competitor pricing complaints and usability gaps.
3. Categorize every finding rigorously into:
   - FACT: Documented prices, known specs, verified legal requirements.
   - SOURCE-BASED CLAIM: Direct user complaints or reported experiences.
   - INFERENCE: Analytical conclusion based on observations.
   - HYPOTHESIS: Unverified assumption to test.
   - UNKNOWN: Information that cannot be determined from snippets.
4. Recommend a concrete next validation action.`;

    let report: z.infer<typeof researchReportSchema>;

    try {
      const result = await generateObject({
        model: resolution.model,
        schema: researchReportSchema,
        prompt,
        temperature: 0.2,
      });
      report = result.object;
    } catch (err) {
      console.warn("[api/copilot/research] Primary model failed, trying fallback...", err);
      const fallback = resolveOpenRouterModel("DEEP", true);
      const fallbackResult = await generateObject({
        model: fallback.model,
        schema: researchReportSchema,
        prompt,
        temperature: 0.2,
      });
      report = fallbackResult.object;
    }

    return NextResponse.json({
      report,
      opportunityId,
      snippetsCount: snippets.length,
      errors,
    });
  } catch (error) {
    console.error("[api/copilot/research] Error:", error);
    return NextResponse.json({ error: "Research failed to complete" }, { status: 500 });
  }
}
