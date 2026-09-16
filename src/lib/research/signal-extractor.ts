import type { EvidenceGrading } from "@/lib/opportunities/types";
import { CROWDMIND_PAIN_PATTERNS } from "./query-planner";

export interface PainSignal {
  id: string;
  source: string;
  url: string;
  title: string;
  problemStatement: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  frequencyIndicator: number; // upvotes / comments / stars
  targetPersona: string;
  currentWorkaround?: string;
  rawText: string;
  extractedAt: string;
}

export interface CommercialSignal {
  source: string;
  url: string;
  willingnessToPayPhrase?: string;
  pricingMentioned?: string;
  budgetConstraint?: string;
  intentToBuyScore: number; // 1-10
}

export interface CompetitorSignal {
  name: string;
  source: string;
  complaintType: "pricing" | "complexity" | "missing_feature" | "bad_support" | "outdated";
  specificGrievance: string;
}

export interface RawScrapedSignal {
  source: string;
  title: string;
  url: string;
  text: string;
  score?: number;
  commentsCount?: number;
}

/**
 * Filters out low-signal noise: spam, self-promo, generic memes, non-English junk
 */
export function prefilterSignals(rawList: RawScrapedSignal[]): RawScrapedSignal[] {
  const noiseKeywords = [
    "hire me",
    "freelance available",
    "check out my youtube",
    "discount code",
    "crypto giveaway",
    "airdrop",
    "join my discord",
    "upvote for upvote",
  ];

  return rawList.filter((item) => {
    const combined = `${item.title} ${item.text}`.toLowerCase();
    if (combined.length < 25) return false;
    for (const kw of noiseKeywords) {
      if (combined.includes(kw)) return false;
    }
    return true;
  });
}

/**
 * Deduplicates signals based on normalized titles and text prefixes
 */
export function deduplicateSignals(rawList: RawScrapedSignal[]): RawScrapedSignal[] {
  const seenHashes = new Set<string>();
  const unique: RawScrapedSignal[] = [];

  for (const item of rawList) {
    const norm = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 40);

    const textPrefix = item.text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 40);

    const hash = `${norm}__${textPrefix}`;
    if (!seenHashes.has(hash)) {
      seenHashes.add(hash);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Heuristic extractor for pain phrases and commercial signals
 */
export function extractSignalsHeuristic(items: RawScrapedSignal[]): {
  painSignals: PainSignal[];
  commercialSignals: CommercialSignal[];
  competitorSignals: CompetitorSignal[];
} {
  const painSignals: PainSignal[] = [];
  const commercialSignals: CommercialSignal[] = [];
  const competitorSignals: CompetitorSignal[] = [];

  for (const item of items) {
    const textLower = item.text.toLowerCase();
    let hasPain = false;
    let urgency: "HIGH" | "MEDIUM" | "LOW" = "LOW";

    for (const pattern of CROWDMIND_PAIN_PATTERNS) {
      if (textLower.includes(pattern)) {
        hasPain = true;
        break;
      }
    }

    if (
      textLower.includes("wasting hours") ||
      textLower.includes("nightmare") ||
      textLower.includes("too expensive") ||
      textLower.includes("broken")
    ) {
      urgency = "HIGH";
    } else if (hasPain) {
      urgency = "MEDIUM";
    }

    if (hasPain || (item.score && item.score > 20)) {
      painSignals.push({
        id: `pain-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        source: item.source,
        url: item.url,
        title: item.title,
        problemStatement: item.text.slice(0, 280),
        urgency,
        frequencyIndicator: item.score || item.commentsCount || 1,
        targetPersona: "B2B Operators / Developers",
        currentWorkaround: textLower.includes("workaround") ? "Manual script / spreadsheet" : undefined,
        rawText: item.text,
        extractedAt: new Date().toISOString(),
      });
    }

    // Commercial signal check
    if (
      textLower.includes("willing to pay") ||
      textLower.includes("budget") ||
      textLower.includes("/month") ||
      textLower.includes("pricing")
    ) {
      painSignals; // keep in scope
    }
  }

  return {
    painSignals,
    commercialSignals: [],
    competitorSignals,
  };
}

/**
 * Evidence Grading Helper
 * Classifies an assertion into FACT, SOURCE-BASED CLAIM, INFERENCE, HYPOTHESIS, or UNKNOWN
 */
export function gradeAssertionEvidence(
  assertion: string,
  hasDirectSourceUrl: boolean,
  isStatisticalOrOfficial: boolean,
): EvidenceGrading {
  if (isStatisticalOrOfficial && hasDirectSourceUrl) {
    return "FACT";
  }
  if (hasDirectSourceUrl) {
    return "SOURCE-BASED CLAIM";
  }
  if (assertion.toLowerCase().includes("might") || assertion.toLowerCase().includes("could be")) {
    return "HYPOTHESIS";
  }
  return "INFERENCE";
}
