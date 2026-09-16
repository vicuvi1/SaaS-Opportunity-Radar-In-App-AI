export type OpportunityStatus =
  | "NEW"
  | "REVIEW"
  | "DEEP_RESEARCH"
  | "SHORTLIST"
  | "REJECTED"
  | "ARCHIVED";

export type AiPriority =
  | "HIGH_POTENTIAL"
  | "MEDIUM_POTENTIAL"
  | "LOW_POTENTIAL"
  | "VERY_LOW_PRIORITY"
  | "CRITICAL_REVIEW";

export type AiConfidence = "HIGH" | "MEDIUM" | "LOW";

export type EvidenceStrength = "HIGH" | "MEDIUM" | "LOW";

export type MyDecision =
  | "UNDECIDED"
  | "INTERESTED"
  | "SHORTLISTED"
  | "REJECTED";

export type EvidenceGrading =
  | "FACT"
  | "SOURCE_BASED_CLAIM"
  | "SOURCE-BASED CLAIM"
  | "INFERENCE"
  | "HYPOTHESIS"
  | "UNKNOWN";

export type ResearchScoreFactors = {
  problemSeverity: number; // 0-10
  problemFrequency: number; // 0-10
  economicValue: number; // 0-10
  willingnessToPay: number; // 0-10
  marketOpportunity: number; // 0-10
  competitionGap: number; // 0-10
  aiFit: number; // 0-10
  technicalFeasibility: number; // 0-10
  distributionPotential: number; // 0-10
  evidenceStrength: number; // 0-10
};

export type OpportunityNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

export type OpportunitySource = {
  id: string;
  title: string;
  url: string;
  sourceType: "reddit" | "hackernews" | "github" | "stackoverflow" | "producthunt" | "web" | "hermes" | "manual" | string;
  date?: string;
  summary?: string;
  evidenceRelevance?: string;
  grading: EvidenceGrading;
};

export type CompetitorInfo = {
  name: string;
  url?: string;
  pricing?: string;
  strengths?: string[];
  weaknesses?: string[];
  gap?: string;
};

export type ValidationTracking = {
  interviewsCount: number;
  interestedCustomersCount: number;
  waitlistCount: number;
  landingPageResults?: string;
  pricingExperiments?: string;
  feedback?: string;
  assumptions: string[];
  risks: string[];
  validationQuestions: string[];
};

export type Opportunity = {
  id: string; // e.g. "opp-001" or uuid
  title: string;
  description: string;
  problem: string;
  targetCustomer: string;
  industry: string;
  currentWorkflow?: string;
  currentSolutions?: string;
  whyInteresting?: string;
  whyTheProblemMatters?: string;
  economicImpact?: string;
  marketSize?: string;
  marketGap?: string;
  aiOpportunity?: string;
  aiFit?: "HIGH" | "MEDIUM" | "LOW" | string;
  
  // Scoring & AI Assessment
  aiPriority: AiPriority;
  aiPriorityReasons: string[];
  whyThisOpportunity?: string[];
  aiConfidence: AiConfidence;
  researchScore: number; // 0-100
  researchScoreFactors: ResearchScoreFactors;
  evidenceStrength: EvidenceStrength;

  // Personal Decision Gate (NEVER changed by AI)
  myDecision: MyDecision;
  nextAction: string;
  myThoughts?: string; // Larger Markdown notes

  // MVP & Business Strategy
  mvpFeatures?: string[];
  excludedFeatures?: string[];
  monetizationModel?: string;
  pricingIdea?: string;
  distributionChannels?: string[];
  executionRisks?: Array<{ risk: string; mitigation: string }>;

  // Tracking & Evidence
  validation: ValidationTracking;
  competitors: CompetitorInfo[];
  sources: OpportunitySource[];
  notes: OpportunityNote[];

  // Meta & State
  status: OpportunityStatus;
  isNewDiscovery?: boolean; // true = held in Daily New Discoveries Inbox
  researchRunId?: string;
  isUserGenerated: boolean; // true = MY IDEA, false = AI DISCOVERED
  createdBy: "AI" | "USER";
  source: "Hermes" | "IdeaForge" | "Manual" | string;
  favorite: boolean;
  saved: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
