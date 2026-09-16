import { tool } from "ai";
import { z } from "zod";
import { opportunityStore } from "@/lib/opportunities/store";
import type { OpportunityStatus, AiPriority, EvidenceGrading } from "@/lib/opportunities/types";

// Schema definitions for AI Tool Calling
export const copilotTools = {
  searchOpportunities: tool({
    description: "Search and filter the startup opportunities database by query, industry, status, or priority.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search keywords in title, problem, target customer, or notes"),
      industry: z.string().optional().describe("Filter by industry, e.g. Cybersecurity, Healthcare, DevTools"),
      status: z.string().optional().describe("Filter by lifecycle status (NEW, REVIEW, INTERESTING, RESEARCHING, VALIDATING, MVP, BUILDING, LAUNCHED, REJECTED, ARCHIVED)"),
      aiPriority: z.string().optional().describe("Filter by AI priority (HIGH_POTENTIAL, MEDIUM_POTENTIAL, LOW_POTENTIAL, etc.)"),
      favoriteOnly: z.boolean().optional().describe("Filter to only starred favorites"),
      savedOnly: z.boolean().optional().describe("Filter to only saved/bookmarked opportunities"),
    }),
    execute: async ({ query, industry, status, aiPriority, favoriteOnly, savedOnly }) => {
      const items = await opportunityStore.list({
        search: query,
        industry,
        status,
        aiPriority,
        favorite: favoriteOnly,
        saved: savedOnly,
      });
      return items.map((o) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        aiPriority: o.aiPriority,
        researchScore: o.researchScore,
        industry: o.industry,
        targetCustomer: o.targetCustomer,
        myDecision: o.myDecision,
        nextAction: o.nextAction,
        problem: o.problem.slice(0, 150),
      }));
    },
  }),

  getOpportunity: tool({
    description: "Retrieve complete detailed information for a specific opportunity by ID.",
    inputSchema: z.object({
      id: z.string().describe("The stable opportunity ID (e.g. opp-001)"),
    }),
    execute: async ({ id }) => {
      const opp = await opportunityStore.get(id);
      if (!opp) return { error: `Opportunity with ID ${id} not found.` };
      return opp;
    },
  }),

  compareOpportunities: tool({
    description: "Compare two or more opportunities side-by-side on research score, market gap, competition, and evidence strength.",
    inputSchema: z.object({
      ids: z.array(z.string()).min(2).describe("Array of opportunity IDs to compare"),
    }),
    execute: async ({ ids }) => {
      const all = await opportunityStore.list();
      const matched = all.filter((o) => ids.includes(o.id));
      if (matched.length === 0) return { error: "No matching opportunities found." };
      return matched.map((o) => ({
        id: o.id,
        title: o.title,
        industry: o.industry,
        aiPriority: o.aiPriority,
        researchScore: o.researchScore,
        evidenceStrength: o.evidenceStrength,
        myDecision: o.myDecision,
        status: o.status,
        targetCustomer: o.targetCustomer,
        problem: o.problem,
        marketGap: o.marketGap,
        competitorsCount: o.competitors?.length ?? 0,
        sourcesCount: o.sources?.length ?? 0,
      }));
    },
  }),

  getValidationData: tool({
    description: "Get customer interview counts, waitlist numbers, landing page metrics, and assumptions for an opportunity.",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
    }),
    execute: async ({ id }) => {
      const opp = await opportunityStore.get(id);
      if (!opp) return { error: `Opportunity with ID ${id} not found.` };
      return {
        id: opp.id,
        title: opp.title,
        status: opp.status,
        validation: opp.validation,
      };
    },
  }),

  getNotes: tool({
    description: "Retrieve all personal activity notes and long-form thoughts for an opportunity.",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
    }),
    execute: async ({ id }) => {
      const opp = await opportunityStore.get(id);
      if (!opp) return { error: `Opportunity with ID ${id} not found.` };
      return {
        id: opp.id,
        title: opp.title,
        myThoughts: opp.myThoughts,
        notes: opp.notes,
      };
    },
  }),

  // State Changing Action Tools
  updateStatus: tool({
    description: "Move an opportunity to a new lifecycle workflow status (NEW, REVIEW, DEEP_RESEARCH, SHORTLIST, REJECTED, ARCHIVED).",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID to update"),
      status: z.enum([
        "NEW",
        "REVIEW",
        "DEEP_RESEARCH",
        "SHORTLIST",
        "REJECTED",
        "ARCHIVED",
      ]).describe("Target workflow stage"),
      reason: z.string().optional().describe("Reason for the transition"),
    }),
    execute: async ({ id, status, reason }) => {
      const updated = await opportunityStore.updateStatus(id, status as OpportunityStatus);
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return {
        success: true,
        id: updated.id,
        title: updated.title,
        newStatus: updated.status,
        reason,
      };
    },
  }),

  updateDecision: tool({
    description: "Update the user's personal decision status (UNDECIDED, INTERESTED, SHORTLISTED, REJECTED).",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
      decision: z.enum(["UNDECIDED", "INTERESTED", "SHORTLISTED", "REJECTED"]).describe("Personal human decision status"),
    }),
    execute: async ({ id, decision }) => {
      const updated = await opportunityStore.update(id, { myDecision: decision });
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return {
        success: true,
        id: updated.id,
        title: updated.title,
        myDecision: updated.myDecision,
      };
    },
  }),

  updatePriority: tool({
    description: "Update the AI research priority and reasoning for an opportunity.",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
      aiPriority: z.enum([
        "HIGH_POTENTIAL",
        "MEDIUM_POTENTIAL",
        "LOW_POTENTIAL",
        "VERY_LOW_PRIORITY",
        "CRITICAL_REVIEW",
      ]),
      reasons: z.array(z.string()).optional().describe("Key drivers explaining the priority"),
    }),
    execute: async ({ id, aiPriority, reasons }) => {
      const updated = await opportunityStore.updatePriority(id, aiPriority as AiPriority, reasons);
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return {
        success: true,
        id: updated.id,
        title: updated.title,
        aiPriority: updated.aiPriority,
        reasons: updated.aiPriorityReasons,
      };
    },
  }),

  addNote: tool({
    description: "Add a personal timestamped note to an opportunity.",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
      content: z.string().min(1).describe("The text of the note to record"),
    }),
    execute: async ({ id, content }) => {
      const updated = await opportunityStore.addNote(id, content);
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return {
        success: true,
        id: updated.id,
        title: updated.title,
        addedNote: updated.notes[0],
      };
    },
  }),

  addSource: tool({
    description: "Attach an evidence source with reliability grading (FACT, SOURCE-BASED CLAIM, INFERENCE, HYPOTHESIS).",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
      title: z.string().describe("Citation title or headline"),
      url: z.string().optional().describe("URL link to discussion, issue, or article"),
      sourceType: z.string().default("web").describe("Source type (reddit, hackernews, github, stackoverflow, web, etc.)"),
      grading: z.enum(["FACT", "SOURCE-BASED CLAIM", "INFERENCE", "HYPOTHESIS", "UNKNOWN"]).default("INFERENCE"),
      summary: z.string().optional().describe("Key excerpt or takeaway"),
    }),
    execute: async ({ id, title, url, sourceType, grading, summary }) => {
      const source = {
        id: `src-${Date.now().toString(36)}`,
        title,
        url: url || "",
        sourceType,
        grading: grading as EvidenceGrading,
        summary: summary || "",
        date: new Date().toISOString().slice(0, 10),
      };
      const updated = await opportunityStore.addSource(id, source);
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return {
        success: true,
        id: updated.id,
        title: updated.title,
        source,
      };
    },
  }),

  setFavorite: tool({
    description: "Star or unstar an opportunity as a personal favorite.",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
      favorite: z.boolean().describe("True to mark as favorite, false to unmark"),
    }),
    execute: async ({ id, favorite }) => {
      const updated = await opportunityStore.update(id, { favorite });
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return { success: true, id: updated.id, favorite: updated.favorite };
    },
  }),

  saveOpportunity: tool({
    description: "Bookmark or un-bookmark an opportunity for later review.",
    inputSchema: z.object({
      id: z.string().describe("The opportunity ID"),
      saved: z.boolean().describe("True to save, false to unsave"),
    }),
    execute: async ({ id, saved }) => {
      const updated = await opportunityStore.update(id, { saved });
      if (!updated) return { error: `Opportunity ${id} not found.` };
      return { success: true, id: updated.id, saved: updated.saved };
    },
  }),

  createOpportunity: tool({
    description: "Create a new opportunity record in the database from conversation findings.",
    inputSchema: z.object({
      title: z.string().describe("Title of the SaaS opportunity"),
      problem: z.string().describe("Core problem being solved"),
      targetCustomer: z.string().describe("Target customer persona"),
      industry: z.string().describe("Market industry"),
      whyInteresting: z.string().optional().describe("Why this angle is compelling"),
      nextAction: z.string().optional().describe("Immediate validation step"),
    }),
    execute: async ({ title, problem, targetCustomer, industry, whyInteresting, nextAction }) => {
      const created = await opportunityStore.create({
        title,
        problem,
        targetCustomer,
        industry,
        whyInteresting,
        nextAction: nextAction || "Interview 5 prospective customers",
        isUserGenerated: false,
        createdBy: "AI",
        source: "AI Copilot",
        status: "NEW",
        myDecision: "INTERESTED",
      });
      return {
        success: true,
        opportunity: {
          id: created.id,
          title: created.title,
          status: created.status,
        },
      };
    },
  }),
};
