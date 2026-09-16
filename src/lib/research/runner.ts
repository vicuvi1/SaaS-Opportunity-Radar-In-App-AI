import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  researchRunsTable,
  researchConfigsTable,
  researchSourcesTable,
} from "@/lib/db/schema";
import { gatherDemandSnippets } from "@/lib/demand/gather";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { opportunityStore, deriveAiPriorityFromScore } from "@/lib/opportunities/store";
import type { Opportunity, EvidenceGrading, ResearchScoreFactors } from "@/lib/opportunities/types";
import { planResearchQueries } from "./query-planner";
import {
  prefilterSignals,
  deduplicateResearchSignals,
  calculateSourceIndependence,
  clusterSignalsIntoThemes,
} from "./signal-extractor";
import { adapterRegistry } from "./adapters/registry";
import type { ResearchSignal } from "./adapters/types";

export interface ResearchRunOptions {
  configId?: string;
  field?: string;
  customField?: string;
  depth?: "quick" | "standard" | "deep";
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
 * Executes a full multi-source research discovery run
 * Implements strict quality-first filtering (Zero Filler Guarantee)
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
    sourceDiversity: number;
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
  const depth = options.depth || (config?.depth as "quick" | "deep") || "standard";
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
      sourcesUsed: JSON.stringify(["reddit", "hackernews", "github", "producthunt", "web"]),
      durationMs: 0,
      createdAt: now,
    })
    .run();

  try {
    // 1. Multi-source query planning (IdeaGo & CrowdMind style)
    const plannedQueries = planResearchQueries(targetDomain, depth);
    console.log(`[research-runner] Formulated ${plannedQueries.length} queries across active sources`);

    // 2. Multi-source parallel search across all adapters
    const { signals: rawSignals, successfulSources } = await adapterRegistry.searchAllSources(
      targetDomain,
      {
        limit: depth === "deep" ? 20 : 12,
        searchType: "pain_focused",
        sourceIds: options.sources,
      },
    );

    let allSignals: ResearchSignal[] = [...rawSignals];

    // Supplemental gather if adapters yielded sparse results
    if (allSignals.length < 5) {
      console.log(`[research-runner] Adapters returned ${allSignals.length} signals. Running supplemental discovery...`);
      try {
        const { snippets } = await gatherDemandSnippets(targetDomain, options.userId);
        for (const s of snippets) {
          allSignals.push({
            id: `supp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            sourceType: s.source as any,
            sourceName: s.source,
            url: s.url || "",
            title: s.title || `Demand signal from ${s.source}`,
            collectedAt: now,
            content: s.text,
            engagement: { score: s.score || 5 },
            topic: targetDomain,
            entities: [],
            painSignals: [],
            commercialSignals: [],
            competitorSignals: [],
            relevance: 0.6,
            hash: `supp-${s.url || ""}-${s.text.slice(0, 100)}`,
          });
        }
      } catch (e) {
        console.warn("[research-runner] Supplemental gather failed:", e);
      }
    }

    // 3. Pre-filter and deduplicate signals
    const filteredSignals = prefilterSignals(allSignals);
    const { uniqueSignals, duplicatesRemoved } = deduplicateResearchSignals(filteredSignals);
    const independenceMetrics = calculateSourceIndependence(uniqueSignals);
    const clusters = clusterSignalsIntoThemes(uniqueSignals);

    console.log(`[research-runner] Signals: ${allSignals.length} raw -> ${uniqueSignals.length} unique (${duplicatesRemoved} duplicates removed). Diversity: ${(independenceMetrics.sourceDiversity * 100).toFixed(0)}%. Clusters: ${clusters.length}`);

    // Store raw signal snapshots in research_sources table
    for (const sig of uniqueSignals.slice(0, 25)) {
      db.insert(researchSourcesTable)
        .values({
          id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          runId,
          source: sig.sourceType,
          title: sig.title.slice(0, 150),
          url: sig.url,
          snippet: sig.content.slice(0, 500),
          score: sig.engagement.score || sig.engagement.upvotes || 0,
          fetchedAt: now,
        })
        .run();
    }

    // 4. Build high-density prompt digest with source citations
    const digest = uniqueSignals
      .slice(0, 20)
      .map((s, idx) => `[Source #${idx + 1} (${s.sourceType.toUpperCase()} - ${s.sourceName})]: ${s.title}\nURL: ${s.url}\n${s.content}\nPain: ${s.painSignals.join(", ") || "None"}\nCommercial: ${s.commercialSignals.join(", ") || "None"}`)
      .join("\n\n---\n\n");

    // 5. Select OpenRouter AI model
    const tier = depth === "deep" ? "DEEP" : "FAST";
    const { model, modelName } = resolveOpenRouterModel(tier);
    console.log(`[research-runner] Generating candidates with model: ${modelName} (${tier})`);

    const prompt = `You are a principal enterprise YC-style startup market research intelligence agent.
Analyze these public market demand signals and customer complaints in the domain: "${targetDomain}"

=== DEMAND SIGNALS DIGEST (${uniqueSignals.length} independent signals) ===
${digest.slice(0, 18000)}
===========================================================================

TASK:
1. Synthesize candidate business software / SaaS opportunities strictly grounded in the recurring pain points, broken workflows, and complaints documented above.
2. Generate UP TO ${targetCount + 2} candidate opportunities (we will filter strictly by quality threshold).
3. Score each candidate rigorously across 10 dimensions (0-10 each):
   - problemSeverity, problemFrequency, economicValue, willingnessToPay, marketOpportunity, competitionGap, aiFit, technicalFeasibility, distributionPotential, evidenceStrength.
4. Only generate opportunities that have credible commercial potential and real demand.
5. ZERO FILLER GUARANTEE: If there are fewer than ${targetCount} truly strong, high-conviction opportunities, ONLY return the strong ones. DO NOT fabricate weak or generic filler ideas.`;

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
      console.warn(`[research-runner] Model ${modelName} generation failed. Retrying fallback...`, err);
      const fallback = resolveOpenRouterModel(tier, true);
      const fallbackRes = await generateObject({
        model: fallback.model,
        schema: candidatesListSchema,
        prompt,
        temperature: 0.3,
      });
      generatedCandidates = fallbackRes.object;
    }

    // 6. Rigorous Quality-First Filtering (Zero Filler Guarantee)
    const createdOpportunities: Opportunity[] = [];

    for (const cand of generatedCandidates.candidates) {
      const totalScore = calculateTotalScore(cand.scoreFactors);

      // Strict Quality Gate
      if (totalScore < qualityThreshold) {
        console.log(`[research-runner] Candidate "${cand.title}" scored ${totalScore}, below threshold ${qualityThreshold}. Filtered out.`);
        continue;
      }

      if (createdOpportunities.length >= targetCount) {
        break;
      }

      // Associate traceable evidence sources
      const matchedSources = uniqueSignals.slice(0, 4).map((sig, i) => ({
        id: `src-${Date.now().toString(36)}-${i}`,
        title: sig.title || `Demand signal from ${sig.sourceName}`,
        url: sig.url || "",
        sourceType: sig.sourceType,
        grading: (sig.content.includes("$") || sig.engagement.score! > 20 ? "FACT" : "SOURCE-BASED CLAIM") as EvidenceGrading,
        summary: sig.content.slice(0, 300),
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
          `${independenceMetrics.independentSignals} independent signals across ${independenceMetrics.distinctSourceTypes.length} channels`,
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
        researchRunId: runId,
        whyThisOpportunity: [
          `${matchedSources.length} verified demand signals across ${independenceMetrics.distinctSourceTypes.join(", ")}`,
          `Problem severity: ${cand.scoreFactors.problemSeverity}/10`,
          `Economic value: ${cand.scoreFactors.economicValue}/10`,
          `AI Fit: ${cand.aiFit}`,
          `Competition gap: ${cand.scoreFactors.competitionGap}/10`,
        ],
        isUserGenerated: false,
        createdBy: "AI",
        source: `Radar Discovery (${depth})`,
        tags: cand.tags,
      });

      createdOpportunities.push(opp);
    }

    const durationMs = Date.now() - startTime;
    const summary = `Discovered ${createdOpportunities.length} opportunities qualifying above threshold ${qualityThreshold}/100 from ${uniqueSignals.length} public signals across ${successfulSources.join(", ")}.`;

    // 7. Update run record in SQLite
    db.update(researchRunsTable)
      .set({
        status: "completed",
        summary,
        createdCount: createdOpportunities.length,
        sourcesUsed: JSON.stringify(successfulSources),
        durationMs,
      })
      .where(eq(researchRunsTable.id, runId))
      .run();

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
        sourceDiversity: independenceMetrics.sourceDiversity,
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
