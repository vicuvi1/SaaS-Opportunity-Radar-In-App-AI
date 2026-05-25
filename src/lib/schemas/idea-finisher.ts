import { z } from "zod";

// ── Shared sub-schemas ────────────────────────────────────────────────────────

export const finisherDemandSignalSchema = z.object({
  source: z.string(),
  excerpt: z.string(),
  url: z.string().nullable(),
  painThemes: z.array(z.string()),
  wtpSignal: z.boolean(),
  frustration: z.enum(["low", "medium", "high"]),
});

export const finisherCompetitorSchema = z.object({
  name: z.string(),
  url: z.string().nullable(),
  pricing: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  commonComplaints: z.array(z.string()),
  sentiment: z.string(),
});

export const finisherPainClusterSchema = z.object({
  theme: z.string(),
  evidenceSnippets: z.array(z.string()),
  opportunityHypothesis: z.string(),
});

// ── Shared building blocks ────────────────────────────────────────────────────

const coreBlueprint = {
  positioning: z.string(),
  targetUser: z.object({
    primary: z.string(),
    secondary: z.string(),
    painContext: z.string(),
    whyExistingFail: z.string(),
  }),
  coreProblem: z.string(),
  mvp: z.object({
    features: z.array(z.string()),
    excluded: z.array(z.string()),
    platform: z.string(),
    behavior: z.string(),
  }),
  wedgeStrategy: z.object({
    summary: z.string(),
    channels: z.array(z.string()),
  }),
  monetization: z.object({
    model: z.string(),
    pricingIdea: z.string(),
    rationale: z.string(),
  }),
  gtmSteps: z.array(z.string()),
  buildOrder: z.array(z.string()),
  executionRisks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
};

const marketResearch = {
  painClusters: z.array(finisherPainClusterSchema),
  demandSignalsSummary: z.array(finisherDemandSignalSchema),
};

const marketContext = {
  problemAnalysis: z.object({
    customerPain: z.string(),
    whoExperiences: z.string(),
    frequency: z.string(),
    urgency: z.enum(["low", "medium", "high"]),
    currentAlternatives: z.array(z.string()),
  }),
  marketReality: z.object({
    tamSamSom: z.string(),
    searchDemand: z.string(),
    trendMomentum: z.string(),
    oversaturationWarning: z.string(),
    competitorDensity: z.string(),
  }),
  competitors: z.array(finisherCompetitorSchema),
};

const executionMaterials = {
  opportunityWedge: z.object({
    underservedAudience: z.string(),
    ignoredWorkflow: z.string(),
    pricingGap: z.string(),
    uxGap: z.string(),
    aiLeverage: z.string(),
    speedAdvantage: z.string(),
  }),
  founderFit: z.object({
    skillsMatch: z.string(),
    difficulty: z.enum(["low", "medium", "high"]),
    buildTimeline: z.string(),
    technicalComplexity: z.string(),
  }),
  buildArtifacts: z.object({
    buildPrompt: z.string(),
    mvpFeatures: z.array(z.string()),
    dbSchema: z.string(),
    architecture: z.string(),
    authPayments: z.string(),
    landingCopy: z.string(),
    pricingIdeas: z.array(z.string()),
    onboardingFlow: z.string(),
    roadmap30Day: z.array(z.string()),
  }),
  validationPack: z.object({
    redditPostDraft: z.string(),
    twitterLaunchDraft: z.string(),
    landingPageCopy: z.string(),
    waitlistCopy: z.string(),
    interviewQuestions: z.array(z.string()),
    coldOutreachScript: z.string(),
    communityPlan: z.string(),
  }),
};

// ── Tier 1: LEAN (Fun side project) ──────────────────────────────────────────
// No market research. Simple financials. Ship fast.

export const leanFinisherSchema = z.object({
  ...coreBlueprint,
  founderFit: executionMaterials.founderFit,
  buildArtifacts: executionMaterials.buildArtifacts,
  validationPack: executionMaterials.validationPack,
  financialPlan: z.object({
    weeklyHours: z.string(),
    earningsCeiling: z.string(),
    launchCost: z.string(),
    firstRevenueTimeline: z.string(),
    keyAssumptions: z.array(z.string()),
  }),
  launchMilestones: z.object({
    week1: z.array(z.string()),
    month1: z.array(z.string()),
    month3: z.array(z.string()),
    successMetrics: z.array(z.string()),
    biggestChallenges: z.array(z.string()),
  }),
});

// ── Tier 2: INDIE (Profitable side project) ───────────────────────────────────
// Full market research + SBA-style business plan depth calibrated for bootstrappers

export const indieFinisherSchema = z.object({
  ...coreBlueprint,
  ...marketResearch,
  ...marketContext,
  ...executionMaterials,
  // SBA-inspired business plan sections
  executiveSummary: z.object({
    businessDescription: z.string(),
    missionStatement: z.string(),
    problemStatement: z.string(),
    solutionStatement: z.string(),
    uniqueValueProposition: z.string(),
    companyAdvantages: z.array(z.string()),
    keySuccessFactors: z.array(z.string()),
  }),
  customerProfile: z.object({
    description: z.string(),
    demographics: z.string(),
    buyingBehavior: z.string(),
    whyTheyBuy: z.string(),
  }),
  industryContext: z.object({
    industry: z.string(),
    trends: z.string(),
    marketSize: z.string(),
    companyAdvantages: z.array(z.string()),
  }),
  pricingStructure: z.object({
    tiers: z.array(z.object({
      name: z.string(),
      price: z.string(),
      includes: z.array(z.string()),
    })),
    rationale: z.string(),
  }),
  marketingAndSales: z.object({
    growthStrategy: z.array(z.string()),
    communicationChannels: z.array(z.string()),
    howToSell: z.string(),
  }),
  financialPlan: z.object({
    revenueModel: z.string(),
    pricingStrategy: z.string(),
    monthlyBreakeven: z.string(),
    projectedRevenue3Month: z.string(),
    projectedRevenue6Month: z.string(),
    startupCosts: z.string(),
    fundingNeeds: z.string(),
    keyAssumptions: z.array(z.string()),
  }),
  launchMilestones: z.object({
    week1: z.array(z.string()),
    month1: z.array(z.string()),
    month3: z.array(z.string()),
    month6: z.array(z.string()),
    successMetrics: z.array(z.string()),
    biggestChallenges: z.array(z.string()),
  }),
});

// ── Tier 3: BUSINESS (Bootstrapped small business) ────────────────────────────
// Full SBA-style business plan with 12-month financials

export const ideaFinisherSchema = z.object({
  ...coreBlueprint,
  ...marketResearch,
  ...marketContext,
  ...executionMaterials,
  executiveSummary: z.object({
    businessDescription: z.string(),
    missionStatement: z.string(),
    problemStatement: z.string(),
    solutionStatement: z.string(),
    uniqueValueProposition: z.string(),
    futureVision: z.string(),
    companyAdvantages: z.array(z.string()),
    keySuccessFactors: z.array(z.string()),
  }),
  financialPlan: z.object({
    revenueModel: z.string(),
    pricingStrategy: z.string(),
    monthlyBreakeven: z.string(),
    projectedRevenue3Month: z.string(),
    projectedRevenue12Month: z.string(),
    startupCosts: z.string(),
    fundingNeeds: z.string(),
    growthPlan: z.string(),
    keyAssumptions: z.array(z.string()),
  }),
  launchMilestones: z.object({
    week1: z.array(z.string()),
    month1: z.array(z.string()),
    month3: z.array(z.string()),
    month6: z.array(z.string()),
    successMetrics: z.array(z.string()),
    biggestChallenges: z.array(z.string()),
  }),
});

export type IdeaFinisher = z.infer<typeof ideaFinisherSchema>;

// ── Tier 4: VENTURE (Funded startup / Building a full company) ────────────────
// Full business plan + investor-grade sections

export const ventureFinisherSchema = ideaFinisherSchema.extend({
  investorSummary: z.object({
    pitchNarrative: z.string(),
    tamSamSomDetail: z.string(),
    moat: z.string(),
    whyNow: z.string(),
    traction: z.string(),
  }),
  unitEconomics: z.object({
    cac: z.string(),
    ltv: z.string(),
    ltvCacRatio: z.string(),
    paybackPeriod: z.string(),
    grossMargin: z.string(),
  }),
  fundingStrategy: z.object({
    raiseAmount: z.string(),
    useOfFunds: z.array(z.string()),
    seriesATriggers: z.array(z.string()),
    investorProfile: z.string(),
  }),
  teamPlan: z.object({
    founderRoles: z.array(z.string()),
    earlyHires: z.array(z.string()),
    advisors: z.string(),
  }),
});

// ── Tier 5: EXPLORE (Still figuring it out) ───────────────────────────────────
// Exploratory: helps understand what type of business this could become

export const exploreFinisherSchema = z.object({
  ...coreBlueprint,
  ...marketResearch,
  ...marketContext,
  ...executionMaterials,
  businessTypeAnalysis: z.object({
    whatTypeOfBusiness: z.string(),
    primaryPath: z.string(),
    alternativePaths: z.array(z.object({
      type: z.string(),
      pros: z.string(),
      cons: z.string(),
    })),
    readinessScore: z.enum(["not ready", "almost ready", "ready"]),
    keyUnknowns: z.array(z.string()),
    cheapestValidation: z.string(),
  }),
  financialPlan: z.object({
    revenueModel: z.string(),
    estimatedRevenueCeiling: z.string(),
    launchCost: z.string(),
    fundingNeeds: z.string(),
    keyAssumptions: z.array(z.string()),
  }),
  launchMilestones: z.object({
    week1: z.array(z.string()),
    month1: z.array(z.string()),
    pivotTriggers: z.array(z.string()),
    successMetrics: z.array(z.string()),
    biggestChallenges: z.array(z.string()),
  }),
});

// ── Goal tier routing ─────────────────────────────────────────────────────────

export type GoalTier = "lean" | "indie" | "business" | "venture" | "explore";

export function getGoalTier(planGoal?: string): GoalTier {
  const g = (planGoal ?? "").toLowerCase();
  // "funded" must be checked before "fun" — "funded" contains "fun" as a substring
  if (g.includes("funded") || g.includes("full company")) return "venture";
  if (g.includes("profitable side")) return "indie";
  if (g.includes("bootstrapped")) return "business";
  if (g.includes("figuring")) return "explore";
  if (/\bfun\b/.test(g) || g.includes("learn")) return "lean";
  return "business";
}

export function getFinisherSchema(tier: GoalTier) {
  switch (tier) {
    case "lean":     return leanFinisherSchema;
    case "indie":    return indieFinisherSchema;
    case "business": return ideaFinisherSchema;
    case "venture":  return ventureFinisherSchema;
    case "explore":  return exploreFinisherSchema;
  }
}
