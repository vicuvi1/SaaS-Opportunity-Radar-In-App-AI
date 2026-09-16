import fs from "fs";
import path from "path";
import { generateObject } from "ai";
import { z } from "zod";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { opportunityStore } from "@/lib/opportunities/store";
import type { Opportunity, EvidenceGrading } from "@/lib/opportunities/types";
import { exportOpportunityToObsidian, getObsidianFilePath } from "@/lib/obsidian/export";

const REPORTS_DIR = path.join(process.cwd(), "data", "reports");

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

export const deepResearchSchema = z.object({
  // 1. Problem analysis & severity
  problemAnalysis: z.object({
    rootCause: z.string(),
    severityRating: z.number().min(1).max(10),
    severityExplanation: z.string(),
    affectedWorkflows: z.array(z.string()),
  }),

  // 2. Current workarounds & friction
  currentWorkarounds: z.object({
    existingProcesses: z.array(z.string()),
    hoursLostPerWeek: z.string(),
    failurePoints: z.array(z.string()),
  }),

  // 3. Market size & economic impact
  marketEconomics: z.object({
    targetAudienceCountEstimate: z.string(),
    estimatedEconomicLossPerYear: z.string(),
    marketSizeExplanation: z.string(),
  }),

  // 4. Competitor landscape
  competitors: z.array(
    z.object({
      name: z.string(),
      url: z.string().optional(),
      pricing: z.string().optional(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      gap: z.string(),
    }),
  ),

  // 5. Pricing & willingness to pay
  pricingStrategy: z.object({
    suggestedModel: z.string(),
    tierRecommendations: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        targetSubsegment: z.string(),
      }),
    ),
    willingnessToPaySignals: z.string(),
  }),

  // 6. Feature gaps & feasibility
  feasibility: z.object({
    technicalComplexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    coreTechnicalRisks: z.array(z.string()),
    differentiationFactor: z.string(),
  }),

  // 7. Distribution channels
  distribution: z.object({
    primaryAcquisitionChannels: z.array(z.string()),
    communityHangouts: z.array(z.string()),
    viralOrLoopMechanisms: z.string(),
  }),

  // 8. AI leverage
  aiLeverage: z.object({
    whereAiProvides10xSpeedup: z.string(),
    whyNotPossibleYearsAgo: z.string(),
    llmCapabilitiesUsed: z.array(z.string()),
  }),

  // 9. MVP scope
  mvpFeatures: z.array(z.string()),

  // 10. Anti-scope (Excluded features)
  excludedFeatures: z.array(z.string()),

  // 11. Execution risks
  executionRisks: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string(),
    }),
  ),

  // 12. Validation experiments
  validationPlan: z.object({
    smokeTests: z.array(z.string()),
    customerInterviewQuestions: z.array(z.string()),
    passFailMetrics: z.string(),
  }),

  // 13. Evidence audit & fact classification
  evidenceAudit: z.array(
    z.object({
      claim: z.string(),
      grading: z.enum([
        "FACT",
        "SOURCE-BASED CLAIM",
        "INFERENCE",
        "HYPOTHESIS",
        "UNKNOWN",
      ]),
      sourceUrl: z.string().optional(),
      confidenceNote: z.string(),
    }),
  ),

  // Summary recommendation
  aiRecommendation: z.enum(["BUILD", "VALIDATE_FURTHER", "PIVOT", "DO_NOT_BUILD"]),
  recommendationReasoning: z.string(),
  revisedScore: z.number().min(0).max(100),
});

export type DeepResearchResult = z.infer<typeof deepResearchSchema>;

/**
 * Runs the full 13-dimension Deep Research investigation on an opportunity
 */
export async function runDeepResearch(
  opportunityId: string,
  vaultPath?: string,
): Promise<{
  opportunity: Opportunity;
  research: DeepResearchResult;
  reportMarkdown: string;
  reportPath: string;
}> {
  const opp = await opportunityStore.get(opportunityId);
  if (!opp) {
    throw new Error(`Opportunity with ID "${opportunityId}" not found`);
  }

  console.log(`[deep-research] Starting 13-dimension investigation on: "${opp.title}"`);

  const { model, modelName } = resolveOpenRouterModel("DEEP");
  console.log(`[deep-research] Using deep model: ${modelName}`);

  const prompt = `You are a world-class principal technology investor, product strategist, and B2B SaaS auditor.
Perform an exhaustive, 13-dimension commercial and technical deep-research audit on this opportunity:

=== OPPORTUNITY PROFILE ===
ID: ${opp.id}
Title: ${opp.title}
Industry: ${opp.industry}
Target Customer: ${opp.targetCustomer}
Problem: ${opp.problem}
Current Workflow: ${opp.currentWorkflow || "Not specified"}
Current Solutions: ${opp.currentSolutions || "Not specified"}
Market Gap: ${opp.marketGap || "Not specified"}
AI Fit: ${opp.aiFit}
Existing Score: ${opp.researchScore}/100
Sources count: ${opp.sources?.length || 0}
===========================

CONDUCT RIGOROUS RESEARCH ACROSS ALL 13 DIMENSIONS:
1. Problem analysis & severity (root cause, severity 1-10)
2. Current workarounds & friction (hours lost, failure points)
3. Market size & economic impact (TAM estimate, financial loss)
4. Competitor landscape (names, pricing, strengths/weaknesses, gaps)
5. Pricing strategy & willingness to pay (tiers, price points)
6. Feature gaps & technical feasibility
7. Distribution channels & community hangouts
8. AI leverage (why 10x now vs 3 years ago)
9. MVP scope (3-5 core essentials only)
10. Anti-scope (excluded features - what NOT to build in v1)
11. Execution risks & concrete mitigations
12. Validation plan (smoke tests, customer interview questions, pass/fail metrics)
13. Strict Evidence Audit:
    Every single key claim MUST be graded strictly as one of:
    - "FACT" (verifiable public data or official statistics)
    - "SOURCE-BASED CLAIM" (reported by users or community sources)
    - "INFERENCE" (logical deduction from observed patterns)
    - "HYPOTHESIS" (unproven assumption needing validation)
    - "UNKNOWN" (insufficient data)

Never hallucinate evidence. If something is an inference or hypothesis, mark it as such.`;

  let research: DeepResearchResult;

  try {
    const res = await generateObject({
      model,
      schema: deepResearchSchema,
      prompt,
      temperature: 0.2,
    });
    research = res.object;
  } catch (err) {
    console.warn(`[deep-research] Primary deep model (${modelName}) failed. Attempting fallback...`, err);
    const fallback = resolveOpenRouterModel("DEEP", true);
    const fallbackRes = await generateObject({
      model: fallback.model,
      schema: deepResearchSchema,
      prompt,
      temperature: 0.2,
    });
    research = fallbackRes.object;
  }

  // Format comprehensive Markdown report
  const now = new Date().toISOString();
  const reportMarkdown = `# Deep Research Report: ${opp.title}

> **Date**: ${now.slice(0, 10)}  
> **Target Customer**: ${opp.targetCustomer} | **Industry**: ${opp.industry}  
> **AI Recommendation**: **${research.aiRecommendation}** (Score: ${research.revisedScore}/100)  
> **Model Used**: ${modelName}  

---

## 1. Problem Analysis & Severity
- **Root Cause**: ${research.problemAnalysis.rootCause}
- **Severity Rating**: **${research.problemAnalysis.severityRating} / 10**
- **Analysis**: ${research.problemAnalysis.severityExplanation}
- **Affected Workflows**:
${research.problemAnalysis.affectedWorkflows.map((w) => `  - ${w}`).join("\n")}

## 2. Current Workarounds & Friction
- **Hours Lost**: ${research.currentWorkarounds.hoursLostPerWeek}
- **Existing Workarounds**:
${research.currentWorkarounds.existingProcesses.map((p) => `  - ${p}`).join("\n")}
- **Critical Failure Points**:
${research.currentWorkarounds.failurePoints.map((f) => `  - ${f}`).join("\n")}

## 3. Market Size & Economic Impact
- **Audience Estimate**: ${research.marketEconomics.targetAudienceCountEstimate}
- **Economic Loss**: ${research.marketEconomics.estimatedEconomicLossPerYear}
- **Dynamics**: ${research.marketEconomics.marketSizeExplanation}

## 4. Competitor Landscape
${research.competitors
  .map(
    (c) => `### ${c.name}
- **Pricing**: ${c.pricing || "N/A"}
- **Strengths**: ${c.strengths.join(", ")}
- **Weaknesses**: ${c.weaknesses.join(", ")}
- **Market Gap**: ${c.gap}`,
  )
  .join("\n\n")}

## 5. Pricing Strategy & Willingness to Pay
- **Model**: ${research.pricingStrategy.suggestedModel}
- **Willingness to Pay**: ${research.pricingStrategy.willingnessToPaySignals}
- **Recommended Tiers**:
${research.pricingStrategy.tierRecommendations
  .map((t) => `  - **${t.name}**: ${t.price} (${t.targetSubsegment})`)
  .join("\n")}

## 6. Technical Feasibility & Differentiation
- **Complexity**: ${research.feasibility.technicalComplexity}
- **Key Differentiation**: ${research.feasibility.differentiationFactor}
- **Technical Risks**:
${research.feasibility.coreTechnicalRisks.map((r) => `  - ${r}`).join("\n")}

## 7. Distribution & Acquisition Strategy
- **Primary Channels**:
${research.distribution.primaryAcquisitionChannels.map((c) => `  - ${c}`).join("\n")}
- **Community Hangouts**:
${research.distribution.communityHangouts.map((h) => `  - ${h}`).join("\n")}
- **Growth Loop**: ${research.distribution.viralOrLoopMechanisms}

## 8. AI Leverage & Automation Advantage
- **10x Advantage**: ${research.aiLeverage.whereAiProvides10xSpeedup}
- **Why Now**: ${research.aiLeverage.whyNotPossibleYearsAgo}
- **Capabilities**: ${research.aiLeverage.llmCapabilitiesUsed.join(", ")}

## 9. MVP Scope (What to Build First)
${research.mvpFeatures.map((f, i) => `${i + 1}. **${f}**`).join("\n")}

## 10. Anti-Scope (What NOT to Build in V1)
${research.excludedFeatures.map((f) => `- ❌ ${f}`).join("\n")}

## 11. Execution Risks & Mitigations
| Risk | Mitigation |
|------|------------|
${research.executionRisks.map((r) => `| ${r.risk} | ${r.mitigation} |`).join("\n")}

## 12. Validation Plan
- **Smoke Tests**:
${research.validationPlan.smokeTests.map((s) => `  - ${s}`).join("\n")}
- **Customer Interview Questions**:
${research.validationPlan.customerInterviewQuestions.map((q) => `  - "${q}"`).join("\n")}
- **Pass/Fail Criteria**: ${research.validationPlan.passFailMetrics}

## 13. Evidence Audit & Claim Verification
| Claim | Evidence Grading | Source | Confidence Note |
|-------|------------------|--------|-----------------|
${research.evidenceAudit
  .map(
    (e) =>
      `| ${e.claim.slice(0, 60)}... | \`${e.grading}\` | ${e.sourceUrl || "Observed"} | ${e.confidenceNote} |`,
  )
  .join("\n")}

---
**Recommendation Summary**: ${research.recommendationReasoning}
`;

  // Write report to ./data/reports/
  ensureReportsDir();
  const safeTitle = opp.title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  const reportFileName = `${opp.id}-${safeTitle}-deep-research.md`;
  const reportPath = path.join(REPORTS_DIR, reportFileName);
  fs.writeFileSync(reportPath, reportMarkdown, "utf-8");

  // Update opportunity record in SQLite with newly discovered intelligence
  const updatedSources = [
    ...(opp.sources || []),
    ...research.evidenceAudit.map((ea, i) => ({
      id: `audit-src-${Date.now().toString(36)}-${i}`,
      title: ea.claim.slice(0, 50),
      url: ea.sourceUrl || "",
      sourceType: "deep-research",
      grading: ea.grading as EvidenceGrading,
      summary: ea.confidenceNote,
      date: now.slice(0, 10),
    })),
  ];

  const updatedOpp = await opportunityStore.update(opp.id, {
    researchScore: research.revisedScore,
    currentWorkflow: research.currentWorkarounds.existingProcesses.join("; "),
    currentSolutions: research.competitors.map((c) => c.name).join(", "),
    economicImpact: research.marketEconomics.estimatedEconomicLossPerYear,
    marketSize: research.marketEconomics.targetAudienceCountEstimate,
    marketGap: research.feasibility.differentiationFactor,
    aiOpportunity: research.aiLeverage.whereAiProvides10xSpeedup,
    monetizationModel: research.pricingStrategy.suggestedModel,
    pricingIdea: research.pricingStrategy.tierRecommendations.map((t) => `${t.name}: ${t.price}`).join(" | "),
    distributionChannels: research.distribution.primaryAcquisitionChannels,
    mvpFeatures: research.mvpFeatures,
    excludedFeatures: research.excludedFeatures,
    executionRisks: research.executionRisks,
    competitors: research.competitors,
    sources: updatedSources,
    validation: {
      interviewsCount: opp.validation?.interviewsCount || 0,
      interestedCustomersCount: opp.validation?.interestedCustomersCount || 0,
      waitlistCount: opp.validation?.waitlistCount || 0,
      assumptions: research.validationPlan.smokeTests,
      risks: research.executionRisks.map((r) => r.risk),
      validationQuestions: research.validationPlan.customerInterviewQuestions,
    },
  });

  // Export to Obsidian if vault directory provided
  if (vaultPath && fs.existsSync(vaultPath)) {
    try {
      const oppToWrite = updatedOpp || opp;
      const { folder, filename } = getObsidianFilePath(oppToWrite);
      const targetDir = path.join(vaultPath, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const filePath = path.join(targetDir, filename);
      fs.writeFileSync(filePath, exportOpportunityToObsidian(oppToWrite), "utf-8");
    } catch (obsidianErr) {
      console.warn("[deep-research] Failed to export to Obsidian vault:", obsidianErr);
    }
  }

  return {
    opportunity: updatedOpp || opp,
    research,
    reportMarkdown,
    reportPath,
  };
}
