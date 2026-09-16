/**
 * Multi-Source Query Planner
 * Adapted from IdeaGo query_planning.py & CrowdMind pain-phrase heuristics
 * Supporting 20+ specialized industries and multi-adapter query formulation.
 */

export interface PlannedQuery {
  source: "reddit" | "hackernews" | "github" | "producthunt" | "web" | "reviews";
  query: string;
  subreddits?: string[];
  intent: "pain_discovery" | "competitor_complaint" | "workaround_hunting" | "feature_request" | "pricing_research";
}

export const CROWDMIND_PAIN_PATTERNS = [
  "I wish there was",
  "why isn't there an app for",
  "frustrated with",
  "alternative to",
  "too expensive",
  "wasting hours on",
  "manual process",
  "is there a tool that",
  "hate using",
  "nightmare to manage",
  "broken integration",
  "can anyone recommend",
];

export const INDUSTRY_TAXONOMY: Record<string, { label: string; subreddits: string[]; keywords: string[] }> = {
  ai: {
    label: "Artificial Intelligence",
    subreddits: ["ArtificialInteligence", "MachineLearning", "LocalLLaMA", "ChatGPT", "ClaudeAI"],
    keywords: ["rag", "llm hallucinations", "evals", "vector db", "prompting bottleneck", "gpu cost"],
  },
  cybersecurity: {
    label: "Cybersecurity",
    subreddits: ["netsec", "cybersecurity", "sysadmin", "salesengineering"],
    keywords: ["soc 2", "vendor risk", "questionnaire", "siem alert fatigue", "iso 27001", "access review"],
  },
  fintech: {
    label: "FinTech",
    subreddits: ["fintech", "financialindependence", "smallbusiness", "accounting"],
    keywords: ["reconciliation", "kyc delay", "cross-border payments", "chargeback fraud", "stripe dispute"],
  },
  healthcare: {
    label: "Healthcare",
    subreddits: ["healthIT", "medicine", "medicalschool", "healthcare"],
    keywords: ["credentialing", "prior authorization", "ehr integration", "caqh", "payer enrollment"],
  },
  realestate: {
    label: "Real Estate",
    subreddits: ["commercialrealestate", "RealEstate", "realtors", "proptech"],
    keywords: ["lease abstraction", "cam reconciliation", "escalation clause", "tenant screening", "yardi"],
  },
  education: {
    label: "Education",
    subreddits: ["edtech", "teachers", "highereducation", "elearning"],
    keywords: ["lms integration", "grading workload", "student engagement", "scorm compliance"],
  },
  marketing: {
    label: "Marketing",
    subreddits: ["marketing", "SEO", "PPC", "content_marketing", "socialmedia"],
    keywords: ["attribution modeling", "ad spend waste", "competitor ad copy", "influencer outreach", "crm sync"],
  },
  sales: {
    label: "Sales",
    subreddits: ["sales", "salesengineering", "coldemail", "b2b"],
    keywords: ["deliverability", "rfp response", "lead enrichment", "demo prep", "crm hygiene"],
  },
  hr: {
    label: "Human Resources",
    subreddits: ["humanresources", "AskHR", "peopleops", "recruitinghell"],
    keywords: ["onboarding dropoff", "compliance audit", "performance review bias", "benefits admin"],
  },
  recruiting: {
    label: "Recruiting",
    subreddits: ["recruiting", "recruitinghell", "technicalrecruiting"],
    keywords: ["take-home grading", "resume screening spam", "interview scheduling", "candidate ghosting"],
  },
  accounting: {
    label: "Accounting",
    subreddits: ["accounting", "tax", "bookkeeping", "smallbusiness"],
    keywords: ["month-end close", "intercompany", "sales tax nexus", "receipt matching", "quickbooks bug"],
  },
  legal: {
    label: "Legal",
    subreddits: ["lawyers", "legaltech", "paralegal"],
    keywords: ["contract redlining", "discovery review", "billing compliance", "matter management"],
  },
  logistics: {
    label: "Logistics",
    subreddits: ["supplychain", "logistics", "freightbrokers", "warehousing"],
    keywords: ["freight tracking", "customs clearance delay", "demurrage fees", "bol scanning"],
  },
  manufacturing: {
    label: "Manufacturing",
    subreddits: ["manufacturing", "industrialengineering", "qualityassurance"],
    keywords: ["preventative maintenance", "downtime logging", "bom error", "supplier lead time"],
  },
  ecommerce: {
    label: "E-commerce",
    subreddits: ["ecommerce", "shopify", "FulfillmentByAmazon", "dropship"],
    keywords: ["return fraud", "chargeback rate", "shopify app bloat", "cart abandonment", "inventory sync"],
  },
  devtools: {
    label: "Developer Tools",
    subreddits: ["webdev", "devops", "kubernetes", "programming", "reactjs"],
    keywords: ["pr preview environment", "flaky tests", "ci cd bottlenecks", "mock data", "api rate limit"],
  },
  operations: {
    label: "Operations",
    subreddits: ["operations", "projectmanagement", "productivity", "management"],
    keywords: ["sop drift", "ticket escalation", "knowledge silo", "manual spreadsheet slog"],
  },
  construction: {
    label: "Construction",
    subreddits: ["construction", "generalcontractor", "civilengineering"],
    keywords: ["change order dispute", "subcontractor scheduling", "lien waiver tracking", "punch list"],
  },
  hospitality: {
    label: "Hospitality",
    subreddits: ["restaurantowners", "hotel", "hospitality"],
    keywords: ["shift cover no-shows", "pos migration", "food waste inventory", "review response burnout"],
  },
  professionalservices: {
    label: "Professional Services",
    subreddits: ["consulting", "freelance", "agencies", "smallbusiness"],
    keywords: ["scope creep", "unbilled client hours", "retainer tracking", "proposal drafting"],
  },
  general: {
    label: "General B2B SaaS",
    subreddits: ["SaaS", "startups", "Entrepreneur", "smallbusiness"],
    keywords: ["churn reduction", "pricing model", "feature bloat", "manual workaround", "spreadsheet"],
  },
};

export function resolveIndustryProfile(topicOrIndustry: string) {
  const norm = topicOrIndustry.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, profile] of Object.entries(INDUSTRY_TAXONOMY)) {
    if (norm.includes(key) || profile.label.toLowerCase().replace(/[^a-z0-9]/g, "").includes(norm)) {
      return { key, ...profile };
    }
  }
  return { key: "general", ...INDUSTRY_TAXONOMY.general };
}

export function planResearchQueries(
  topicOrDomain: string,
  depth: "quick" | "standard" | "deep" = "standard",
): PlannedQuery[] {
  const cleanDomain = topicOrDomain.trim().toLowerCase();
  const profile = resolveIndustryProfile(cleanDomain);
  const queries: PlannedQuery[] = [];

  // 1. Reddit: Pain discovery & competitor complaints
  queries.push({
    source: "reddit",
    query: `${cleanDomain} "I wish there was" OR "frustrated with" OR "alternative to"`,
    subreddits: profile.subreddits,
    intent: "pain_discovery",
  });

  if (depth === "standard" || depth === "deep") {
    queries.push({
      source: "reddit",
      query: `${cleanDomain} "too expensive" OR "wasting hours" OR "manual process"`,
      subreddits: profile.subreddits,
      intent: "workaround_hunting",
    });
  }

  // 2. Hacker News: Technical friction & real complaints
  queries.push({
    source: "hackernews",
    query: `${cleanDomain} pain OR "I wish" OR "too expensive" OR "broken"`,
    intent: "pain_discovery",
  });

  if (depth === "deep") {
    queries.push({
      source: "hackernews",
      query: `Ask HN ${cleanDomain}`,
      intent: "workaround_hunting",
    });
  }

  // 3. GitHub: Issues, feature requests, missing integrations
  queries.push({
    source: "github",
    query: `${cleanDomain} "feature request" OR "workaround" OR "need integration"`,
    intent: "feature_request",
  });

  // 4. Product Hunt: Category landscape & competitors
  queries.push({
    source: "producthunt",
    query: cleanDomain,
    intent: "competitor_complaint",
  });

  // 5. Web Search (Tavily / Exa / Web): Market research, competitor pricing, customer complaints
  queries.push({
    source: "web",
    query: `${cleanDomain} software competitor complaints pricing "too expensive"`,
    intent: "pricing_research",
  });

  if (depth === "deep") {
    queries.push({
      source: "web",
      query: `${cleanDomain} industry pain points manual workflow bottleneck`,
      intent: "pain_discovery",
    });
  }

  return queries;
}
