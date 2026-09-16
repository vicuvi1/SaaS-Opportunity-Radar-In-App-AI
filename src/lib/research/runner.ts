import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  researchRunsTable,
  researchConfigsTable,
  researchSourcesTable,
} from "@/lib/db/schema";
import { gatherDemandSnippets, snippetsToPromptDigest } from "@/lib/demand/gather";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { opportunityStore, deriveAiPriorityFromScore } from "@/lib/opportunities/store";
import type { Opportunity, EvidenceGrading, ResearchScoreFactors } from "@/lib/opportunities/types";
import { planResearchQueries } from "./query-planner";
import {
  prefilterSignals,
  deduplicateSignals,
  extractSignalsHeuristic,
  type RawScrapedSignal,
} from "./signal-extractor";

export interface ResearchRunOptions {
  configId?: string;
  field?: string;
  customField?: string;
  depth?: "quick" | "deep";
  targetIdeaCount?: number;
  minQualityThreshold?: number;
  sources?: string[];
  userId?: string;
}

const candidateOpportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  problem: z.string(),
  targetCustomer: z.string(),
  industry: z.string(),
  currentWorkflow: z.string(),
  currentSolutions: z.string(),
  whyInteresting: z.string(),
  whyTheProblemMatters: z.string(),
  economicImpact: z.string(),
  marketSize: z.string(),
  marketGap: z.string(),
  aiOpportunity: z.string(),
  aiFit: z.enum(["HIGH", "MEDIUM", "LOW"]).default("HIGH"),
  scoreFactors: z.object({
    problemSeverity: z.number().min(0).max(10),
    problemFrequency: z.number().min(0).max(10),
    economicValue: z.number().min(0).max(10),
    willingnessToPay: z.number().min(0).max(10),
    marketOpportunity: z.number().min(0).max(10),
    competitionGap: z.number().min(0).max(10),
    aiFit: z.number().min(0).max(10),
    technicalFeasibility: z.number().min(0).max(10),
    distributionPotential: z.number().min(0).max(10),
    evidenceStrength: z.number().min(0).max(10),
  }),
  nextAction: z.string(),
  mvpFeatures: z.array(z.string()),
  excludedFeatures: z.array(z.string()),
  monetizationModel: z.string(),
  pricingIdea: z.string(),
  distributionChannels: z.array(z.string()),
  executionRisks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  competitors: z.array(
    z.object({
      name: z.string(),
      url: z.string().optional(),
      pricing: z.string().optional(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      gap: z.string().optional(),
    }),
  ),
  tags: z.array(z.string()),
});

const candidatesListSchema = z.object({
  candidates: z.array(candidateOpportunitySchema),
});

function calculateTotalScore(factors: ResearchScoreFactors): number {
  return (
    factors.problemSeverity +
    factors.problemFrequency +
    factors.economicValue +
    factors.willingnessToPay +
    factors.marketOpportunity +
    factors.competitionGap +
    factors.aiFit +
    factors.technicalFeasibility +
    factors.distributionPotential +
    factors.evidenceStrength
  );
}

/**
 * Executes a full research discovery run
 * Implements strict quality-first filtering (never pads with filler ideas)
 */
export async function runResearch(options: ResearchRunOptions): Promise<{
  runId: string;
  opportunities: Opportunity[];
  stats: {
    signalsFound: number;
    candidatesGenerated: number;
    qualifiedCount: number;
    requestedCount: number;
    qualityThreshold: number;
    durationMs: number;
  };
}> {
  const startTime = Date.now();
  const runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  // If configId provided, load config from SQLite
  let config: typeof researchConfigsTable.$inferSelect | undefined;
  if (options.configId) {
    config = db
      .select()
      .from(researchConfigsTable)
      .where(eq(researchConfigsTable.id, options.configId))
      .get();
  }

  const field = options.field || config?.field || "B2B SaaS";
  const customField = options.customField || config?.customField || "";
  const targetDomain = customField ? `${field}: ${customField}` : field;
  const depth = options.depth || (config?.depth as "quick" | "deep") || "quick";
  const targetCount = options.targetIdeaCount || config?.targetIdeaCount || 10;
  const qualityThreshold = options.minQualityThreshold || config?.minQualityThreshold || 60;

  console.log(`[research-runner] Starting run ${runId} for domain: "${targetDomain}" (depth: ${depth}, target: ${targetCount}, threshold: ${qualityThreshold})`);

  // Record initial run in database
  db.insert(researchRunsTable)
    .values({
      id: runId,
      configId: options.configId || null,
      mode: depth,
      topic: targetDomain,
      field,
      status: "running",
      summary: `Researching ${targetDomain}...`,
      qualityThreshold,
      requestedCount: targetCount,
      createdCount: 0,
      sourcesUsed: JSON.stringify(["reddit", "hackernews", "github", "producthunt"]),
      durationMs: 0,
      createdAt: now,
    })
    .run();

  try {
    // 1. Multi-source query planning (IdeaGo style)
    const plannedQueries = planResearchQueries(targetDomain, depth);
    console.log(`[research-runner] Planned ${plannedQueries.length} search queries across sources`);

    // 2. Gather demand signals
    const { snippets } = await gatherDemandSnippets(targetDomain, options.userId);

    // Map snippets to RawScrapedSignal
    const rawSignals: RawScrapedSignal[] = snippets.map((s) => ({
      source: s.source,
      title: s.title || `Demand signal from ${s.source}`,
      url: s.url || "",
      text: s.text,
      score: 5,
    }));

    // 3. Pre-filter and deduplicate signals
    const filteredSignals = prefilterSignals(rawSignals);
    const uniqueSignals = deduplicateSignals(filteredSignals);
    console.log(`[research-runner] Gathered ${rawSignals.length} raw signals -> ${uniqueSignals.length} unique filtered signals`);

    // Store raw signal snapshot in research_sources table
    for (const sig of uniqueSignals.slice(0, 20)) {
      db.insert(researchSourcesTable)
        .values({
          id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          runId,
          source: sig.source,
          title: sig.title.slice(0, 150),
          url: sig.url,
          snippet: sig.text.slice(0, 500),
          score: sig.score || 0,
          fetchedAt: now,
        })
        .run();
    }

    // 4. Heuristic pain extraction
    const { painSignals } = extractSignalsHeuristic(uniqueSignals);

    // 5. Build prompt digest
    const digest = snippetsToPromptDigest(
      uniqueSignals.map((s) => ({
        source: s.source as any,
        title: s.title,
        text: s.text,
        url: s.url,
      })),
    );

    // 6. Select OpenRouter AI model
    const tier = depth === "deep" ? "DEEP" : "FAST";
    const { model, modelName } = resolveOpenRouterModel(tier);
    console.log(`[research-runner] Generating candidates with model: ${modelName} (${tier})`);

    const prompt = `You are a principal YC-style startup market researcher.
Analyze these public market demand signals in the domain: "${targetDomain}"

=== DEMAND SIGNALS DIGEST ===
${digest.slice(0, 16000)}
=============================

TASK:
1. Synthesize candidate B2B SaaS opportunities based on recurring problems and commercial friction.
2. Generate UP TO ${targetCount + 2} candidate opportunities (we will strictly filter by quality threshold).
3. Score each candidate rigorously across 10 dimensions (0-10 each):
   - problemSeverity, problemFrequency, economicValue, willingnessToPay, marketOpportunity, competitionGap, aiFit, technicalFeasibility, distributionPotential, evidenceStrength.
4. Only generate opportunities that have real commercial potential.
5. If there are fewer than ${targetCount} strong ideas in this niche, ONLY generate the strong ones. DO NOT fabricate fluff ideas.`;

    let generatedCandidates: z.infer<typeof candidatesListSchema> = { candidates: [] };

    try {
      const res = await generateObject({
        model,
        schema: candidatesListSchema,
        prompt,
        temperature: 0.3,
      });
      generatedCandidates = res.object;
    } catch (err) {
      console.warn(`[research-runner] Model ${modelName} candidate generation failed. Retrying fallback...`, err);
      const fallback = resolveOpenRouterModel(tier, true);
      const fallbackRes = await generateObject({
        model: fallback.model,
        schema: candidatesListSchema,
        prompt,
        temperature: 0.3,
      });
      generatedCandidates = fallbackRes.object;
    }

    // 7. Rigorous Quality-First Filtering
    // CRITICAL: If 10 ideas requested and only 7 qualify >= qualityThreshold, return 7!
    const createdOpportunities: Opportunity[] = [];

    for (const cand of generatedCandidates.candidates) {
      const totalScore = calculateTotalScore(cand.scoreFactors);

      // Strict Quality Gate
      if (totalScore < qualityThreshold) {
        console.log(`[research-runner] Candidate "${cand.title}" scored ${totalScore}, below threshold ${qualityThreshold}. Filtered out.`);
        continue;
      }

      // Check if we hit the requested target count
      if (createdOpportunities.length >= targetCount) {
        break;
      }

      // Associate top evidence sources
      const matchedSources = uniqueSignals.slice(0, 3).map((sig, i) => ({
        id: `src-${Date.now().toString(36)}-${i}`,
        title: sig.title || `Demand signal from ${sig.source}`,
        url: sig.url || "",
        sourceType: sig.source,
        grading: "SOURCE-BASED CLAIM" as EvidenceGrading,
        summary: sig.text.slice(0, 300),
        date: now.slice(0, 10),
      }));

      // Store in SQLite with isNewDiscovery = true (1) -> held in Daily Research Inbox!
      const opp = await opportunityStore.create({
        title: cand.title,
        description: cand.description,
        problem: cand.problem,
        targetCustomer: cand.targetCustomer,
        industry: cand.industry,
        currentWorkflow: cand.currentWorkflow,
        currentSolutions: cand.currentSolutions,
        whyInteresting: cand.whyInteresting,
        whyTheProblemMatters: cand.whyTheProblemMatters,
        economicImpact: cand.economicImpact,
        marketSize: cand.marketSize,
        marketGap: cand.marketGap,
        aiOpportunity: cand.aiOpportunity,
        aiFit: cand.aiFit,
        aiPriority: deriveAiPriorityFromScore(totalScore),
        aiPriorityReasons: [
          `Quality score ${totalScore}/100 exceeds threshold (${qualityThreshold})`,
          `Problem severity: ${cand.scoreFactors.problemSeverity}/10`,
          `Economic value: ${cand.scoreFactors.economicValue}/10`,
        ],
        aiConfidence: totalScore >= 75 ? "HIGH" : "MEDIUM",
        researchScore: totalScore,
        researchScoreFactors: cand.scoreFactors,
        evidenceStrength: cand.scoreFactors.evidenceStrength >= 7 ? "HIGH" : "MEDIUM",
        myDecision: "UNDECIDED",
        nextAction: cand.nextAction,
        mvpFeatures: cand.mvpFeatures,
        excludedFeatures: cand.excludedFeatures,
        monetizationModel: cand.monetizationModel,
        pricingIdea: cand.pricingIdea,
        distributionChannels: cand.distributionChannels,
        executionRisks: cand.executionRisks,
        competitors: cand.competitors,
        sources: matchedSources,
        status: "NEW",
        isNewDiscovery: true, // Key: held in inbox for user review!
        isUserGenerated: false,
        createdBy: "AI",
        source: `Radar Discovery (${depth})`,
        tags: cand.tags,
      });

      createdOpportunities.push(opp);
    }

    const durationMs = Date.now() - startTime;
    const summary = `Discovered ${createdOpportunities.length} opportunities qualifying above threshold ${qualityThreshold}/100 from ${uniqueSignals.length} public signals.`;

    // 8. Update run record in SQLite
    db.update(researchRunsTable)
      .set({
        status: "completed",
        summary,
        createdCount: createdOpportunities.length,
        durationMs,
      })
      .where(eq(researchRunsTable.id, runId))
      .run();

    // If configId, update lastRunAt
    if (options.configId) {
      db.update(researchConfigsTable)
        .set({ lastRunAt: now })
        .where(eq(researchConfigsTable.id, options.configId))
        .run();
    }

    console.log(`[research-runner] Run complete. ${createdOpportunities.length} opportunities placed in Daily Research Inbox in ${durationMs}ms.`);

    return {
      runId,
      opportunities: createdOpportunities,
      stats: {
        signalsFound: uniqueSignals.length,
        candidatesGenerated: generatedCandidates.candidates.length,
        qualifiedCount: createdOpportunities.length,
        requestedCount: targetCount,
        qualityThreshold,
        durationMs,
      },
    };
  } catch (err) {
    console.error(`[research-runner] Run ${runId} failed:`, err);
    db.update(researchRunsTable)
      .set({
        status: "failed",
        summary: `Error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - startTime,
      })
      .where(eq(researchRunsTable.id, runId))
      .run();
    throw err;
  }
}
