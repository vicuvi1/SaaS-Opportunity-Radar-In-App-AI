/**
 * Discover v3 Eval — Lean prompt + gpt-4o (production config)
 * Run: npx tsx eval-discover-v3.ts
 *
 * Single cell: lean + gpt-4o
 * 20 cases: 10 profile-only (no instruction), 10 same profiles + instruction
 * Output: eval-discover-v3-results.md
 */

import "dotenv/config";
import path from "path";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import {
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

interface TestCase {
  id: string;
  label: string;
  profile: FounderProfile;
  niche: string;
  group: "no-instruction" | "with-instruction";
}

// ─── Base profiles (shared between both groups) ────────────────────────────

const profiles = {
  T01: p({
    role: ["Software engineer"],
    skills: ["Full-stack development", "React / Next.js", "Backend development", "SQL / database queries"],
    technicalLevel: "Full-stack / senior engineer",
    communities: ["Startup founders / indie hackers", "Software developers / engineers", "Small business owners"],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app"],
  }),
  T02: p({
    role: ["Software engineer"],
    skills: ["Machine learning engineering", "LLM / AI engineering", "Python development", "Data science / ML", "Backend development"],
    technicalLevel: "Full-stack / senior engineer",
    communities: ["AI / ML practitioners", "Software developers / engineers", "Startup founders / indie hackers"],
    goal: ["Launch a funded startup"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app"],
  }),
  S04: p({
    role: ["Student", "Software engineer"],
    skills: ["Full-stack development", "React / Next.js", "Backend development", "Community management"],
    technicalLevel: "Strong developer",
    communities: ["Student athletes", "Local sports leagues / intramurals", "Youth sports parents & coaches", "College students / campus life"],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app"],
  }),
  N01: p({
    role: ["Non-technical founder"],
    skills: ["B2B enterprise sales", "Outbound / cold outreach", "Account management", "CRM management (HubSpot, Salesforce)", "Business development"],
    technicalLevel: "Little to none",
    communities: ["Small business owners", "Sales professionals", "Freelancers / consultants"],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Service business", "Software / app"],
  }),
  N03: p({
    role: ["Designer"],
    skills: ["UI / UX design", "Product design", "Figma / prototyping", "UX research", "Design systems"],
    technicalLevel: "Just getting started",
    communities: ["UX / UI designers", "Product managers", "Startup founders / indie hackers", "Software developers / engineers"],
    goal: ["Launch a funded startup"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app"],
  }),
  D04: p({
    role: ["Software engineer"],
    skills: ["Full-stack development", "React / Next.js", "Community management", "Content creation"],
    technicalLevel: "Strong developer",
    communities: ["Streamers (Twitch / Kick)", "YouTubers / video creators", "Discord / online communities", "TikTok creators"],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)", "Free + paid tier (freemium)"],
    buildType: ["Software / app"],
  }),
  D08: p({
    role: ["Non-technical founder"],
    skills: ["Event operations / coordination", "Community management", "Sports coaching", "Project management"],
    technicalLevel: "Little to none",
    communities: ["Youth sports parents & coaches", "Local sports leagues / intramurals", "Parents of young children", "Parents of teens / student athletes"],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app", "Service business"],
  }),
  E01: p({
    role: ["Software engineer"],
    skills: ["Full-stack development", "React / Next.js"],
    technicalLevel: "Strong developer",
    communities: [],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Software / app"],
  }),
  E02: p({
    role: ["Non-technical founder"],
    skills: ["Marketing (digital)", "Sales / closing deals"],
    technicalLevel: "Little to none",
    communities: ["College students / campus life", "Pet owners (dogs, cats)", "Car enthusiasts / gearheads"],
    goal: ["Still figuring it out"],
    monetizationPref: ["Not sure yet"],
    buildType: ["Not sure yet"],
  }),
  E03: p({
    role: ["Non-technical founder"],
    skills: ["Outbound / cold outreach", "Copywriting", "Community management"],
    technicalLevel: "Little to none",
    communities: ["Freelancers / consultants", "Small business owners"],
    goal: ["Build a profitable side project"],
    monetizationPref: ["Subscriptions (recurring)"],
    buildType: ["Service business"],
  }),
};

// ─── 20 Test Cases ────────────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [
  // ── No instruction (10) ──────────────────────────────────────────────────
  {
    id: "P01",
    label: "Senior full-stack, indie hacker community — no instruction",
    profile: profiles.T01,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P02",
    label: "ML engineer, funded startup, AI/ML community — no instruction",
    profile: profiles.T02,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P03",
    label: "Student athlete / league organizer, strong coder — no instruction",
    profile: profiles.S04,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P04",
    label: "B2B sales pro, knows SMBs, no coding — no instruction",
    profile: profiles.N01,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P05",
    label: "UI/UX designer, design community, funded startup — no instruction",
    profile: profiles.N03,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P06",
    label: "Twitch streamer + developer, creator communities — no instruction",
    profile: profiles.D04,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P07",
    label: "Youth sports organizer, parent community — no instruction",
    profile: profiles.D08,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P08",
    label: "Weak distribution, generic interests — no instruction (should penalize)",
    profile: profiles.E01,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P09",
    label: "Broad consumer communities, no constraints — no instruction",
    profile: profiles.E02,
    niche: "",
    group: "no-instruction",
  },
  {
    id: "P10",
    label: "No code, no budget, freelancer network — no instruction",
    profile: profiles.E03,
    niche: "",
    group: "no-instruction",
  },

  // ── With instruction (10, same profiles) ────────────────────────────────
  {
    id: "I01",
    label: "Senior full-stack — target Shopify store owners specifically",
    profile: profiles.T01,
    niche: "I want to build something specifically for Shopify store owners. I know several through my indie hacker and small business communities.",
    group: "with-instruction",
  },
  {
    id: "I02",
    label: "ML engineer, funded startup — no generic AI wrappers",
    profile: profiles.T02,
    niche: "I want ideas outside of generic AI wrappers - something with real workflow lock-in or proprietary data",
    group: "with-instruction",
  },
  {
    id: "I03",
    label: "Student athlete — 3 intramural leagues, everything in spreadsheets",
    profile: profiles.S04,
    niche: "I run 3 intramural leagues and every single admin task is in Google Sheets or GroupMe.",
    group: "with-instruction",
  },
  {
    id: "I04",
    label: "B2B sales pro — no coding, fast monetization",
    profile: profiles.N01,
    niche: "No coding. Want something I can build or operate without developers. Fast monetization.",
    group: "with-instruction",
  },
  {
    id: "I05",
    label: "UI/UX designer — real designer/PM workflow problem, not a portfolio tool",
    profile: profiles.N03,
    niche: "I want to build something that solves a real designer or PM workflow problem. Not a portfolio tool.",
    group: "with-instruction",
  },
  {
    id: "I06",
    label: "Twitch streamer — solo SaaS under $500/mo, prove market first",
    profile: profiles.D04,
    niche: "Wants solo SaaS under $500/mo to start. Prove the market before going bigger.",
    group: "with-instruction",
  },
  {
    id: "I07",
    label: "Youth sports organizer — 6 leagues, scheduling/payments in spreadsheets",
    profile: profiles.D08,
    niche: "I coordinate 6 youth leagues. Scheduling, communications, payments, and rosters are all in spreadsheets and text threads.",
    group: "with-instruction",
  },
  {
    id: "I08",
    label: "Generic interests — fitness/gaming/productivity (should penalize)",
    profile: profiles.E01,
    niche: "I want to build a SaaS. Interested in fitness, gaming, and productivity.",
    group: "with-instruction",
  },
  {
    id: "I09",
    label: "Broad consumer communities — targeting dog owners specifically",
    profile: profiles.E02,
    niche: "I want to build something for dog owners specifically. I personally know hundreds of dog owners through my community.",
    group: "with-instruction",
  },
  {
    id: "I10",
    label: "No code, no budget — first $500 in 30 days",
    profile: profiles.E03,
    niche: "No code at all. No budget. Need to make my first $500 within 30 days. Solo operation.",
    group: "with-instruction",
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

interface Result {
  id: string;
  label: string;
  group: "no-instruction" | "with-instruction";
  profileText: string;
  niche: string;
  output: IdeaDiscovery | null;
  error: string | null;
  durationMs: number;
}

async function runCase(tc: TestCase): Promise<Result> {
  const profileText = founderProfileToText(tc.profile);
  const start = Date.now();

  try {
    let finalObject: IdeaDiscovery | null = null;

    const { partialObjectStream } = streamObject({
      model: openai("gpt-4o"),
      schema: ideaDiscoverySchema,
      system: DISCOVER_SYSTEM_LEAN,
      prompt: buildDiscoverPrompt({ niche: tc.niche, founderProfileText: profileText }),
      temperature: 1,
    });

    for await (const partial of partialObjectStream) {
      finalObject = partial as IdeaDiscovery;
    }

    return { id: tc.id, label: tc.label, group: tc.group, profileText, niche: tc.niche, output: finalObject, error: null, durationMs: Date.now() - start };
  } catch (err) {
    return { id: tc.id, label: tc.label, group: tc.group, profileText, niche: tc.niche, output: null, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
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

function groupSummaryTable(results: Result[]): string {
  const lines: string[] = [];
  lines.push(`| # | ID | Label | Ideas | Duration | Status |`);
  lines.push(`|---|-----|-------|-------|----------|--------|`);
  for (const [i, r] of results.entries()) {
    const ideas = r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0;
    const status = r.error ? "ERROR" : "OK";
    lines.push(`| ${i + 1} | ${r.id} | ${r.label} | ${ideas} | ${(r.durationMs / 1000).toFixed(1)}s | ${status} |`);
  }
  lines.push(``);
  const avgDuration = results.reduce((s, r) => s + r.durationMs, 0) / results.length;
  const totalIdeas = results.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);
  lines.push(`**Avg duration:** ${(avgDuration / 1000).toFixed(1)}s | **Total ideas:** ${totalIdeas} | **Avg ideas/case:** ${(totalIdeas / results.length).toFixed(1)}`);
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CONCURRENCY = 3;

async function main() {
  console.log(`Discover v3 eval: lean + gpt-4o | ${TEST_CASES.length} cases (${TEST_CASES.filter(t => t.group === "no-instruction").length} no-instruction, ${TEST_CASES.filter(t => t.group === "with-instruction").length} with-instruction)\n`);

  const allResults: Result[] = [];

  for (let i = 0; i < TEST_CASES.length; i += CONCURRENCY) {
    const batch = TEST_CASES.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(tc => runCase(tc)));
    allResults.push(...batchResults);
    for (const r of batchResults) {
      const ideas = r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0;
      const status = r.error ? `FAILED: ${r.error.slice(0, 60)}` : `OK (${(r.durationMs / 1000).toFixed(1)}s, ${ideas} ideas)`;
      console.log(`  [${r.id}] ${r.group === "no-instruction" ? "no-instr" : "with-instr"} | ${status}`);
    }
    if (i + CONCURRENCY < TEST_CASES.length) await new Promise(res => setTimeout(res, 800));
  }

  const noInstrResults = allResults.filter(r => r.group === "no-instruction");
  const withInstrResults = allResults.filter(r => r.group === "with-instruction");

  const totalIdeas = allResults.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);
  const noInstrIdeas = noInstrResults.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);
  const withInstrIdeas = withInstrResults.reduce((s, r) => s + (r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0), 0);

  // ── Build report ────────────────────────────────────────────────────────────

  const header = [
    `# Discover v3 Eval — Lean + gpt-4o`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Model:** lean prompt + gpt-4o (production config)`,
    `**Cases:** ${TEST_CASES.length} total | ${noInstrResults.length} profile-only | ${withInstrResults.length} with instruction`,
    ``,
    `---`,
    ``,
    `## High-Level Summary`,
    ``,
    `| Group | Cases | Total Ideas | Avg Ideas/Case | Avg Duration | Errors |`,
    `|-------|-------|-------------|----------------|--------------|--------|`,
    (() => {
      const avgDur = (noInstrResults.reduce((s, r) => s + r.durationMs, 0) / noInstrResults.length / 1000).toFixed(1);
      const errors = noInstrResults.filter(r => r.error).length;
      return `| Profile-only (no instruction) | ${noInstrResults.length} | ${noInstrIdeas} | ${(noInstrIdeas / noInstrResults.length).toFixed(1)} | ${avgDur}s | ${errors} |`;
    })(),
    (() => {
      const avgDur = (withInstrResults.reduce((s, r) => s + r.durationMs, 0) / withInstrResults.length / 1000).toFixed(1);
      const errors = withInstrResults.filter(r => r.error).length;
      return `| With instruction | ${withInstrResults.length} | ${withInstrIdeas} | ${(withInstrIdeas / withInstrResults.length).toFixed(1)} | ${avgDur}s | ${errors} |`;
    })(),
    (() => {
      const avgDur = (allResults.reduce((s, r) => s + r.durationMs, 0) / allResults.length / 1000).toFixed(1);
      const errors = allResults.filter(r => r.error).length;
      return `| **All 20** | **${allResults.length}** | **${totalIdeas}** | **${(totalIdeas / allResults.length).toFixed(1)}** | **${avgDur}s** | **${errors}** |`;
    })(),
    ``,
    `*Lower avg ideas/case = tighter quality gate (target: 4-6 per run). Higher is more likely padding.*`,
    ``,
    `---`,
    ``,
    `## Test Cases Reference`,
    ``,
    `| ID | Group | Label | Instruction |`,
    `|----|-------|-------|-------------|`,
    ...TEST_CASES.map(tc => `| ${tc.id} | ${tc.group} | ${tc.label} | ${tc.niche ? tc.niche.slice(0, 60) + (tc.niche.length > 60 ? "..." : "") : "(none)"} |`),
    ``,
    `---`,
    ``,
  ].join("\n");

  // No-instruction section
  const noInstrSection = [
    `# Profile-Only: No Instruction`,
    ``,
    `These 10 cases give the model only the founder profile — no direct niche input. Tests whether the model can identify strong opportunities from distribution + workflow signals alone.`,
    ``,
    groupSummaryTable(noInstrResults),
    ``,
    `### Detailed Results`,
    ``,
    ...noInstrResults.map((r, i) => formatResult(r, i) + "\n"),
    `---`,
    ``,
  ].join("\n");

  // With-instruction section
  const withInstrSection = [
    `# With Instruction`,
    ``,
    `Same 10 profiles, each with a specific founder instruction. Tests whether the model correctly overrides profile interests with the direct instruction, honors hard constraints, and avoids loophole-seeking.`,
    ``,
    groupSummaryTable(withInstrResults),
    ``,
    `### Detailed Results`,
    ``,
    ...withInstrResults.map((r, i) => formatResult(r, i) + "\n"),
    `---`,
    ``,
  ].join("\n");

  // Side-by-side comparison per profile
  const profileIds = ["T01","T02","S04","N01","N03","D04","D08","E01","E02","E03"];
  const profileLabels: Record<string, string> = {
    T01: "Senior full-stack, indie hacker",
    T02: "ML engineer, funded startup",
    S04: "Student athlete, league organizer",
    N01: "B2B sales, no coding",
    N03: "UI/UX designer, funded startup",
    D04: "Twitch streamer + developer",
    D08: "Youth sports organizer",
    E01: "Weak distribution, generic interests",
    E02: "Broad consumer communities",
    E03: "No code, no budget",
  };
  const noInstrIds = ["P01","P02","P03","P04","P05","P06","P07","P08","P09","P10"];
  const withInstrIds = ["I01","I02","I03","I04","I05","I06","I07","I08","I09","I10"];

  const comparisons: string[] = [
    `# Side-by-Side: Profile-Only vs With Instruction`,
    ``,
    `For each profile: compare what the model produced with and without the instruction.`,
    ``,
  ];

  for (let i = 0; i < profileIds.length; i++) {
    const profileKey = profileIds[i];
    const noInstrId = noInstrIds[i];
    const withInstrId = withInstrIds[i];
    const noInstrR = allResults.find(r => r.id === noInstrId);
    const withInstrR = allResults.find(r => r.id === withInstrId);

    comparisons.push(`## Profile: ${profileKey} — ${profileLabels[profileKey]}`);
    comparisons.push(``);
    comparisons.push(`| Version | Ideas | Avg Score | Avg Dist | Zones |`);
    comparisons.push(`|---------|-------|-----------|----------|-------|`);

    for (const [label, r] of [["No instruction", noInstrR], ["With instruction", withInstrR]] as [string, Result | undefined][]) {
      if (!r || r.error) {
        comparisons.push(`| ${label} | ${r?.error ? "ERROR" : "—"} | — | — | — |`);
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
      comparisons.push(`| ${label} | ${ideas.length} | ${avgScore} | ${avgDist} | ${zones.length} |`);
    }
    comparisons.push(``);

    for (const [label, r] of [["No instruction", noInstrR], ["With instruction", withInstrR]] as [string, Result | undefined][]) {
      if (!r?.output) continue;
      const ideas = r.output.opportunityZones?.flatMap(z => z.ideas ?? []) ?? [];
      comparisons.push(`**${label}** (${ideas.length} ideas):`);
      if (r.niche) comparisons.push(`*Instruction: "${r.niche.slice(0, 80)}${r.niche.length > 80 ? "..." : ""}"*`);
      for (const idea of ideas) {
        comparisons.push(`- ${idea.title} (${idea.opportunityScore ?? "?"}) — dist:${idea.founderFitScore?.distributionAdvantage ?? "?"}`);
      }
      comparisons.push(``);
    }

    comparisons.push(`**Evaluator judgment:**`);
    comparisons.push(`- Instruction improved output: [ ] Yes  [ ] No  [ ] Mixed`);
    comparisons.push(`- Notes: `);
    comparisons.push(``);
  }

  const report = header + noInstrSection + withInstrSection + comparisons.join("\n");
  fs.writeFileSync(path.join(__dirname, "../results/discover-v3.md"), report, "utf-8");
  console.log(`\nReport written to test/results/discover-v3.md`);
}

main().catch(console.error);
