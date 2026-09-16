import fs from "fs";
import path from "path";
import { generateObject } from "ai";
import { z } from "zod";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { opportunityStore } from "@/lib/opportunities/store";
import type { Opportunity, EvidenceGrading } from "@/lib/opportunities/types";
import { exportOpportunityToObsidian, getObsidianFilePath } from "@/lib/obsidian/export";
import { adapterRegistry } from "@/lib/research/adapters/registry";
import { db } from "@/lib/db";
import { opportunitySourcesTable } from "@/lib/db/schema";

const REPORTS_DIR = path.join(process.cwd(), "data", "reports");

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

export const deepResearchSchema = z.object({
  // Pass 1: Problem Validation
  problemValidation: z.object({
    rootCause: z.string(),
    severityRating: z.number().min(1).max(10),
    severityExplanation: z.string(),
    affectedWorkflows: z.array(z.string()),
    frequencyAndRecurrence: z.string(),
    emotionalIntensity: z.enum([
      "MILD_ANNOYANCE",
      "MODERATE_FRICTION",
      "ACUTE_PAIN",
      "MISSION_CRITICAL",
    ]),
  }),

  // Pass 2: Target Customer & ICP
  targetCustomer: z.object({
    primaryCustomerProfile: z.string(),
    buyingPersona: z.string(),
    teamSizeAndRevenueRange: z.string(),
    decisionMakerVsUser: z.string(),
    churnRiskFactors: z.array(z.string()),
  }),

  // Pass 3: Current Workflow & Friction
  currentWorkflow: z.object({
    stepByStepWorkflow: z.array(z.string()),
    hoursLostPerWeek: z.string(),
    toolsGluedTogether: z.array(z.string()),
    criticalFailurePoints: z.array(z.string()),
  }),

  // Pass 4: Existing Solutions & Why They Fail
  existingSolutions: z.object({
    incumbentTools: z.array(z.string()),
    openSourceAlternatives: z.array(z.string()),
    manualWorkarounds: z.array(z.string()),
    whyUsersSwitchOrComplain: z.array(z.string()),
  }),

  // Pass 5: Competitor Landscape
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

  // Pass 6: Pricing & Willingness to Pay
  pricingStrategy: z.object({
    existingMarketPricePoints: z.string(),
    suggestedModel: z.string(),
    tierRecommendations: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        targetSubsegment: z.string(),
      }),
    ),
    roiJustification: z.string(),
    willingnessToPaySignals: z.string(),
  }),

  // Pass 7: Demand Evidence
  demandEvidence: z.object({
    demandSignalsSummary: z.string(),
    recurringSearchPhrases: z.array(z.string()),
    communityDiscussions: z.array(z.string()),
    featureRequestsObserved: z.array(z.string()),
  }),

  // Pass 8: Commercial Evidence & Buyer Intent
  commercialEvidence: z.object({
    budgetIndicators: z.string(),
    switchingFrictionNotes: z.string(),
    urgencyLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
    commercialSignals: z.array(z.string()),
  }),

  // Pass 9: Market Crowdedness & Saturation
  marketCrowdedness: z.object({
    competitiveDensity: z.enum(["LOW", "MEDIUM", "HIGH", "SATURATED"]),
    crowdednessScore: z.number().min(0).max(100), // 0 = empty blue ocean, 100 = saturated red ocean
    fundedCompetitorsCountEstimate: z.string(),
    barrierToEntry: z.enum(["LOW", "MEDIUM", "HIGH"]),
    crowdednessExplanation: z.string(),
  }),

  // Pass 10: Whitespace & Differentiation Wedge
  whitespaceWedge: z.object({
    underservedSubsegment: z.string(),
    overlookedFeatures: z.array(z.string()),
    positioningWedge: z.string(),
    unfairAdvantageOrMoat: z.string(),
  }),

  // Pass 11: AI & Automation Leverage
  aiLeverage: z.object({
    whereAiProvides10xSpeedup: z.string(),
    whyNotPossibleYearsAgo: z.string(),
    workflowsAutomatedEndToEnd: z.array(z.string()),
    llmCapabilitiesUsed: z.array(z.string()),
    aiWrapperRisk: z.enum([
      "HIGH_WRAPPER_RISK",
      "MODERATE_DEFENSIBILITY",
      "STRONG_DEEP_AI_MOAT",
    ]),
  }),

  // Pass 12: Counter-Evidence & Devil's Advocate
  devilsAdvocate: z.object({
    whyItCouldWork: z.array(z.string()),
    whyItMightNotWork: z.array(z.string()),
    whyIncumbentsHaventBuiltItYet: z.string(),
    fatalFlawAnalysis: z.string(),
    regulatoryOrPlatformRisks: z.array(z.string()),
  }),

  // Pass 13: Final Synthesis & Research Gaps
  synthesis: z.object({
    overallViabilityScore: z.number().min(0).max(100),
    aiRecommendation: z.enum(["BUILD", "VALIDATE_FURTHER", "PIVOT", "DO_NOT_BUILD"]),
    recommendationReasoning: z.string(),
    whatWeStillDontKnow: z.array(z.string()),
    nextValidationSteps: z.array(z.string()),
  }),

  // Strict Evidence Audit across all claims
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

  // MVP & Anti-scope
  mvpFeatures: z.array(z.string()),
  excludedFeatures: z.array(z.string()),
  distributionChannels: z.array(z.string()),
});

export type DeepResearchResult = z.infer<typeof deepResearchSchema>;

/**
 * Runs the full 13-pass Deep Research investigation with live multi-source signal enrichment
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

  console.log(`[deep-research] Initiating 13-Pass Deep Research on: "${opp.title}"`);

  // 1. GATHER LIVE SIGNALS FROM ACTIVE ADAPTERS
  let liveSignalsContext = "No live signals available.";
  let liveFetchedSources: Array<{
    id: string;
    title: string;
    url: string;
    sourceType: string;
    date: string;
    summary: string;
    grading: EvidenceGrading;
  }> = [];

  try {
    const liveQuery = `${opp.title} ${opp.industry} competitors alternative problems`;
    console.log(`[deep-research] Querying active adapters for live enrichment: "${liveQuery}"`);
    const { signals: liveSignals } = await adapterRegistry.searchAllSources(liveQuery, {
      limit: 12,
    });

    if (liveSignals.length > 0) {
      console.log(`[deep-research] Gathered ${liveSignals.length} live research signals.`);
      liveSignalsContext = liveSignals
        .slice(0, 10)
        .map(
          (s, i) =>
            `[Signal ${i + 1}] Source: ${s.sourceType.toUpperCase()} (${s.sourceName}) | Title: ${s.title}\nURL: ${s.url}\nContent: ${s.content.slice(0, 300)}\nPain: ${s.painSignals.join(", ") || "N/A"} | Competitors: ${s.competitorSignals.join(", ") || "N/A"}`,
        )
        .join("\n\n");

      liveFetchedSources = liveSignals.map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        sourceType: s.sourceType,
        date: s.publishedAt ? s.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        summary: s.content.slice(0, 200),
        grading: "SOURCE-BASED CLAIM" as EvidenceGrading,
      }));
    }
  } catch (liveErr) {
    console.warn("[deep-research] Failed to gather live signals, proceeding with existing knowledge:", liveErr);
  }

  const { model, modelName } = resolveOpenRouterModel("DEEP");
  console.log(`[deep-research] Using deep model: ${modelName}`);

  const prompt = `You are an elite principal technology investor, market intelligence analyst, and SaaS product auditor.
Perform an exhaustive 13-PASS commercial and technical deep-research audit on this opportunity:

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
===========================

=== RECENT LIVE SIGNALS FROM MARKET RESEARCH ADAPTERS ===
${liveSignalsContext}
=========================================================

CONDUCT RIGOROUS RESEARCH ACROSS ALL 13 PASSES:
Pass 1: Problem Validation (Root cause analysis, severity rating 1-10, affected workflows, frequency/recurrence, emotional intensity of complaints)
Pass 2: Target Customer & ICP (Primary customer profile, buying persona, team size/revenue range, decision maker vs daily user, churn risk factors)
Pass 3: Current Workflow & Friction (Existing processes step-by-step, hours lost per week/month, tools currently glued together, critical failure points)
Pass 4: Existing Solutions & Why They Fail (Incumbent tools, open-source alternatives, spreadsheet/manual workarounds, why users switch or complain)
Pass 5: Competitor Landscape (Direct competitors with URLs/pricing, strengths, weaknesses, vulnerable market gap)
Pass 6: Pricing & Willingness to Pay (Existing market price points, suggested pricing model, tier recommendations, ROI justification, evidence of willingness to pay)
Pass 7: Demand Evidence (Community threads, search phrases, recurring questions, feature requests observed)
Pass 8: Commercial Evidence & Buyer Intent (Mentions of budgets, switching costs, contract friction, urgency level)
Pass 9: Market Crowdedness & Saturation (Competitive density: LOW/MEDIUM/HIGH/SATURATED, crowdednessScore 0-100, funded competitors, barrier to entry)
Pass 10: Whitespace & Differentiation Wedge (Underserved subsegments, overlooked features, specific positioning wedge, unfair advantage)
Pass 11: AI & Automation Leverage (Where AI provides real 10x leverage vs superficial wrapper, workflows automated end-to-end, LLM capabilities, wrapper risk level)
Pass 12: Counter-Evidence & Devil's Advocate (Balanced critique: 3-5 why it could work, 3-5 why it might not work / fatal flaws, why incumbents haven't built it, regulatory/platform risks)
Pass 13: Final Synthesis & Research Gaps (Overall viability score 0-100, recommendation BUILD / VALIDATE_FURTHER / PIVOT / DO_NOT_BUILD, critical unanswered questions, 3-5 immediate next validation actions)

Strict Evidence Audit:
Every single key factual claim MUST be graded strictly as one of:
- "FACT" (verifiable public data or official statistics)
- "SOURCE-BASED CLAIM" (reported by users or community sources)
- "INFERENCE" (logical deduction from observed patterns)
- "HYPOTHESIS" (unproven assumption needing validation)
- "UNKNOWN" (insufficient data)

Tone: Objective, investor-grade, neutral, no hype, no automated "Winner" declaration.`;

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

  // Format comprehensive Markdown report covering all 13 passes
  const now = new Date().toISOString();
  const reportMarkdown = `# 13-Pass Deep Research Intelligence Report: ${opp.title}

> **Date**: ${now.slice(0, 10)}  
> **Target Customer**: ${research.targetCustomer.primaryCustomerProfile} | **Industry**: ${opp.industry}  
> **Viability Score**: **${research.synthesis.overallViabilityScore}/100** | **Crowdedness**: **${research.marketCrowdedness.competitiveDensity}** (${research.marketCrowdedness.crowdednessScore}/100)  
> **AI Recommendation**: **${research.synthesis.aiRecommendation}**  
> **Model Used**: ${modelName}  

---

## Pass 1: Problem Validation & Severity
- **Root Cause**: ${research.problemValidation.rootCause}
- **Severity Rating**: **${research.problemValidation.severityRating} / 10** (${research.problemValidation.emotionalIntensity})
- **Frequency / Recurrence**: ${research.problemValidation.frequencyAndRecurrence}
- **Analysis**: ${research.problemValidation.severityExplanation}
- **Affected Workflows**:
${research.problemValidation.affectedWorkflows.map((w) => `  - ${w}`).join("\n")}

---

## Pass 2: Target Customer Profile & ICP
- **Primary Profile**: ${research.targetCustomer.primaryCustomerProfile}
- **Buying Persona**: ${research.targetCustomer.buyingPersona}
- **Target Revenue & Org Size**: ${research.targetCustomer.teamSizeAndRevenueRange}
- **Decision Maker vs Daily User**: ${research.targetCustomer.decisionMakerVsUser}
- **Churn Risk Factors**:
${research.targetCustomer.churnRiskFactors.map((c) => `  - ⚠️ ${c}`).join("\n")}

---

## Pass 3: Current Workflow & Friction Points
- **Hours Lost**: ${research.currentWorkflow.hoursLostPerWeek}
- **Tools Currently Glued Together**: ${research.currentWorkflow.toolsGluedTogether.join(", ")}
- **Step-by-Step Workflow**:
${research.currentWorkflow.stepByStepWorkflow.map((step, i) => `  ${i + 1}. ${step}`).join("\n")}
- **Critical Failure Points**:
${research.currentWorkflow.criticalFailurePoints.map((f) => `  - ❌ ${f}`).join("\n")}

---

## Pass 4: Existing Solutions & Why They Fail
- **Incumbent Tools**: ${research.existingSolutions.incumbentTools.join(", ")}
- **Open-Source Alternatives**: ${research.existingSolutions.openSourceAlternatives.join(", ") || "None notable"}
- **Manual Workarounds**: ${research.existingSolutions.manualWorkarounds.join("; ")}
- **Why Users Complain & Look to Switch**:
${research.existingSolutions.whyUsersSwitchOrComplain.map((reason) => `  - ${reason}`).join("\n")}

---

## Pass 5: Competitor Intelligence
${research.competitors
  .map(
    (c) => `### ${c.name}
- **Website/URL**: ${c.url || "N/A"}
- **Pricing**: ${c.pricing || "N/A"}
- **Strengths**: ${c.strengths.join(", ")}
- **Weaknesses**: ${c.weaknesses.join(", ")}
- **Vulnerable Gap**: ${c.gap}`,
  )
  .join("\n\n")}

---

## Pass 6: Pricing & Willingness to Pay
- **Suggested Model**: ${research.pricingStrategy.suggestedModel}
- **Benchmark Market Rates**: ${research.pricingStrategy.existingMarketPricePoints}
- **ROI Justification**: ${research.pricingStrategy.roiJustification}
- **Willingness to Pay Signals**: ${research.pricingStrategy.willingnessToPaySignals}
- **Recommended Tiers**:
${research.pricingStrategy.tierRecommendations
  .map((t) => `  - **${t.name}**: ${t.price} (${t.targetSubsegment})`)
  .join("\n")}

---

## Pass 7: Demand Evidence
- **Summary**: ${research.demandEvidence.demandSignalsSummary}
- **Recurring Search Phrasings**:
${research.demandEvidence.recurringSearchPhrases.map((p) => `  - "${p}"`).join("\n")}
- **Observed Community Discussions**:
${research.demandEvidence.communityDiscussions.map((d) => `  - ${d}`).join("\n")}
- **Feature Requests**:
${research.demandEvidence.featureRequestsObserved.map((r) => `  - ${r}`).join("\n")}

---

## Pass 8: Commercial Evidence & Buyer Intent
- **Urgency Level**: **${research.commercialEvidence.urgencyLevel}**
- **Budget Indicators**: ${research.commercialEvidence.budgetIndicators}
- **Switching Friction**: ${research.commercialEvidence.switchingFrictionNotes}
- **Commercial Signals**:
${research.commercialEvidence.commercialSignals.map((s) => `  - 💰 ${s}`).join("\n")}

---

## Pass 9: Market Crowdedness & Saturation
- **Competitive Density**: **${research.marketCrowdedness.competitiveDensity}**
- **Crowdedness Score**: **${research.marketCrowdedness.crowdednessScore} / 100**
- **Barrier to Entry**: ${research.marketCrowdedness.barrierToEntry}
- **Funded Competitors**: ${research.marketCrowdedness.fundedCompetitorsCountEstimate}
- **Saturation Assessment**: ${research.marketCrowdedness.crowdednessExplanation}

---

## Pass 10: Whitespace & Differentiation Wedge
- **Underserved Subsegment**: ${research.whitespaceWedge.underservedSubsegment}
- **Positioning Wedge**: ${research.whitespaceWedge.positioningWedge}
- **Overlooked Feature Gaps**:
${research.whitespaceWedge.overlookedFeatures.map((f) => `  - 🎯 ${f}`).join("\n")}
- **Unfair Advantage / Moat**: ${research.whitespaceWedge.unfairAdvantageOrMoat}

---

## Pass 11: AI & Automation Leverage
- **Where AI Delivers 10x Advantage**: ${research.aiLeverage.whereAiProvides10xSpeedup}
- **Why Not Feasible 3 Years Ago**: ${research.aiLeverage.whyNotPossibleYearsAgo}
- **Wrapper Defensibility Level**: **${research.aiLeverage.aiWrapperRisk}**
- **Workflows Automated End-to-End**:
${research.aiLeverage.workflowsAutomatedEndToEnd.map((w) => `  - ⚡ ${w}`).join("\n")}
- **Core LLM Capabilities Used**: ${research.aiLeverage.llmCapabilitiesUsed.join(", ")}

---

## Pass 12: Counter-Evidence & Devil's Advocate (Balanced Audit)

### 🟢 Why It Could Work
${research.devilsAdvocate.whyItCouldWork.map((w) => `- ${w}`).join("\n")}

### 🔴 Why It Might Not Work (Fatal Flaws & Failure Modes)
${research.devilsAdvocate.whyItMightNotWork.map((f) => `- ⚠️ ${f}`).join("\n")}

- **Why Incumbents Haven't Built It Yet**: ${research.devilsAdvocate.whyIncumbentsHaventBuiltItYet}
- **Fatal Flaw Analysis**: ${research.devilsAdvocate.fatalFlawAnalysis}
- **Regulatory / Platform Headwinds**:
${research.devilsAdvocate.regulatoryOrPlatformRisks.map((r) => `  - 🛡️ ${r}`).join("\n")}

---

## Pass 13: Final Synthesis & Research Gaps
- **Viability Score**: **${research.synthesis.overallViabilityScore} / 100**
- **Recommendation**: **${research.synthesis.aiRecommendation}**
- **Strategic Summary**: ${research.synthesis.recommendationReasoning}

### ❓ What We Still Don't Know (Critical Knowledge Gaps)
${research.synthesis.whatWeStillDontKnow.map((gap) => `- [ ] ${gap}`).join("\n")}

### 🚀 Immediate Next Validation Steps (3-5 Actions)
${research.synthesis.nextValidationSteps.map((step, i) => `${i + 1}. **${step}**`).join("\n")}

---

## Appendix A: MVP Scope vs Anti-Scope
### V1 MVP Features
${research.mvpFeatures.map((f, i) => `${i + 1}. **${f}**`).join("\n")}

### Excluded From V1 (Anti-Scope)
${research.excludedFeatures.map((f) => `- ❌ ${f}`).join("\n")}

### Recommended Distribution Channels
${research.distributionChannels.map((c) => `- 📣 ${c}`).join("\n")}

---

## Appendix B: Evidence Audit & Claim Verification
| Claim | Evidence Grading | Source URL / Proof | Confidence Note |
|-------|------------------|---------------------|-----------------|
${research.evidenceAudit
  .map(
    (e) =>
      `| ${e.claim.slice(0, 65).replace(/\|/g, "/")} | \`${e.grading}\` | ${e.sourceUrl || "Observed"} | ${e.confidenceNote.replace(/\|/g, "/")} |`,
  )
  .join("\n")}
`;

  // Write report to ./data/reports/
  ensureReportsDir();
  const safeTitle = opp.title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  const reportFileName = `${opp.id}-${safeTitle}-deep-research.md`;
  const reportPath = path.join(REPORTS_DIR, reportFileName);
  fs.writeFileSync(reportPath, reportMarkdown, "utf-8");

  // Merge live signals and audit claims into opportunity sources
  const auditSources = research.evidenceAudit.map((ea, i) => ({
    id: `audit-src-${Date.now().toString(36)}-${i}`,
    title: ea.claim.slice(0, 50),
    url: ea.sourceUrl || "",
    sourceType: "deep-research",
    grading: ea.grading as EvidenceGrading,
    summary: ea.confidenceNote,
    date: now.slice(0, 10),
  }));

  const allMergedSources = [
    ...(opp.sources || []),
    ...liveFetchedSources,
    ...auditSources,
  ];

  // Store in opportunitySourcesTable as well
  try {
    for (const s of [...liveFetchedSources, ...auditSources]) {
      db.insert(opportunitySourcesTable)
        .values({
          id: s.id,
          opportunityId: opp.id,
          title: s.title,
          url: s.url,
          sourceType: s.sourceType,
          date: s.date,
          summary: s.summary,
          claimSupported: s.title,
          createdAt: now,
        })
        .run();
    }
  } catch (srcInsertErr) {
    console.warn("[deep-research] Notice writing to opportunitySourcesTable:", srcInsertErr);
  }

  // Update opportunity record in SQLite with newly discovered intelligence
  const updatedOpp = await opportunityStore.update(opp.id, {
    researchScore: research.synthesis.overallViabilityScore,
    marketCrowdedness: research.marketCrowdedness.competitiveDensity,
    marketCrowdednessScore: research.marketCrowdedness.crowdednessScore,
    currentWorkflow: research.currentWorkflow.stepByStepWorkflow.join(" -> "),
    currentSolutions: research.competitors.map((c) => c.name).join(", "),
    economicImpact: research.problemValidation.severityExplanation,
    marketSize: research.targetCustomer.teamSizeAndRevenueRange,
    marketGap: research.whitespaceWedge.positioningWedge,
    aiOpportunity: research.aiLeverage.whereAiProvides10xSpeedup,
    monetizationModel: research.pricingStrategy.suggestedModel,
    pricingIdea: research.pricingStrategy.tierRecommendations.map((t) => `${t.name}: ${t.price}`).join(" | "),
    distributionChannels: research.distributionChannels,
    mvpFeatures: research.mvpFeatures,
    excludedFeatures: research.excludedFeatures,
    competitors: research.competitors,
    sources: allMergedSources,
    whyItCouldWork: research.devilsAdvocate.whyItCouldWork,
    whyItMightNotWork: research.devilsAdvocate.whyItMightNotWork,
    whatWeStillDontKnow: research.synthesis.whatWeStillDontKnow,
    nextValidationSteps: research.synthesis.nextValidationSteps,
    lastDeepResearchAt: now,
    validation: {
      interviewsCount: opp.validation?.interviewsCount || 0,
      interestedCustomersCount: opp.validation?.interestedCustomersCount || 0,
      waitlistCount: opp.validation?.waitlistCount || 0,
      assumptions: research.devilsAdvocate.whyItCouldWork,
      risks: research.devilsAdvocate.whyItMightNotWork,
      validationQuestions: research.synthesis.nextValidationSteps,
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

