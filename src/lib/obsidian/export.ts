import type { Opportunity } from "../opportunities/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function getObsidianFilePath(opp: Opportunity): { folder: string; filename: string; fullPath: string } {
  const d = opp.createdAt ? new Date(opp.createdAt) : new Date();
  const year = d.getFullYear().toString();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const folder = `Startup Intelligence/Opportunities/${year}/${month}`;
  const slug = slugify(opp.title) || opp.id;
  const filename = `${slug}.md`;
  return {
    folder,
    filename,
    fullPath: `${folder}/${filename}`,
  };
}

export function exportOpportunityToObsidian(opp: Opportunity): string {
  const createdDate = opp.createdAt ? opp.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const updatedDate = opp.updatedAt ? opp.updatedAt.slice(0, 10) : createdDate;

  const frontmatter = `---
type: startup-opportunity
id: "${opp.id}"
title: "${opp.title.replace(/"/g, '\\"')}"
status: ${opp.status.toLowerCase()}
ai_priority: ${opp.aiPriority.toLowerCase().replace(/_/g, "-")}
ai_confidence: ${opp.aiConfidence.toLowerCase()}
research_score: ${opp.researchScore}
evidence_strength: ${opp.evidenceStrength.toLowerCase()}
industry: "${opp.industry.toLowerCase()}"
created_by: ${opp.createdBy}
source: "${opp.source}"
my_decision: ${opp.myDecision.toLowerCase().replace(/_/g, "-")}
created: ${createdDate}
updated: ${updatedDate}
tags:
  - opportunity
  - saas-radar
  - ${opp.industry.toLowerCase().replace(/\s+/g, "-")}
  - ${opp.status.toLowerCase()}
${opp.tags.map((t) => `  - ${t.toLowerCase().replace(/\s+/g, "-")}`).join("\n")}
---`;

  const body = `
# ${opp.title}

> [!INFO] **AI Priority**: \`${opp.aiPriority.replace(/_/g, " ")}\` (Confidence: \`${opp.aiConfidence}\`) | **Research Score**: **${opp.researchScore}/100**
> **My Decision**: \`${opp.myDecision.replace(/_/g, " ")}\` | **Status**: \`${opp.status}\` | **Next Action**: **${opp.nextAction || "None set"}**

${opp.description ? `> ${opp.description}\n` : ""}

## Overview
- **Opportunity ID**: \`${opp.id}\`
- **Source**: ${opp.source} (${opp.isUserGenerated ? "User Generated (MY IDEA)" : "AI Discovered"})
- **Target Customer**: ${opp.targetCustomer}
- **Industry**: ${opp.industry}
- **Evidence Strength**: ${opp.evidenceStrength}

---

## The Problem
${opp.problem || "*No problem description recorded.*"}

${opp.whyTheProblemMatters ? `### Why the Problem Matters\n${opp.whyTheProblemMatters}\n` : ""}
${opp.economicImpact ? `### Economic Impact & Cost of Inaction\n${opp.economicImpact}\n` : ""}
${opp.currentWorkflow ? `### Current Workflow\n${opp.currentWorkflow}\n` : ""}
${opp.currentSolutions ? `### Current Alternatives & Solutions\n${opp.currentSolutions}\n` : ""}

---

## Market & Competition
${opp.marketSize ? `- **Market Size / TAM**: ${opp.marketSize}` : ""}
${opp.marketGap ? `- **Identified Market Gap**: ${opp.marketGap}` : ""}

${
  opp.competitors && opp.competitors.length > 0
    ? `### Known Competitors
| Competitor | Pricing | Strengths | Weaknesses |
|---|---|---|---|
${opp.competitors.map((c) => `| **${c.name}** | ${c.pricing || "N/A"} | ${(c.strengths || []).join(", ") || "N/A"} | ${(c.weaknesses || []).join(", ") || "N/A"} |`).join("\n")}`
    : ""
}

---

## AI Opportunity & Technical Edge
- **AI Fit Level**: ${opp.aiFit || "MEDIUM"}
${opp.aiOpportunity ? `${opp.aiOpportunity}\n` : ""}

### Research Score Breakdown (Total: ${opp.researchScore}/100)
| Dimension | Score (0-10) |
|---|---|
| Problem Severity | ${opp.researchScoreFactors?.problemSeverity ?? 5}/10 |
| Problem Frequency | ${opp.researchScoreFactors?.problemFrequency ?? 5}/10 |
| Economic Value | ${opp.researchScoreFactors?.economicValue ?? 5}/10 |
| Willingness to Pay | ${opp.researchScoreFactors?.willingnessToPay ?? 5}/10 |
| Market Opportunity | ${opp.researchScoreFactors?.marketOpportunity ?? 5}/10 |
| Competition Gap | ${opp.researchScoreFactors?.competitionGap ?? 5}/10 |
| AI Fit | ${opp.researchScoreFactors?.aiFit ?? 5}/10 |
| Technical Feasibility | ${opp.researchScoreFactors?.technicalFeasibility ?? 5}/10 |
| Distribution Potential | ${opp.researchScoreFactors?.distributionPotential ?? 5}/10 |
| Evidence Strength | ${opp.researchScoreFactors?.evidenceStrength ?? 5}/10 |

${
  opp.aiPriorityReasons && opp.aiPriorityReasons.length > 0
    ? `\n**Priority Assessment Rationale**:\n${opp.aiPriorityReasons.map((r) => `- ${r}`).join("\n")}\n`
    : ""
}

---

## MVP & Monetization Strategy
${
  opp.mvpFeatures && opp.mvpFeatures.length > 0
    ? `### MVP Scope\n${opp.mvpFeatures.map((f) => `- [ ] ${f}`).join("\n")}\n`
    : ""
}
${
  opp.excludedFeatures && opp.excludedFeatures.length > 0
    ? `### Explicit Exclusions (V1 Non-Goals)\n${opp.excludedFeatures.map((f) => `- ❌ ${f}`).join("\n")}\n`
    : ""
}
- **Monetization Model**: ${opp.monetizationModel || "B2B Subscription"}
- **Pricing Strategy**: ${opp.pricingIdea || "TBD"}
${
  opp.distributionChannels && opp.distributionChannels.length > 0
    ? `### Distribution Channels\n${opp.distributionChannels.map((c) => `- ${c}`).join("\n")}\n`
    : ""
}

---

## Validation Workspace
- **Interviews Conducted**: ${opp.validation?.interviewsCount ?? 0}
- **Interested Customers**: ${opp.validation?.interestedCustomersCount ?? 0}
- **Waitlist Count**: ${opp.validation?.waitlistCount ?? 0}
${opp.validation?.landingPageResults ? `- **Landing Page Results**: ${opp.validation.landingPageResults}` : ""}
${opp.validation?.pricingExperiments ? `- **Pricing Experiments**: ${opp.validation.pricingExperiments}` : ""}
${opp.validation?.feedback ? `- **Customer Feedback Summary**: ${opp.validation.feedback}` : ""}

${
  opp.validation?.assumptions && opp.validation.assumptions.length > 0
    ? `### Core Assumptions to Test\n${opp.validation.assumptions.map((a) => `- ${a}`).join("\n")}\n`
    : ""
}

---

## Evidence & Sources
${
  opp.sources && opp.sources.length > 0
    ? opp.sources
        .map(
          (s) => `### [${s.grading}] ${s.title}
- **URL**: ${s.url || "N/A"}
- **Source Type**: \`${s.sourceType}\` ${s.date ? `| **Date**: ${s.date}` : ""}
${s.summary ? `- **Summary**: ${s.summary}` : ""}
${s.evidenceRelevance ? `- **Relevance**: ${s.evidenceRelevance}` : ""}`,
        )
        .join("\n\n")
    : "*No external evidence records attached yet.*"
}

---

## Personal Notes & Thoughts
${opp.myThoughts ? `### My Thoughts\n${opp.myThoughts}\n` : ""}

### Activity & Notes Log
${
  opp.notes && opp.notes.length > 0
    ? opp.notes
        .map((n) => `- **${new Date(n.createdAt).toLocaleDateString()}**: ${n.content}`)
        .join("\n")
    : "*No personal notes recorded yet.*"
}

---
*Exported from SaaS Opportunity Radar on ${new Date().toISOString()}*
`;

  return `${frontmatter}\n${body.trim()}\n`;
}
