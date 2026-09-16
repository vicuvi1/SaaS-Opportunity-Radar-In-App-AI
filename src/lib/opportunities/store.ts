import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  opportunitiesTable,
  opportunityNotesTable,
  opportunitySourcesTable,
} from "@/lib/db/schema";
import type {
  AiConfidence,
  AiPriority,
  MyDecision,
  Opportunity,
  OpportunityNote,
  OpportunitySource,
  OpportunityStatus,
  ResearchScoreFactors,
} from "./types";

function calculateTotalScore(factors: Partial<ResearchScoreFactors>): number {
  const defaults: ResearchScoreFactors = {
    problemSeverity: 5,
    problemFrequency: 5,
    economicValue: 5,
    willingnessToPay: 5,
    marketOpportunity: 5,
    competitionGap: 5,
    aiFit: 5,
    technicalFeasibility: 5,
    distributionPotential: 5,
    evidenceStrength: 5,
  };
  const merged = { ...defaults, ...factors };
  const sum =
    merged.problemSeverity +
    merged.problemFrequency +
    merged.economicValue +
    merged.willingnessToPay +
    merged.marketOpportunity +
    merged.competitionGap +
    merged.aiFit +
    merged.technicalFeasibility +
    merged.distributionPotential +
    merged.evidenceStrength;
  return Math.min(100, Math.max(0, sum));
}

export function deriveAiPriorityFromScore(score: number): AiPriority {
  if (score >= 80) return "HIGH_POTENTIAL";
  if (score >= 60) return "MEDIUM_POTENTIAL";
  if (score >= 40) return "LOW_POTENTIAL";
  return "VERY_LOW_PRIORITY";
}

function safeParseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function rowToOpportunity(
  row: typeof opportunitiesTable.$inferSelect,
  notes: OpportunityNote[] = [],
): Opportunity {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    problem: row.problem || "",
    targetCustomer: row.targetCustomer || "",
    industry: row.industry || "",
    currentWorkflow: row.currentWorkflow || "",
    currentSolutions: row.currentSolutions || "",
    whyInteresting: row.whyInteresting || "",
    whyTheProblemMatters: row.whyTheProblemMatters || "",
    economicImpact: row.economicImpact || "",
    marketSize: row.marketSize || "",
    marketGap: row.marketGap || "",
    aiOpportunity: row.aiOpportunity || "",
    aiFit: (row.aiFit as any) || "MEDIUM",
    aiPriority: (row.aiPriority as AiPriority) || "MEDIUM_POTENTIAL",
    aiPriorityReasons: safeParseJson<string[]>(row.aiPriorityReasons, []),
    aiConfidence: (row.aiConfidence as AiConfidence) || "MEDIUM",
    researchScore: row.researchScore ?? 50,
    researchScoreFactors: safeParseJson<ResearchScoreFactors>(row.researchScoreFactors, {
      problemSeverity: 5,
      problemFrequency: 5,
      economicValue: 5,
      willingnessToPay: 5,
      marketOpportunity: 5,
      competitionGap: 5,
      aiFit: 5,
      technicalFeasibility: 5,
      distributionPotential: 5,
      evidenceStrength: 5,
    }),
    evidenceStrength: (row.evidenceStrength as any) || "MEDIUM",
    myDecision: (row.myDecision as MyDecision) || "UNDECIDED",
    nextAction: row.nextAction || "",
    myThoughts: row.myThoughts || "",
    mvpFeatures: safeParseJson<string[]>(row.mvpFeatures, []),
    excludedFeatures: safeParseJson<string[]>(row.excludedFeatures, []),
    monetizationModel: row.monetizationModel || "",
    pricingIdea: row.pricingIdea || "",
    distributionChannels: safeParseJson<string[]>(row.distributionChannels, []),
    executionRisks: safeParseJson<Array<{ risk: string; mitigation: string }>>(
      row.executionRisks,
      [],
    ),
    validation: safeParseJson(row.validation, {
      interviewsCount: 0,
      interestedCustomersCount: 0,
      waitlistCount: 0,
      assumptions: [],
      risks: [],
      validationQuestions: [],
    }),
    competitors: safeParseJson(row.competitors, []),
    sources: safeParseJson<OpportunitySource[]>(row.sources, []),
    notes,
    status: row.status as OpportunityStatus,
    isNewDiscovery: Boolean(row.isNewDiscovery),
    researchRunId: (row as any).researchRunId || undefined,
    whyThisOpportunity: (() => {
      const parsed = safeParseJson<string[]>((row as any).whyThisOpportunity, []);
      if (parsed && parsed.length > 0) return parsed;
      const synthesized: string[] = [];
      const sourcesCount = safeParseJson<OpportunitySource[]>(row.sources, []).length;
      if (sourcesCount > 0) synthesized.push(`${sourcesCount} verified demand signals`);
      if (row.aiFit === "HIGH") synthesized.push("Strong AI fit");
      if (row.evidenceStrength === "HIGH") synthesized.push("High evidence confidence");
      if (row.marketGap) synthesized.push("Unaddressed competitor gap");
      if (row.economicImpact) synthesized.push("Clear recurring economic loss");
      return synthesized.length > 0 ? synthesized : ["Strong recurring pain", "High AI fit"];
    })(),
    isUserGenerated: Boolean(row.isUserGenerated),
    createdBy: (row.createdBy as "AI" | "USER") || "AI",
    source: row.source || "Discovery",
    favorite: Boolean(row.favorite),
    saved: Boolean(row.saved),
    tags: safeParseJson<string[]>(row.tags, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── Store API ───────────────────────────────────────────────────────────────

export type OpportunityFilters = {
  status?: string;
  isNewDiscovery?: boolean;
  researchRunId?: string;
  aiPriority?: string;
  aiConfidence?: string;
  industry?: string;
  search?: string;
  favorite?: boolean;
  saved?: boolean;
  isUserGenerated?: boolean;
  sortBy?: string;
};

export const opportunityStore = {
  async list(filters?: OpportunityFilters): Promise<Opportunity[]> {
    try {
      const rows = db.select().from(opportunitiesTable).all();

      // Fetch all notes mapped by opportunityId
      const allNotes = db
        .select()
        .from(opportunityNotesTable)
        .orderBy(desc(opportunityNotesTable.createdAt))
        .all();

      const notesMap = new Map<string, OpportunityNote[]>();
      for (const note of allNotes) {
        const existing = notesMap.get(note.opportunityId) || [];
        existing.push({
          id: note.id,
          content: note.content,
          createdAt: note.createdAt,
        });
        notesMap.set(note.opportunityId, existing);
      }

      let items = rows.map((r) => rowToOpportunity(r, notesMap.get(r.id) || []));

      // Apply filtering
      if (filters) {
        if (typeof filters.isNewDiscovery === "boolean") {
          items = items.filter((o) => o.isNewDiscovery === filters.isNewDiscovery);
        }
        if (filters.researchRunId) {
          items = items.filter((o) => o.researchRunId === filters.researchRunId);
        }
        if (filters.status) {
          items = items.filter((o) => o.status === filters.status);
        }
        if (filters.aiPriority) {
          items = items.filter((o) => o.aiPriority === filters.aiPriority);
        }
        if (filters.aiConfidence) {
          items = items.filter((o) => o.aiConfidence === filters.aiConfidence);
        }
        if (filters.industry) {
          items = items.filter(
            (o) => o.industry.toLowerCase() === filters.industry?.toLowerCase(),
          );
        }
        if (typeof filters.favorite === "boolean") {
          items = items.filter((o) => o.favorite === filters.favorite);
        }
        if (typeof filters.saved === "boolean") {
          items = items.filter((o) => o.saved === filters.saved);
        }
        if (typeof filters.isUserGenerated === "boolean") {
          items = items.filter((o) => o.isUserGenerated === filters.isUserGenerated);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase().trim();
          items = items.filter((o) => {
            return (
              o.title.toLowerCase().includes(q) ||
              o.problem.toLowerCase().includes(q) ||
              o.targetCustomer.toLowerCase().includes(q) ||
              o.industry.toLowerCase().includes(q) ||
              (o.tags && o.tags.some((t) => t.toLowerCase().includes(q))) ||
              (o.myThoughts && o.myThoughts.toLowerCase().includes(q)) ||
              (o.notes && o.notes.some((n) => n.content.toLowerCase().includes(q)))
            );
          });
        }

        // Sorting
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case "score-desc":
              items.sort((a, b) => b.researchScore - a.researchScore);
              break;
            case "priority-desc": {
              const rank: Record<AiPriority, number> = {
                HIGH_POTENTIAL: 5,
                MEDIUM_POTENTIAL: 4,
                CRITICAL_REVIEW: 3,
                LOW_POTENTIAL: 2,
                VERY_LOW_PRIORITY: 1,
              };
              items.sort((a, b) => (rank[b.aiPriority] ?? 0) - (rank[a.aiPriority] ?? 0));
              break;
            }
            case "newest":
              items.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );
              break;
            case "oldest":
              items.sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
              break;
            case "evidence-desc": {
              const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
              items.sort(
                (a, b) =>
                  (rank[b.evidenceStrength as keyof typeof rank] ?? 0) -
                  (rank[a.evidenceStrength as keyof typeof rank] ?? 0),
              );
              break;
            }
            case "updated":
            default:
              items.sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
              );
              break;
          }
        } else {
          // Default newest/updated first
          items.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
        }
      }

      return items;
    } catch (err) {
      console.error("[opportunity-store] Error in list():", err);
      return [];
    }
  },

  async get(id: string): Promise<Opportunity | null> {
    try {
      const row = db
        .select()
        .from(opportunitiesTable)
        .where(eq(opportunitiesTable.id, id))
        .get();

      if (!row) return null;

      const notes = db
        .select()
        .from(opportunityNotesTable)
        .where(eq(opportunityNotesTable.opportunityId, id))
        .orderBy(desc(opportunityNotesTable.createdAt))
        .all()
        .map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt,
        }));

      return rowToOpportunity(row, notes);
    } catch (err) {
      console.error(`[opportunity-store] Error in get(${id}):`, err);
      return null;
    }
  },

  async create(input: Partial<Opportunity>): Promise<Opportunity> {
    const now = new Date().toISOString();
    const id =
      input.id ||
      `opp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const factors: ResearchScoreFactors = {
      problemSeverity: 5,
      problemFrequency: 5,
      economicValue: 5,
      willingnessToPay: 5,
      marketOpportunity: 5,
      competitionGap: 5,
      aiFit: 5,
      technicalFeasibility: 5,
      distributionPotential: 5,
      evidenceStrength: 5,
      ...(input.researchScoreFactors ?? {}),
    };

    const calculatedScore =
      typeof input.researchScore === "number"
        ? input.researchScore
        : calculateTotalScore(factors);

    const isUserGenerated =
      typeof input.isUserGenerated === "boolean"
        ? input.isUserGenerated
        : input.createdBy === "USER";

    // Newly discovered items go to inbox (isNewDiscovery = true) unless user created or explicit
    const isNewDiscovery =
      input.isNewDiscovery !== undefined
        ? input.isNewDiscovery
        : isUserGenerated
          ? false
          : true;

    const row: typeof opportunitiesTable.$inferInsert = {
      id,
      title: input.title || "Untitled Opportunity",
      description: input.description || "",
      problem: input.problem || "",
      targetCustomer: input.targetCustomer || "General",
      industry: input.industry || "General",
      currentWorkflow: input.currentWorkflow || "",
      currentSolutions: input.currentSolutions || "",
      whyInteresting: input.whyInteresting || "",
      whyTheProblemMatters: input.whyTheProblemMatters || "",
      economicImpact: input.economicImpact || "",
      marketSize: input.marketSize || "",
      marketGap: input.marketGap || "",
      aiOpportunity: input.aiOpportunity || "",
      aiFit: input.aiFit || "MEDIUM",
      aiPriority: input.aiPriority || deriveAiPriorityFromScore(calculatedScore),
      aiPriorityReasons: JSON.stringify(input.aiPriorityReasons || []),
      whyThisOpportunity: JSON.stringify(input.whyThisOpportunity || []),
      aiConfidence: input.aiConfidence || "MEDIUM",
      researchScore: calculatedScore,
      researchScoreFactors: JSON.stringify(factors),
      evidenceStrength: input.evidenceStrength || "MEDIUM",
      researchRunId: input.researchRunId || null,
      myDecision: input.myDecision || "UNDECIDED",
      nextAction: input.nextAction || "",
      myThoughts: input.myThoughts || "",
      mvpFeatures: JSON.stringify(input.mvpFeatures || []),
      excludedFeatures: JSON.stringify(input.excludedFeatures || []),
      monetizationModel: input.monetizationModel || "",
      pricingIdea: input.pricingIdea || "",
      distributionChannels: JSON.stringify(input.distributionChannels || []),
      executionRisks: JSON.stringify(input.executionRisks || []),
      validation: JSON.stringify(
        input.validation || {
          interviewsCount: 0,
          interestedCustomersCount: 0,
          waitlistCount: 0,
          assumptions: [],
          risks: [],
          validationQuestions: [],
        },
      ),
      competitors: JSON.stringify(input.competitors || []),
      sources: JSON.stringify(input.sources || []),
      status: input.status || "NEW",
      isNewDiscovery: isNewDiscovery ? 1 : 0,
      isUserGenerated: isUserGenerated ? 1 : 0,
      createdBy: input.createdBy || (isUserGenerated ? "USER" : "AI"),
      source: input.source || (isUserGenerated ? "Manual" : "Discovery"),
      favorite: input.favorite ? 1 : 0,
      saved: input.saved ? 1 : 0,
      tags: JSON.stringify(input.tags || []),
      createdAt: now,
      updatedAt: now,
    };

    db.insert(opportunitiesTable).values(row).run();

    // Insert notes if any
    if (input.notes && input.notes.length > 0) {
      for (const n of input.notes) {
        db.insert(opportunityNotesTable)
          .values({
            id: n.id || `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            opportunityId: id,
            content: n.content,
            createdAt: n.createdAt || now,
          })
          .run();
      }
    }

    return (await this.get(id))!;
  },

  async update(id: string, updates: Partial<Opportunity>): Promise<Opportunity | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const updatedScoreFactors = {
      ...existing.researchScoreFactors,
      ...(updates.researchScoreFactors ?? {}),
    };
    const updatedScore =
      typeof updates.researchScore === "number"
        ? updates.researchScore
        : updates.researchScoreFactors
          ? calculateTotalScore(updatedScoreFactors)
          : existing.researchScore;

    const valuesToUpdate: Partial<typeof opportunitiesTable.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.title !== undefined) valuesToUpdate.title = updates.title;
    if (updates.description !== undefined) valuesToUpdate.description = updates.description;
    if (updates.problem !== undefined) valuesToUpdate.problem = updates.problem;
    if (updates.targetCustomer !== undefined) valuesToUpdate.targetCustomer = updates.targetCustomer;
    if (updates.industry !== undefined) valuesToUpdate.industry = updates.industry;
    if (updates.currentWorkflow !== undefined) valuesToUpdate.currentWorkflow = updates.currentWorkflow;
    if (updates.currentSolutions !== undefined) valuesToUpdate.currentSolutions = updates.currentSolutions;
    if (updates.whyInteresting !== undefined) valuesToUpdate.whyInteresting = updates.whyInteresting;
    if (updates.whyTheProblemMatters !== undefined) valuesToUpdate.whyTheProblemMatters = updates.whyTheProblemMatters;
    if (updates.economicImpact !== undefined) valuesToUpdate.economicImpact = updates.economicImpact;
    if (updates.marketSize !== undefined) valuesToUpdate.marketSize = updates.marketSize;
    if (updates.marketGap !== undefined) valuesToUpdate.marketGap = updates.marketGap;
    if (updates.aiOpportunity !== undefined) valuesToUpdate.aiOpportunity = updates.aiOpportunity;
    if (updates.aiFit !== undefined) valuesToUpdate.aiFit = updates.aiFit;
    if (updates.aiPriority !== undefined) valuesToUpdate.aiPriority = updates.aiPriority;
    if (updates.aiPriorityReasons !== undefined) valuesToUpdate.aiPriorityReasons = JSON.stringify(updates.aiPriorityReasons);
    if (updates.aiConfidence !== undefined) valuesToUpdate.aiConfidence = updates.aiConfidence;
    if (updates.researchScoreFactors !== undefined || typeof updates.researchScore === "number") {
      valuesToUpdate.researchScore = updatedScore;
      valuesToUpdate.researchScoreFactors = JSON.stringify(updatedScoreFactors);
    }
    if (updates.evidenceStrength !== undefined) valuesToUpdate.evidenceStrength = updates.evidenceStrength;
    if (updates.myDecision !== undefined) valuesToUpdate.myDecision = updates.myDecision;
    if (updates.nextAction !== undefined) valuesToUpdate.nextAction = updates.nextAction;
    if (updates.myThoughts !== undefined) valuesToUpdate.myThoughts = updates.myThoughts;
    if (updates.mvpFeatures !== undefined) valuesToUpdate.mvpFeatures = JSON.stringify(updates.mvpFeatures);
    if (updates.excludedFeatures !== undefined) valuesToUpdate.excludedFeatures = JSON.stringify(updates.excludedFeatures);
    if (updates.monetizationModel !== undefined) valuesToUpdate.monetizationModel = updates.monetizationModel;
    if (updates.pricingIdea !== undefined) valuesToUpdate.pricingIdea = updates.pricingIdea;
    if (updates.distributionChannels !== undefined) valuesToUpdate.distributionChannels = JSON.stringify(updates.distributionChannels);
    if (updates.executionRisks !== undefined) valuesToUpdate.executionRisks = JSON.stringify(updates.executionRisks);
    if (updates.validation !== undefined) valuesToUpdate.validation = JSON.stringify(updates.validation);
    if (updates.competitors !== undefined) valuesToUpdate.competitors = JSON.stringify(updates.competitors);
    if (updates.sources !== undefined) valuesToUpdate.sources = JSON.stringify(updates.sources);
    if (updates.status !== undefined) valuesToUpdate.status = updates.status;
    if (updates.isNewDiscovery !== undefined) valuesToUpdate.isNewDiscovery = updates.isNewDiscovery ? 1 : 0;
    if (updates.isUserGenerated !== undefined) valuesToUpdate.isUserGenerated = updates.isUserGenerated ? 1 : 0;
    if (updates.favorite !== undefined) valuesToUpdate.favorite = updates.favorite ? 1 : 0;
    if (updates.saved !== undefined) valuesToUpdate.saved = updates.saved ? 1 : 0;
    if (updates.tags !== undefined) valuesToUpdate.tags = JSON.stringify(updates.tags);

    db.update(opportunitiesTable)
      .set(valuesToUpdate)
      .where(eq(opportunitiesTable.id, id))
      .run();

    return this.get(id);
  },

  async delete(id: string): Promise<boolean> {
    try {
      db.delete(opportunityNotesTable)
        .where(eq(opportunityNotesTable.opportunityId, id))
        .run();
      db.delete(opportunitySourcesTable)
        .where(eq(opportunitySourcesTable.opportunityId, id))
        .run();
      const res = db
        .delete(opportunitiesTable)
        .where(eq(opportunitiesTable.id, id))
        .run();
      return res.changes > 0;
    } catch (err) {
      console.error(`[opportunity-store] Error in delete(${id}):`, err);
      return false;
    }
  },

  async updateStatus(id: string, status: OpportunityStatus): Promise<Opportunity | null> {
    return this.update(id, { status });
  },

  async updatePriority(
    id: string,
    aiPriority: AiPriority,
    aiPriorityReasons?: string[],
    aiConfidence?: AiConfidence,
  ): Promise<Opportunity | null> {
    const updates: Partial<Opportunity> = { aiPriority };
    if (aiPriorityReasons) updates.aiPriorityReasons = aiPriorityReasons;
    if (aiConfidence) updates.aiConfidence = aiConfidence;
    return this.update(id, updates);
  },

  async keepDiscovery(id: string): Promise<Opportunity | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    return this.update(id, {
      isNewDiscovery: false,
      status: existing.status === "NEW" ? "REVIEW" : existing.status,
    });
  },

  async rejectDiscovery(id: string): Promise<Opportunity | null> {
    return this.update(id, {
      isNewDiscovery: false,
      status: "REJECTED",
      myDecision: "REJECTED",
    });
  },

  async bulkUpdateDecision(ids: string[], decision: MyDecision): Promise<number> {
    if (ids.length === 0) return 0;
    const now = new Date().toISOString();
    const res = db
      .update(opportunitiesTable)
      .set({ myDecision: decision, updatedAt: now })
      .where(inArray(opportunitiesTable.id, ids))
      .run();
    return res.changes;
  },

  async addNote(id: string, content: string): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    const newNoteId = `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const now = new Date().toISOString();

    db.insert(opportunityNotesTable)
      .values({
        id: newNoteId,
        opportunityId: id,
        content,
        createdAt: now,
      })
      .run();

    await this.update(id, {});
    return this.get(id);
  },

  async deleteNote(id: string, noteId: string): Promise<Opportunity | null> {
    db.delete(opportunityNotesTable)
      .where(eq(opportunityNotesTable.id, noteId))
      .run();
    await this.update(id, {});
    return this.get(id);
  },

  async addSource(id: string, source: OpportunitySource): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    const sourceId = source.id || `src-${Date.now().toString(36)}`;
    const newSource: OpportunitySource = {
      ...source,
      id: sourceId,
      grading: source.grading || "INFERENCE",
    };

    const sources = [...(opp.sources || []), newSource];

    db.insert(opportunitySourcesTable)
      .values({
        id: sourceId,
        opportunityId: id,
        title: source.title || "",
        url: source.url || "",
        sourceType: source.sourceType || "",
        date: source.date || "",
        summary: source.summary || "",
        claimSupported: source.evidenceRelevance || "",
        createdAt: new Date().toISOString(),
      })
      .run();

    return this.update(id, { sources });
  },

  async deleteSource(id: string, sourceId: string): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    db.delete(opportunitySourcesTable)
      .where(eq(opportunitySourcesTable.id, sourceId))
      .run();

    const sources = (opp.sources || []).filter((s) => s.id !== sourceId);
    return this.update(id, { sources });
  },
};
