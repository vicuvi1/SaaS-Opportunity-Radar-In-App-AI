/**
 * Discover System Comparison Eval
 * Run: npx tsx eval-discover-v2.ts
 *
 * 4-cell matrix: (current | lean) x (gpt-4o-mini | gpt-4o)
 * 10 cases per cell = 40 total runs.
 * Output: eval-discover-v2-results.md (same format as v1)
 */

import "dotenv/config";
import path from "path";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  DISCOVER_SYSTEM,
  DISCOVER_SYSTEM_LEAN,
  buildDiscoverPrompt,
} from "../../src/lib/ai/prompts";
import {
  ideaDiscoverySchema,
  type IdeaDiscovery,
} from "../../src/lib/schemas/idea-discovery";
import {
  founderProfileToText,
  type FounderProfile,
} from "../../src/lib/profile/founder-profile";
import * as fs from "fs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function p(overrides: Partial<FounderProfile>): FounderProfile {
  return {
    role: [],
    skills: [],
    technicalLevel: "Can build basic apps",
    communities: [],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app"],
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── 10 Stress-Test Profiles ─────────────────────────────────────────────────

interface TestCase {
  id: string;
  label: string;
  profile: FounderProfile;
  niche: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: "T01",
    label: "Senior full-stack, indie hacker community, no instruction",
    profile: p({
      role: ["Software engineer"],
      skills: ["Full-stack development", "React / Next.js", "Backend development", "SQL / database queries"],
      technicalLevel: "Full-stack / senior engineer",
      communities: ["Startup founders / indie hackers", "Software developers / engineers", "Small business owners"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },
  {
    id: "T02",
    label: "ML engineer, funded startup, no generic AI wrappers",
    profile: p({
      role: ["Software engineer"],
      skills: ["Machine learning engineering", "LLM / AI engineering", "Python development", "Data science / ML", "Backend development"],
      technicalLevel: "Full-stack / senior engineer",
      communities: ["AI / ML practitioners", "Software developers / engineers", "Startup founders / indie hackers"],
      goal: ["Launch a funded startup"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "I want ideas outside of generic AI wrappers - something with real workflow lock-in or proprietary data",
  },
  {
    id: "S04",
    label: "Student athlete turned league organizer, strong coder, specific pain",
    profile: p({
      role: ["Student", "Software engineer"],
      skills: ["Full-stack development", "React / Next.js", "Backend development", "Community management"],
      technicalLevel: "Strong developer",
      communities: ["Student athletes", "Local sports leagues / intramurals", "Youth sports parents & coaches", "College students / campus life"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "I run 3 intramural leagues and every single admin task is in Google Sheets or GroupMe.",
  },
  {
    id: "N01",
    label: "B2B sales pro, knows SMB owners, no coding, fast monetization",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["B2B enterprise sales", "Outbound / cold outreach", "Account management", "CRM management (HubSpot, Salesforce)", "Business development"],
      technicalLevel: "Little to none",
      communities: ["Small business owners", "Sales professionals", "Freelancers / consultants"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business", "Software / app"],
    }),
    niche: "No coding. Want something I can build or operate without developers. Fast monetization.",
  },
  {
    id: "N03",
    label: "UI/UX designer, design community, funded startup, not portfolio tool",
    profile: p({
      role: ["Designer"],
      skills: ["UI / UX design", "Product design", "Figma / prototyping", "UX research", "Design systems"],
      technicalLevel: "Just getting started",
      communities: ["UX / UI designers", "Product managers", "Startup founders / indie hackers", "Software developers / engineers"],
      goal: ["Launch a funded startup"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "I want to build something that solves a real designer or PM workflow problem. Not a portfolio tool.",
  },
  {
    id: "D04",
    label: "Twitch streamer + developer, creator communities, solo SaaS under $500/mo",
    profile: p({
      role: ["Software engineer"],
      skills: ["Full-stack development", "React / Next.js", "Community management", "Content creation"],
      technicalLevel: "Strong developer",
      communities: ["Streamers (Twitch / Kick)", "YouTubers / video creators", "Discord / online communities", "TikTok creators"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)", "Free + paid tier (freemium)"],
      buildType: ["Software / app"],
    }),
    niche: "Wants solo SaaS under $500/mo to start. Prove the market before going bigger.",
  },
  {
    id: "D08",
    label: "Youth sports league organizer, parent community, spreadsheet pain",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Event operations / coordination", "Community management", "Sports coaching", "Project management"],
      technicalLevel: "Little to none",
      communities: ["Youth sports parents & coaches", "Local sports leagues / intramurals", "Parents of young children", "Parents of teens / student athletes"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app", "Service business"],
    }),
    niche: "I coordinate 6 youth leagues. Scheduling, communications, payments, and rosters are all in spreadsheets and text threads.",
  },
  {
    id: "E01",
    label: "Weak distribution, generic interests - fitness/gaming/productivity (should penalize)",
    profile: p({
      role: ["Software engineer"],
      skills: ["Full-stack development", "React / Next.js"],
      technicalLevel: "Strong developer",
      communities: [],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "I want to build a SaaS. Interested in fitness, gaming, and productivity.",
  },
  {
    id: "E02",
    label: "Broad consumer communities (pets, cars, college), no constraints - hardest test",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Marketing (digital)", "Sales / closing deals"],
      technicalLevel: "Little to none",
      communities: ["College students / campus life", "Pet owners (dogs, cats)", "Car enthusiasts / gearheads"],
      goal: ["Still figuring it out"],
      monetizationPref: ["Not sure yet"],
      buildType: ["Not sure yet"],
    }),
    niche: "",
  },
  {
    id: "E03",
    label: "No code, no budget, needs $500 in 30 days",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Outbound / cold outreach", "Copywriting", "Community management"],
      technicalLevel: "Little to none",
      communities: ["Freelancers / consultants", "Small business owners"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business"],
    }),
    niche: "No code at all. No budget. Need to make my first $500 within 30 days. Solo operation.",
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

type PromptVariant = "current" | "lean";
type ModelVariant = "gpt-4o-mini" | "gpt-4o";

interface CellConfig {
  promptVariant: PromptVariant;
  modelVariant: ModelVariant;
  label: string;
}

const CELLS: CellConfig[] = [
  { promptVariant: "current", modelVariant: "gpt-4o-mini", label: "Current prompt + gpt-4o-mini" },
  { promptVariant: "current", modelVariant: "gpt-4o",     label: "Current prompt + gpt-4o" },
  { promptVariant: "lean",    modelVariant: "gpt-4o-mini", label: "Lean prompt + gpt-4o-mini" },
  { promptVariant: "lean",    modelVariant: "gpt-4o",     label: "Lean prompt + gpt-4o" },
];

interface Result {
  id: string;
  label: string;
  profileText: string;
  niche: string;
  output: IdeaDiscovery | null;
  error: string | null;
  durationMs: number;
}

async function runCase(tc: TestCase, config: CellConfig): Promise<Result> {
  const profileText = founderProfileToText(tc.profile);
  const start = Date.now();

  try {
    const system = config.promptVariant === "lean" ? DISCOVER_SYSTEM_LEAN : DISCOVER_SYSTEM;
    const model = openai(config.modelVariant);
    let finalObject: IdeaDiscovery | null = null;

    const { partialObjectStream } = streamObject({
      model,
      schema: ideaDiscoverySchema,
      system,
      prompt: buildDiscoverPrompt({ niche: tc.niche, founderProfileText: profileText }),
      temperature: 1,
    });

    for await (const partial of partialObjectStream) {
      finalObject = partial as IdeaDiscovery;
    }

    return { id: tc.id, label: tc.label, profileText, niche: tc.niche, output: finalObject, error: null, durationMs: Date.now() - start };
  } catch (err) {
    return { id: tc.id, label: tc.label, profileText, niche: tc.niche, output: null, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function formatIdea(idea: IdeaDiscovery["opportunityZones"][0]["ideas"][0]): string {
  const score = idea.opportunityScore ?? "?";
  const fit = idea.founderFitScore
    ? `skill:${idea.founderFitScore.skillMatch} dist:${idea.founderFitScore.distributionAdvantage} speed:${idea.founderFitScore.executionSpeed} money:${idea.founderFitScore.monetizationFit}`
    : "";
  return [
    `### ${idea.title} (score: ${score})`,
    `> ${idea.oneLiner}`,
    `**Audience:** ${idea.targetAudience}`,
    `**Wedge:** ${idea.coreWedge}`,
    `**Why you:** ${idea.whyYou}`,
    `**Why now:** ${idea.whyNow}`,
    `**Monetization:** ${idea.monetizationPath}`,
    `**First step:** ${idea.firstValidationStep}`,
    fit ? `**Fit scores:** ${fit}` : "",
  ].filter(Boolean).join("\n");
}

function formatResult(r: Result, index: number): string {
  const lines: string[] = [];
  lines.push(`---`);
  lines.push(`#### Case ${index + 1}: [${r.id}] ${r.label}`);
  lines.push(`**Duration:** ${(r.durationMs / 1000).toFixed(1)}s`);
  lines.push(``);
  lines.push(`**Input profile:**`);
  lines.push("```");
  lines.push(r.profileText || "(empty)");
  lines.push("```");
  lines.push(`**Direct instruction:** ${r.niche || "(none)"}`);
  lines.push(``);

  if (r.error) {
    lines.push(`**ERROR:** ${r.error}`);
    lines.push(`**Eval note:** [FILL IN]`);
    return lines.join("\n");
  }

  if (!r.output) {
    lines.push(`**No output received.**`);
    return lines.join("\n");
  }

  const out = r.output;
  const totalIdeas = (out.opportunityZones ?? []).flatMap(z => z.ideas ?? []).length;

  if (out.founderSummary) {
    lines.push(`**AI-parsed founder:** Role: ${out.founderSummary.role || "(none)"} | Skills: ${(out.founderSummary.skills ?? []).slice(0, 4).join(", ")} | Communities: ${(out.founderSummary.communities ?? []).slice(0, 3).join(", ")}`);
  }
  lines.push(`**Search context:** ${out.searchContext ?? "(none)"}`);
  lines.push(`**Total ideas generated:** ${totalIdeas}`);
  lines.push(``);

  for (const zone of (out.opportunityZones ?? [])) {
    lines.push(`**Zone: ${zone.zone}**`);
    lines.push(`*${zone.zoneRationale}*`);
    lines.push(``);
    for (const idea of (zone.ideas ?? [])) {
      lines.push(formatIdea(idea));
      lines.push(``);
    }
  }

  lines.push(`**Evaluator notes:**`);
  lines.push(`- [ ] Ideas are well-targeted (not generic consumer/GPT-slop)`);
  lines.push(`- [ ] Distribution alignment is correct for this founder`);
  lines.push(`- [ ] Hard constraints honored`);
  lines.push(`- [ ] Scores are calibrated (dist score matches actual access)`);
  lines.push(`- [ ] Idea count is appropriate (not padded)`);
  lines.push(`**Quality rating:** [ ] Strong  [ ] Acceptable  [ ] Weak  [ ] Garbage`);
  lines.push(`**Notes:** `);

  return lines.join("\n");
}

function formatCellSummary(cell: CellConfig, results: Result[]): string {
  const lines: string[] = [];
  lines.push(`## Cell: ${cell.label}`);
  lines.push(``);
  lines.push(`| # | ID | Label | Ideas | Duration | Status |`);
  lines.push(`|---|-----|-------|-------|----------|--------|`);
  for (const [i, r] of results.map((x, i) => [i, x] as [number, typeof x])) {
    const ideas = r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0;
    const status = r.error ? "ERROR" : "OK";
    lines.push(`| ${i + 1} | ${r.id} | ${r.label} | ${ideas} | ${(r.durationMs / 1000).toFixed(1)}s | ${status} |`);
  }
  lines.push(``);
  const avgDuration = results.reduce((s, r) => s + r.durationMs, 0) / results.length;
  const totalIdeas = results.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);
  lines.push(`**Avg duration:** ${(avgDuration / 1000).toFixed(1)}s | **Total ideas:** ${totalIdeas} | **Avg ideas/case:** ${(totalIdeas / results.length).toFixed(1)}`);
  lines.push(``);
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CONCURRENCY = 3;

async function runCell(cell: CellConfig): Promise<Result[]> {
  const results: Result[] = [];
  for (let i = 0; i < TEST_CASES.length; i += CONCURRENCY) {
    const batch = TEST_CASES.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(tc => runCase(tc, cell)));
    results.push(...batchResults);
    for (const r of batchResults) {
      const ideas = r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0;
      const status = r.error ? "FAILED" : `OK (${(r.durationMs / 1000).toFixed(1)}s, ${ideas} ideas)`;
      console.log(`    [${r.id}] ${status}`);
    }
    if (i + CONCURRENCY < TEST_CASES.length) await new Promise(res => setTimeout(res, 800));
  }
  return results;
}

async function main() {
  console.log(`4-cell Discover eval: ${CELLS.length} cells x ${TEST_CASES.length} cases = ${CELLS.length * TEST_CASES.length} total\n`);

  const allCellResults: Array<{ cell: CellConfig; results: Result[] }> = [];

  for (const [ci, cell] of CELLS.map((x, i) => [i, x] as [number, typeof x])) {
    console.log(`\n[${ci + 1}/${CELLS.length}] ${cell.label}`);
    const results = await runCell(cell);
    allCellResults.push({ cell, results });

    const ok = results.filter(r => !r.error).length;
    const avgDuration = results.reduce((s, r) => s + r.durationMs, 0) / results.length;
    const totalIdeas = results.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);
    console.log(`  Done: ${ok}/${results.length} ok | avg ${(avgDuration / 1000).toFixed(1)}s | ${totalIdeas} ideas total`);
  }

  // ── Build report ────────────────────────────────────────────────────────────

  const promptTokens: Record<PromptVariant, number> = {
    current: 8597,
    lean: 1584,
  };

  const header = [
    `# Discover System Comparison Eval`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Cells:** current-prompt x lean-prompt / gpt-4o-mini x gpt-4o`,
    `**Cases per cell:** ${TEST_CASES.length} | **Total runs:** ${CELLS.length * TEST_CASES.length}`,
    `**Prompt sizes:** current ~${promptTokens.current} tokens | lean ~${promptTokens.lean} tokens (-${Math.round((1 - promptTokens.lean / promptTokens.current) * 100)}%)`,
    ``,
    `---`,
    ``,
    `## High-Level Summary`,
    ``,
    `| Cell | Prompt | Model | Avg Duration | Total Ideas | Avg Ideas/Case | Errors |`,
    `|------|--------|-------|-------------|-------------|----------------|--------|`,
    ...allCellResults.map(({ cell, results }) => {
      const avgDur = (results.reduce((s, r) => s + r.durationMs, 0) / results.length / 1000).toFixed(1);
      const totalIdeas = results.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);
      const avgIdeas = (totalIdeas / results.length).toFixed(1);
      const errors = results.filter(r => r.error).length;
      return `| ${cell.label} | ${cell.promptVariant} | ${cell.modelVariant} | ${avgDur}s | ${totalIdeas} | ${avgIdeas} | ${errors} |`;
    }),
    ``,
    `*Lower avg ideas/case = tighter quality gate (target: 4-6 per run). Higher is more likely padding.*`,
    ``,
    `---`,
    ``,
    `## Test Cases Reference`,
    ``,
    `| ID | Label | Instruction |`,
    `|----|-------|-------------|`,
    ...TEST_CASES.map(tc => `| ${tc.id} | ${tc.label} | ${tc.niche ? tc.niche.slice(0, 60) + (tc.niche.length > 60 ? "..." : "") : "(none)"} |`),
    ``,
    `---`,
    ``,
  ].join("\n");

  // Per-cell detailed sections
  const sections: string[] = [];
  for (const { cell, results } of allCellResults) {
    sections.push(`# ${cell.label}`);
    sections.push(``);
    sections.push(formatCellSummary(cell, results));
    sections.push(`### Detailed Results`);
    sections.push(``);
    for (const [i, r] of results.map((x, i) => [i, x] as [number, typeof x])) {
      sections.push(formatResult(r, i));
      sections.push(``);
    }
    sections.push(`---`);
    sections.push(``);
  }

  // Side-by-side comparison for each test case
  const comparisons: string[] = [
    `# Side-by-Side: Same Case Across All 4 Cells`,
    ``,
    `Use this to directly compare how each cell handled each profile.`,
    ``,
  ];

  for (const tc of TEST_CASES) {
    comparisons.push(`## Profile ${tc.id}: ${tc.label}`);
    comparisons.push(`**Instruction:** ${tc.niche || "(none)"}`);
    comparisons.push(``);
    comparisons.push(`| Cell | Ideas | Zones | Quality flag |`);
    comparisons.push(`|------|-------|-------|--------------|`);

    for (const { cell, results } of allCellResults) {
      const r = results.find(x => x.id === tc.id);
      if (!r) continue;
      if (r.error) {
        comparisons.push(`| ${cell.label} | ERROR | - | - |`);
        continue;
      }
      const zones = r.output?.opportunityZones ?? [];
      const ideas = zones.flatMap(z => z.ideas ?? []);
      const avgScore = ideas.length > 0
        ? (ideas.reduce((s, i) => s + (i.opportunityScore ?? 0), 0) / ideas.length).toFixed(0)
        : "?";
      const avgDist = ideas.length > 0
        ? (ideas.reduce((s, i) => s + (i.founderFitScore?.distributionAdvantage ?? 0), 0) / ideas.length).toFixed(1)
        : "?";
      comparisons.push(`| ${cell.label} | ${ideas.length} | ${zones.length} | avg score ${avgScore}, avg dist ${avgDist} |`);
    }
    comparisons.push(``);

    // Show all 4 idea titles side by side
    for (const { cell, results } of allCellResults) {
      const r = results.find(x => x.id === tc.id);
      if (!r?.output) continue;
      const ideas = r.output.opportunityZones?.flatMap(z => z.ideas ?? []) ?? [];
      comparisons.push(`**${cell.label}** (${ideas.length} ideas):`);
      for (const idea of ideas) {
        comparisons.push(`- ${idea.title} (${idea.opportunityScore ?? "?"}) — dist:${idea.founderFitScore?.distributionAdvantage ?? "?"}`);
      }
      comparisons.push(``);
    }

    comparisons.push(`**Evaluator judgment:** `);
    comparisons.push(`- Best cell for this profile: [ ] current+mini  [ ] current+4o  [ ] lean+mini  [ ] lean+4o`);
    comparisons.push(`- Notes: `);
    comparisons.push(``);
  }

  const report = header + sections.join("\n") + "\n\n" + comparisons.join("\n");
  fs.writeFileSync(path.join(__dirname, "../results/discover-v2.md"), report, "utf-8");
  console.log(`\nReport written to test/results/discover-v2.md`);
}

main().catch(console.error);
