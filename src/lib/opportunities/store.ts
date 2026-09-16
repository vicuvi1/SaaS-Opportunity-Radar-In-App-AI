import fs from "fs";
import path from "path";
import type {
  AiConfidence,
  AiPriority,
  Opportunity,
  OpportunityNote,
  OpportunitySource,
  OpportunityStatus,
  ResearchScoreFactors,
} from "./types";
import { INITIAL_DEMO_OPPORTUNITIES } from "./seed-data";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { createClient } from "@/lib/supabase/server";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "opportunities.json");

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

// ── Local File Persistence ──────────────────────────────────────────────────

function ensureDataFile(): Opportunity[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DEMO_OPPORTUNITIES, null, 2), "utf-8");
      return INITIAL_DEMO_OPPORTUNITIES;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Opportunity[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DEMO_OPPORTUNITIES, null, 2), "utf-8");
      return INITIAL_DEMO_OPPORTUNITIES;
    }
    return parsed;
  } catch (err) {
    console.error("[opportunity-store] Error reading local data file:", err);
    return INITIAL_DEMO_OPPORTUNITIES;
  }
}

function writeDataFile(items: Opportunity[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("[opportunity-store] Error writing local data file:", err);
  }
}

// ── Store API ───────────────────────────────────────────────────────────────

export type OpportunityFilters = {
  status?: string;
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
    let items: Opportunity[] = [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("opportunities")
            .select("*")
            .order("updated_at", { ascending: false });

          if (!error && data && data.length > 0) {
            items = data.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description ?? "",
              problem: row.problem ?? "",
              targetCustomer: row.target_customer ?? "",
              industry: row.industry ?? "",
              currentWorkflow: row.current_workflow,
              currentSolutions: row.current_solutions,
              whyInteresting: row.why_interesting,
              whyTheProblemMatters: row.why_the_problem_matters,
              economicImpact: row.economic_impact,
              marketSize: row.market_size,
              marketGap: row.market_gap,
              aiOpportunity: row.ai_opportunity,
              aiFit: row.ai_fit,
              aiPriority: row.ai_priority,
              aiPriorityReasons: row.ai_priority_reasons ?? [],
              aiConfidence: row.ai_confidence,
              researchScore: row.research_score ?? 50,
              researchScoreFactors: row.research_score_factors ?? {},
              evidenceStrength: row.evidence_strength,
              myDecision: row.my_decision,
              nextAction: row.next_action ?? "",
              myThoughts: row.my_thoughts ?? "",
              mvpFeatures: row.mvp_features ?? [],
              excludedFeatures: row.excluded_features ?? [],
              monetizationModel: row.monetization_model,
              pricingIdea: row.pricing_idea,
              distributionChannels: row.distribution_channels ?? [],
              executionRisks: row.execution_risks ?? [],
              validation: row.validation ?? {},
              competitors: row.competitors ?? [],
              sources: row.sources ?? [],
              notes: row.notes ?? [],
              status: row.status,
              isUserGenerated: row.is_user_generated ?? false,
              createdBy: row.created_by ?? "AI",
              source: row.source ?? "Hermes",
              favorite: row.favorite ?? false,
              saved: row.saved ?? false,
              tags: row.tags ?? [],
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));
          }
        }
      } catch (e) {
        console.warn("[opportunity-store] Supabase fetch fallback to local:", e);
      }
    }

    if (items.length === 0) {
      items = ensureDataFile();
    }

    // Apply filtering
    let filtered = [...items];

    if (filters) {
      if (filters.status) {
        filtered = filtered.filter((o) => o.status === filters.status);
      }
      if (filters.aiPriority) {
        filtered = filtered.filter((o) => o.aiPriority === filters.aiPriority);
      }
      if (filters.aiConfidence) {
        filtered = filtered.filter((o) => o.aiConfidence === filters.aiConfidence);
      }
      if (filters.industry) {
        filtered = filtered.filter(
          (o) => o.industry.toLowerCase() === filters.industry?.toLowerCase(),
        );
      }
      if (typeof filters.favorite === "boolean") {
        filtered = filtered.filter((o) => o.favorite === filters.favorite);
      }
      if (typeof filters.saved === "boolean") {
        filtered = filtered.filter((o) => o.saved === filters.saved);
      }
      if (typeof filters.isUserGenerated === "boolean") {
        filtered = filtered.filter((o) => o.isUserGenerated === filters.isUserGenerated);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        filtered = filtered.filter((o) => {
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
            filtered.sort((a, b) => b.researchScore - a.researchScore);
            break;
          case "priority-desc": {
            const rank: Record<AiPriority, number> = {
              HIGH_POTENTIAL: 5,
              MEDIUM_POTENTIAL: 4,
              CRITICAL_REVIEW: 3,
              LOW_POTENTIAL: 2,
              VERY_LOW_PRIORITY: 1,
            };
            filtered.sort((a, b) => (rank[b.aiPriority] ?? 0) - (rank[a.aiPriority] ?? 0));
            break;
          }
          case "newest":
            filtered.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            break;
          case "oldest":
            filtered.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            break;
          case "evidence-desc": {
            const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            filtered.sort((a, b) => (rank[b.evidenceStrength] ?? 0) - (rank[a.evidenceStrength] ?? 0));
            break;
          }
          case "updated":
          default:
            filtered.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );
            break;
        }
      }
    }

    return filtered;
  },

  async get(id: string): Promise<Opportunity | null> {
    const all = await this.list();
    return all.find((o) => o.id === id) ?? null;
  },

  async create(input: Partial<Opportunity>): Promise<Opportunity> {
    const items = ensureDataFile();
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

    const newOpp: Opportunity = {
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
      aiPriorityReasons: input.aiPriorityReasons || [],
      aiConfidence: input.aiConfidence || "MEDIUM",
      researchScore: calculatedScore,
      researchScoreFactors: factors,
      evidenceStrength: input.evidenceStrength || "MEDIUM",
      myDecision: input.myDecision || "UNDECIDED",
      nextAction: input.nextAction || "",
      myThoughts: input.myThoughts || "",
      mvpFeatures: input.mvpFeatures || [],
      excludedFeatures: input.excludedFeatures || [],
      monetizationModel: input.monetizationModel || "",
      pricingIdea: input.pricingIdea || "",
      distributionChannels: input.distributionChannels || [],
      executionRisks: input.executionRisks || [],
      validation: input.validation || {
        interviewsCount: 0,
        interestedCustomersCount: 0,
        waitlistCount: 0,
        assumptions: [],
        risks: [],
        validationQuestions: [],
      },
      competitors: input.competitors || [],
      sources: input.sources || [],
      notes: input.notes || [],
      status: input.status || "NEW",
      isUserGenerated,
      createdBy: input.createdBy || (isUserGenerated ? "USER" : "AI"),
      source: input.source || (isUserGenerated ? "Manual" : "Hermes"),
      favorite: !!input.favorite,
      saved: !!input.saved,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    // Save locally
    const existingIndex = items.findIndex((o) => o.id === newOpp.id);
    if (existingIndex >= 0) {
      items[existingIndex] = newOpp;
    } else {
      items.unshift(newOpp);
    }
    writeDataFile(items);

    // Sync to Supabase if available
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          await supabase.from("opportunities").upsert({
            id: newOpp.id,
            title: newOpp.title,
            description: newOpp.description,
            problem: newOpp.problem,
            target_customer: newOpp.targetCustomer,
            industry: newOpp.industry,
            current_workflow: newOpp.currentWorkflow,
            current_solutions: newOpp.currentSolutions,
            why_interesting: newOpp.whyInteresting,
            why_the_problem_matters: newOpp.whyTheProblemMatters,
            economic_impact: newOpp.economicImpact,
            market_size: newOpp.marketSize,
            market_gap: newOpp.marketGap,
            ai_opportunity: newOpp.aiOpportunity,
            ai_fit: newOpp.aiFit,
            ai_priority: newOpp.aiPriority,
            ai_priority_reasons: newOpp.aiPriorityReasons,
            ai_confidence: newOpp.aiConfidence,
            research_score: newOpp.researchScore,
            research_score_factors: newOpp.researchScoreFactors,
            evidence_strength: newOpp.evidenceStrength,
            my_decision: newOpp.myDecision,
            next_action: newOpp.nextAction,
            my_thoughts: newOpp.myThoughts,
            mvp_features: newOpp.mvpFeatures,
            excluded_features: newOpp.excludedFeatures,
            monetization_model: newOpp.monetizationModel,
            pricing_idea: newOpp.pricingIdea,
            distribution_channels: newOpp.distributionChannels,
            execution_risks: newOpp.executionRisks,
            validation: newOpp.validation,
            competitors: newOpp.competitors,
            sources: newOpp.sources,
            notes: newOpp.notes,
            status: newOpp.status,
            is_user_generated: newOpp.isUserGenerated,
            created_by: newOpp.createdBy,
            source: newOpp.source,
            favorite: newOpp.favorite,
            saved: newOpp.saved,
            tags: newOpp.tags,
            created_at: newOpp.createdAt,
            updated_at: newOpp.updatedAt,
          });
        }
      } catch (err) {
        console.warn("[opportunity-store] Supabase upsert error:", err);
      }
    }

    return newOpp;
  },

  async update(id: string, updates: Partial<Opportunity>): Promise<Opportunity | null> {
    const items = ensureDataFile();
    const idx = items.findIndex((o) => o.id === id);
    if (idx === -1) return null;

    const existing = items[idx];
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

    const updated: Opportunity = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      researchScore: updatedScore,
      researchScoreFactors: updatedScoreFactors,
    };

    items[idx] = updated;
    writeDataFile(items);

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          await supabase
            .from("opportunities")
            .update({
              title: updated.title,
              description: updated.description,
              problem: updated.problem,
              target_customer: updated.targetCustomer,
              industry: updated.industry,
              current_workflow: updated.currentWorkflow,
              current_solutions: updated.currentSolutions,
              why_interesting: updated.whyInteresting,
              why_the_problem_matters: updated.whyTheProblemMatters,
              economic_impact: updated.economicImpact,
              market_size: updated.marketSize,
              market_gap: updated.marketGap,
              ai_opportunity: updated.aiOpportunity,
              ai_fit: updated.aiFit,
              ai_priority: updated.aiPriority,
              ai_priority_reasons: updated.aiPriorityReasons,
              ai_confidence: updated.aiConfidence,
              research_score: updated.researchScore,
              research_score_factors: updated.researchScoreFactors,
              evidence_strength: updated.evidenceStrength,
              my_decision: updated.myDecision,
              next_action: updated.nextAction,
              my_thoughts: updated.myThoughts,
              mvp_features: updated.mvpFeatures,
              excluded_features: updated.excludedFeatures,
              monetization_model: updated.monetizationModel,
              pricing_idea: updated.pricingIdea,
              distribution_channels: updated.distributionChannels,
              execution_risks: updated.executionRisks,
              validation: updated.validation,
              competitors: updated.competitors,
              sources: updated.sources,
              notes: updated.notes,
              status: updated.status,
              is_user_generated: updated.isUserGenerated,
              favorite: updated.favorite,
              saved: updated.saved,
              tags: updated.tags,
              updated_at: updated.updatedAt,
            })
            .eq("id", id);
        }
      } catch (err) {
        console.warn("[opportunity-store] Supabase update error:", err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const items = ensureDataFile();
    const filtered = items.filter((o) => o.id !== id);
    if (filtered.length === items.length) return false;

    writeDataFile(filtered);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          await supabase.from("opportunities").delete().eq("id", id);
        }
      } catch (err) {
        console.warn("[opportunity-store] Supabase delete error:", err);
      }
    }

    return true;
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

  async addNote(id: string, content: string): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    const newNote: OpportunityNote = {
      id: `note-${Date.now().toString(36)}`,
      content,
      createdAt: new Date().toISOString(),
    };

    const notes = [newNote, ...(opp.notes || [])];
    return this.update(id, { notes });
  },

  async deleteNote(id: string, noteId: string): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    const notes = (opp.notes || []).filter((n) => n.id !== noteId);
    return this.update(id, { notes });
  },

  async addSource(id: string, source: OpportunitySource): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    const newSource: OpportunitySource = {
      ...source,
      id: source.id || `src-${Date.now().toString(36)}`,
      grading: source.grading || "INFERENCE",
    };

    const sources = [...(opp.sources || []), newSource];
    return this.update(id, { sources });
  },

  async deleteSource(id: string, sourceId: string): Promise<Opportunity | null> {
    const opp = await this.get(id);
    if (!opp) return null;

    const sources = (opp.sources || []).filter((s) => s.id !== sourceId);
    return this.update(id, { sources });
  },
};
