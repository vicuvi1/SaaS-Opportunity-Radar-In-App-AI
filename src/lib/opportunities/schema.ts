import { z } from "zod";

export const opportunityStatusSchema = z.enum([
  "NEW",
  "REVIEW",
  "DEEP_RESEARCH",
  "SHORTLIST",
  "REJECTED",
  "ARCHIVED",
]);

export const aiPrioritySchema = z.enum([
  "HIGH_POTENTIAL",
  "MEDIUM_POTENTIAL",
  "LOW_POTENTIAL",
  "VERY_LOW_PRIORITY",
  "CRITICAL_REVIEW",
]);

export const aiConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const evidenceStrengthSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const myDecisionSchema = z.enum([
  "UNDECIDED",
  "INTERESTED",
  "SHORTLISTED",
  "REJECTED",
]);

export const evidenceGradingSchema = z.enum([
  "FACT",
  "SOURCE_BASED_CLAIM",
  "INFERENCE",
  "HYPOTHESIS",
  "UNKNOWN",
]);

export const researchScoreFactorsSchema = z.object({
  problemSeverity: z.number().min(0).max(10).default(5),
  problemFrequency: z.number().min(0).max(10).default(5),
  economicValue: z.number().min(0).max(10).default(5),
  willingnessToPay: z.number().min(0).max(10).default(5),
  marketOpportunity: z.number().min(0).max(10).default(5),
  competitionGap: z.number().min(0).max(10).default(5),
  aiFit: z.number().min(0).max(10).default(5),
  technicalFeasibility: z.number().min(0).max(10).default(5),
  distributionPotential: z.number().min(0).max(10).default(5),
  evidenceStrength: z.number().min(0).max(10).default(5),
});

export const opportunityNoteSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const opportunitySourceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  url: z.string().default(""),
  sourceType: z.string().default("web"),
  date: z.string().optional(),
  summary: z.string().optional(),
  evidenceRelevance: z.string().optional(),
  grading: evidenceGradingSchema.default("INFERENCE"),
});

export const competitorInfoSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  pricing: z.string().optional(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  gap: z.string().optional(),
});

export const validationTrackingSchema = z.object({
  interviewsCount: z.number().default(0),
  interestedCustomersCount: z.number().default(0),
  waitlistCount: z.number().default(0),
  landingPageResults: z.string().optional(),
  pricingExperiments: z.string().optional(),
  feedback: z.string().optional(),
  assumptions: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  validationQuestions: z.array(z.string()).default([]),
});

// Flexible incoming schema for Hermes or Frontend submission
export const createOpportunityInputSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(2),
    description: z.string().default(""),
    problem: z.string().min(2),
    targetCustomer: z.string().default("General"),
    industry: z.string().default("General"),
    currentWorkflow: z.string().optional(),
    currentSolutions: z.string().optional(),
    whyInteresting: z.string().optional(),
    whyTheProblemMatters: z.string().optional(),
    economicImpact: z.string().optional(),
    marketSize: z.string().optional(),
    marketGap: z.string().optional(),
    aiOpportunity: z.string().optional(),
    aiFit: z.string().optional().default("MEDIUM"),

    aiPriority: aiPrioritySchema.optional().default("MEDIUM_POTENTIAL"),
    aiPriorityReasons: z.array(z.string()).optional().default([]),
    aiConfidence: aiConfidenceSchema.optional().default("MEDIUM"),
    researchScore: z.number().min(0).max(100).optional(),
    researchScoreFactors: researchScoreFactorsSchema.partial().optional(),
    evidenceStrength: evidenceStrengthSchema.optional().default("MEDIUM"),

    myDecision: myDecisionSchema.optional().default("UNDECIDED"),
    nextAction: z.string().optional().default(""),
    myThoughts: z.string().optional().default(""),

    mvpFeatures: z.array(z.string()).optional().default([]),
    excludedFeatures: z.array(z.string()).optional().default([]),
    monetizationModel: z.string().optional(),
    pricingIdea: z.string().optional(),
    distributionChannels: z.array(z.string()).optional().default([]),
    executionRisks: z
      .array(z.object({ risk: z.string(), mitigation: z.string() }))
      .optional()
      .default([]),

    validation: validationTrackingSchema.partial().optional(),
    competitors: z.array(competitorInfoSchema).optional().default([]),
    sources: z.array(opportunitySourceSchema).optional().default([]),
    notes: z.array(opportunityNoteSchema).optional().default([]),

    status: opportunityStatusSchema.optional().default("NEW"),
    isUserGenerated: z.boolean().optional(),
    createdBy: z.enum(["AI", "USER"]).optional(),
    source: z.string().optional().default("Hermes"),
    favorite: z.boolean().optional().default(false),
    saved: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
  })
  .passthrough();

export type CreateOpportunityInput = z.infer<typeof createOpportunityInputSchema>;
