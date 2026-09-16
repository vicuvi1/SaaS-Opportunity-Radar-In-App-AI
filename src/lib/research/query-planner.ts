/**
 * Multi-source Query Planner
 * Adapted from IdeaGo query_planning.py & CrowdMind pain-phrase heuristics
 */

export interface PlannedQuery {
  source: "reddit" | "hackernews" | "github" | "stackoverflow" | "producthunt";
  query: string;
  subreddits?: string[];
  intent: "pain_discovery" | "competitor_complaint" | "workaround_hunting" | "feature_request";
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
];

export const NICHE_SUBREDDITS: Record<string, string[]> = {
  devops: ["devops", "sysadmin", "aws", "kubernetes"],
  developer: ["webdev", "reactjs", "programming", "node", "typescript"],
  saas: ["SaaS", "Entrepreneur", "startups", "smallbusiness"],
  marketing: ["marketing", "SEO", "content_marketing", "socialmedia"],
  sales: ["sales", "salesforce", "coldemail", "b2b"],
  finance: ["financialindependence", "accounting", "bookkeeping", "smallbusiness"],
  ai: ["ArtificialInteligence", "MachineLearning", "LocalLLaMA", "ChatGPT"],
  general: ["SaaS", "startups", "Entrepreneur", "productivity"],
};

export function planResearchQueries(topicOrDomain: string, depth: "quick" | "deep" = "quick"): PlannedQuery[] {
  const cleanDomain = topicOrDomain.trim().toLowerCase();
  const queries: PlannedQuery[] = [];

  // Determine relevant subreddits
  let matchedSubs = NICHE_SUBREDDITS.general;
  for (const [key, subs] of Object.entries(NICHE_SUBREDDITS)) {
    if (cleanDomain.includes(key)) {
      matchedSubs = subs;
      break;
    }
  }

  // 1. Reddit: Pain discovery & competitor alternatives
  queries.push({
    source: "reddit",
    query: `${cleanDomain} "I wish there was" OR "frustrated with" OR "alternative to"`,
    subreddits: matchedSubs,
    intent: "pain_discovery",
  });

  if (depth === "deep") {
    queries.push({
      source: "reddit",
      query: `${cleanDomain} "too expensive" OR "wasting hours" OR "manual workflow"`,
      subreddits: matchedSubs,
      intent: "workaround_hunting",
    });
  }

  // 2. Hacker News: Ask HN & comments
  queries.push({
    source: "hackernews",
    query: `${cleanDomain} pain OR "I wish" OR "too expensive"`,
    intent: "pain_discovery",
  });

  if (depth === "deep") {
    queries.push({
      source: "hackernews",
      query: `Ask HN ${cleanDomain}`,
      intent: "workaround_hunting",
    });
  }

  // 3. GitHub: Issues & feature requests
  queries.push({
    source: "github",
    query: `${cleanDomain} "feature request" OR "workaround"`,
    intent: "feature_request",
  });

  // 4. Product Hunt: Incumbent identification
  queries.push({
    source: "producthunt",
    query: cleanDomain,
    intent: "competitor_complaint",
  });

  // 5. Stack Overflow (for tech/devops domains or deep depth)
  if (depth === "deep" || cleanDomain.includes("dev") || cleanDomain.includes("api") || cleanDomain.includes("data")) {
    queries.push({
      source: "stackoverflow",
      query: `${cleanDomain} automated OR workaround OR "manual process"`,
      intent: "workaround_hunting",
    });
  }

  return queries;
}
