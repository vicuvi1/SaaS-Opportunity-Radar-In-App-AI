import { opportunityStore } from "@/lib/opportunities/store";
import type { Opportunity } from "@/lib/opportunities/types";

export type CopilotScope =
  | "CURRENT_OPPORTUNITY"
  | "SELECTED_OPPORTUNITIES"
  | "ALL_OPPORTUNITIES"
  | "RESEARCH_SOURCES"
  | "ENTIRE_DATABASE";

export interface ContextRetrievalOptions {
  scope: CopilotScope;
  currentOpportunityId?: string;
  selectedOpportunityIds?: string[];
  userQuery?: string;
}

export async function retrieveTargetedContext(
  options: ContextRetrievalOptions,
): Promise<{ contextSummary: string; retrievedOpportunities: Array<{ id: string; title: string }> }> {
  const { scope, currentOpportunityId, selectedOpportunityIds, userQuery } = options;
  const allOpps = await opportunityStore.list();

  // 1. Scope: CURRENT OPPORTUNITY
  if (scope === "CURRENT_OPPORTUNITY" && currentOpportunityId) {
    const opp = allOpps.find((o) => o.id === currentOpportunityId);
    if (opp) {
      const summary = `
=== CURRENT OPPORTUNITY IN FOCUS ===
ID: ${opp.id}
Title: ${opp.title}
Status: ${opp.status} | AI Priority: ${opp.aiPriority} (Confidence: ${opp.aiConfidence})
Research Score: ${opp.researchScore}/100 | Evidence Strength: ${opp.evidenceStrength}
My Decision: ${opp.myDecision} | Next Action: ${opp.nextAction || "None"}
Target Customer: ${opp.targetCustomer} | Industry: ${opp.industry}

Problem:
${opp.problem}

Current Workflow & Solutions:
${opp.currentWorkflow || "None"} | ${opp.currentSolutions || "None"}

Economic Impact & Why It Matters:
${opp.economicImpact || "None"} | ${opp.whyTheProblemMatters || "None"}

Market Gap & AI Opportunity:
${opp.marketGap || "None"} | ${opp.aiOpportunity || "None"}

Competitors:
${(opp.competitors || []).map((c) => `${c.name} (${c.pricing || "No pricing"})`).join("; ") || "None"}

Validation Data:
Interviews: ${opp.validation?.interviewsCount ?? 0}, Interested: ${opp.validation?.interestedCustomersCount ?? 0}, Waitlist: ${opp.validation?.waitlistCount ?? 0}
Assumptions: ${(opp.validation?.assumptions || []).join(", ") || "None"}

Personal Notes & Thoughts:
My Thoughts: ${opp.myThoughts || "None"}
Notes: ${(opp.notes || []).map((n) => `[${n.createdAt.slice(0, 10)}] ${n.content}`).join("\n")}

Sources Count: ${(opp.sources || []).length}
====================================`;
      return {
        contextSummary: summary,
        retrievedOpportunities: [{ id: opp.id, title: opp.title }],
      };
    }
  }

  // 2. Scope: SELECTED OPPORTUNITIES
  if (scope === "SELECTED_OPPORTUNITIES" && selectedOpportunityIds && selectedOpportunityIds.length > 0) {
    const selected = allOpps.filter((o) => selectedOpportunityIds.includes(o.id));
    const summary = `
=== SELECTED OPPORTUNITIES (${selected.length}) ===
${selected
  .map(
    (o) => `[${o.id}] "${o.title}"
Status: ${o.status} | Priority: ${o.aiPriority} | Score: ${o.researchScore}/100 | Decision: ${o.myDecision}
Problem: ${o.problem}
Target: ${o.targetCustomer} | Industry: ${o.industry}
Next Action: ${o.nextAction}`,
  )
  .join("\n---\n")}
==================================================`;
    return {
      contextSummary: summary,
      retrievedOpportunities: selected.map((o) => ({ id: o.id, title: o.title })),
    };
  }

  // 3. Scope: RESEARCH_SOURCES
  if (scope === "RESEARCH_SOURCES") {
    const allSources = allOpps.flatMap((o) =>
      (o.sources || []).map((s) => ({ ...s, oppTitle: o.title, oppId: o.id })),
    );

    // If query provided, filter sources
    let relevantSources = allSources;
    if (userQuery) {
      const q = userQuery.toLowerCase();
      relevantSources = allSources.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.summary && s.summary.toLowerCase().includes(q)) ||
          s.oppTitle.toLowerCase().includes(q),
      );
    }
    const top = relevantSources.slice(0, 12);
    const summary = `
=== RELEVANT EVIDENCE SOURCES (${top.length} found) ===
${top
  .map(
    (s) => `[${s.grading}] "${s.title}" (${s.sourceType}) -> linked to: "${s.oppTitle}" (${s.oppId})
URL: ${s.url || "N/A"}
Summary: ${s.summary || "No summary"}`,
  )
  .join("\n---\n")}
======================================================`;
    return {
      contextSummary: summary,
      retrievedOpportunities: top.map((s) => ({ id: s.oppId, title: s.oppTitle })),
    };
  }

  // 4. Targeted Retrieval over ALL_OPPORTUNITIES or ENTIRE_DATABASE
  // Instead of dumping 50 opportunities, match keywords from the userQuery
  let matched = allOpps;
  if (userQuery && userQuery.trim().length > 2) {
    const q = userQuery.toLowerCase().trim();
    const words = q.split(/\s+/).filter((w) => w.length > 2);

    matched = allOpps.filter((o) => {
      const text = [
        o.title,
        o.problem,
        o.industry,
        o.targetCustomer,
        o.status,
        o.aiPriority,
        o.myDecision,
        ...(o.tags || []),
        o.myThoughts || "",
      ]
        .join(" ")
        .toLowerCase();

      return words.some((w) => text.includes(w));
    });

    // If no keyword match, provide top 5 highest research score opportunities
    if (matched.length === 0) {
      matched = [...allOpps].sort((a, b) => b.researchScore - a.researchScore).slice(0, 5);
    }
  }

  // Cap at top 8 to prevent prompt bloating
  const topSlice = matched.slice(0, 8);

  const summary = `
=== RETRIEVED STARTUP DATABASE OPPORTUNITIES (${topSlice.length} relevant matches) ===
Total in database: ${allOpps.length}
${topSlice
  .map(
    (o) => `[${o.id}] "${o.title}" (${o.industry})
Status: ${o.status} | Priority: ${o.aiPriority} | Score: ${o.researchScore}/100 | My Decision: ${o.myDecision}
Problem: ${o.problem.slice(0, 180)}...
Target Customer: ${o.targetCustomer} | Next Action: ${o.nextAction || "None"}`,
  )
  .join("\n---\n")}
================================================================================`;

  return {
    contextSummary: summary,
    retrievedOpportunities: topSlice.map((o) => ({ id: o.id, title: o.title })),
  };
}
