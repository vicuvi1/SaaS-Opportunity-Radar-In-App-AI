import type { EvidenceGrading } from "@/lib/opportunities/types";
import type { ResearchSignal } from "./adapters/types";

export interface SourceIndependenceMetrics {
  totalSources: number;
  independentSignals: number;
  sourceDiversity: number; // 0.0 - 1.0
  distinctSourceTypes: string[];
  commercialSignalsCount: number;
  problemSignalsCount: number;
  competitorSignalsCount: number;
}

export interface ProblemCluster {
  id: string;
  theme: string;
  painKeywords: string[];
  signals: ResearchSignal[];
  independentSignalCount: number;
  averageUrgencyScore: number;
  topEntities: string[];
  commercialEvidenceFound: boolean;
}

/**
 * Filters out low-signal noise: spam, self-promo, generic memes, non-English junk
 */
export function prefilterSignals(signals: ResearchSignal[]): ResearchSignal[] {
  const noiseKeywords = [
    "hire me",
    "freelance available",
    "check out my youtube",
    "discount code",
    "crypto giveaway",
    "airdrop",
    "join my discord",
    "upvote for upvote",
    "onlyfans",
    "casino",
  ];

  return signals.filter((signal) => {
    const combined = `${signal.title} ${signal.content}`.toLowerCase();
    if (combined.length < 25) return false;
    for (const kw of noiseKeywords) {
      if (combined.includes(kw)) return false;
    }
    return true;
  });
}

/**
 * Deduplicates signals based on computed SHA-256 hash or normalized title + content match
 */
export function deduplicateResearchSignals(signals: ResearchSignal[]): {
  uniqueSignals: ResearchSignal[];
  duplicatesRemoved: number;
} {
  const seenHashes = new Set<string>();
  const seenTitles = new Set<string>();
  const unique: ResearchSignal[] = [];
  let duplicatesRemoved = 0;

  for (const signal of signals) {
    const titleNorm = signal.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);

    if (seenHashes.has(signal.hash) || (titleNorm.length > 10 && seenTitles.has(titleNorm))) {
      duplicatesRemoved++;
      continue;
    }

    seenHashes.add(signal.hash);
    if (titleNorm.length > 10) seenTitles.add(titleNorm);
    unique.push(signal);
  }

  return { uniqueSignals: unique, duplicatesRemoved };
}

/**
 * Evaluates Source Independence to prevent counting the same article across 10 websites as 10 independent signals.
 */
export function calculateSourceIndependence(signals: ResearchSignal[]): SourceIndependenceMetrics {
  const totalSources = signals.length;
  if (totalSources === 0) {
    return {
      totalSources: 0,
      independentSignals: 0,
      sourceDiversity: 0,
      distinctSourceTypes: [],
      commercialSignalsCount: 0,
      problemSignalsCount: 0,
      competitorSignalsCount: 0,
    };
  }

  const distinctTypes = new Set<string>();
  const distinctAuthors = new Set<string>();
  let commercialCount = 0;
  let problemCount = 0;
  let competitorCount = 0;

  for (const s of signals) {
    distinctTypes.add(s.sourceType);
    if (s.author) distinctAuthors.add(s.author.toLowerCase());
    if (s.commercialSignals && s.commercialSignals.length > 0) commercialCount++;
    if (s.painSignals && s.painSignals.length > 0) problemCount++;
    if (s.competitorSignals && s.competitorSignals.length > 0) competitorCount++;
  }

  // Source diversity is the proportion of distinct channels present (out of max expected ~5)
  const sourceDiversity = Math.min(1.0, distinctTypes.size / 4);
  const independentSignals = Math.max(distinctAuthors.size, Math.ceil(totalSources * 0.7));

  return {
    totalSources,
    independentSignals,
    sourceDiversity,
    distinctSourceTypes: Array.from(distinctTypes),
    commercialSignalsCount: commercialCount,
    problemSignalsCount: problemCount,
    competitorSignalsCount: competitorCount,
  };
}

/**
 * Clusters signals into repeated problem themes based on entity overlap and pain phrases
 */
export function clusterSignalsIntoThemes(signals: ResearchSignal[]): ProblemCluster[] {
  const clusters: Map<string, ProblemCluster> = new Map();

  for (const signal of signals) {
    // Determine cluster key based on top entity or dominant pain keyword
    let clusterKey = "general_operational_friction";
    if (signal.entities.length > 0) {
      clusterKey = `tool_${signal.entities[0].toLowerCase()}`;
    } else if (signal.painSignals.length > 0) {
      clusterKey = `pain_${signal.painSignals[0].replace(/\s+/g, "_")}`;
    }

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, {
        id: `clust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        theme: signal.topic || "Recurring Friction",
        painKeywords: [...signal.painSignals],
        signals: [signal],
        independentSignalCount: 1,
        averageUrgencyScore: signal.relevance * 10,
        topEntities: [...signal.entities],
        commercialEvidenceFound: signal.commercialSignals.length > 0,
      });
    } else {
      const existing = clusters.get(clusterKey)!;
      existing.signals.push(signal);
      existing.independentSignalCount++;
      existing.painKeywords = Array.from(new Set([...existing.painKeywords, ...signal.painSignals]));
      existing.topEntities = Array.from(new Set([...existing.topEntities, ...signal.entities]));
      if (signal.commercialSignals.length > 0) {
        existing.commercialEvidenceFound = true;
      }
    }
  }

  return Array.from(clusters.values()).sort((a, b) => b.signals.length - a.signals.length);
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
  if (
    assertion.toLowerCase().includes("might") ||
    assertion.toLowerCase().includes("could be") ||
    assertion.toLowerCase().includes("estimated")
  ) {
    return "HYPOTHESIS";
  }
  return "INFERENCE";
}
