import { streamText } from "ai";
import { resolveOpenRouterModel, type CopilotModelTier } from "@/lib/ai/openrouter";
import { copilotTools } from "@/lib/copilot/tools";
import { retrieveTargetedContext, type CopilotScope } from "@/lib/copilot/context-retriever";

export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      scope = "ALL_OPPORTUNITIES",
      currentOpportunityId,
      selectedOpportunityIds,
      modelTier = "AUTO",
    } = body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      scope?: CopilotScope;
      currentOpportunityId?: string;
      selectedOpportunityIds?: string[];
      modelTier?: CopilotModelTier;
    };

    // Extract the latest user query for targeted retrieval
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";

    // Retrieve targeted context
    const { contextSummary } = await retrieveTargetedContext({
      scope,
      currentOpportunityId,
      selectedOpportunityIds,
      userQuery,
    });

    // Resolve OpenRouter model
    const resolution = resolveOpenRouterModel(modelTier);

    const systemPrompt = `You are the built-in AI Copilot of the SaaS Opportunity Radar.
You are an expert startup researcher, B2B SaaS strategist, and founder pair-programmer.

=== RADAR CONTEXT (${scope}) ===
${contextSummary}
================================

CORE PRINCIPLES & GUIDELINES:
1. Ground every recommendation in verifiable commercial pain, economic impact, and willingness-to-pay signals.
2. Distinguish evidence reliability:
   - [FACT]: Verified concrete data (pricing, API limits, documented laws).
   - [SOURCE-BASED CLAIM]: Customer quotes from Reddit/HN/GitHub complaints.
   - [INFERENCE]: Logical deduction based on signals.
   - [HYPOTHESIS]: Unvalidated thesis or assumption.
   - [UNKNOWN]: Missing critical data needing customer discovery.
3. NEVER present an AI inference as a confirmed fact.
4. AI PRIORITY vs HUMAN DECISION:
   - AI Priority is a research prioritization signal (HIGH POTENTIAL, MEDIUM POTENTIAL, LOW POTENTIAL, VERY LOW, CRITICAL REVIEW).
   - The user's personal decision (INTERESTED, LATER, VALIDATING, BUILD, DO NOT BUILD) is solely their choice.
5. YOU HAVE TOOLS:
   - Use searchOpportunities() to find ideas by keyword or status.
   - Use getOpportunity(id) to pull deep details before answering specific questions.
   - Use compareOpportunities(ids) to compare ideas side-by-side.
   - Use updateStatus(), addNote(), addSource(), setFavorite(), saveOpportunity() when the user asks you to take an action!
6. For destructive or terminal state changes (e.g. marking REJECTED or deleting), clearly explain the rationale and confirm with the user.

Keep answers sharp, concise, actionable, and structured with clean markdown headers and bullet points.`;

    const result = streamText({
      model: resolution.model,
      system: systemPrompt,
      messages: messages as any,
      tools: copilotTools,
      temperature: 0.4,
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Copilot-Model": resolution.modelName,
        "X-Copilot-Fallback": resolution.isFallback ? "true" : "false",
      },
    });
  } catch (error) {
    console.error("[api/copilot/chat] Error in copilot stream:", error);
    return new Response(JSON.stringify({ error: "Failed to generate AI response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
