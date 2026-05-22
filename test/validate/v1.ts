/**
 * Validate eval — gpt-4o vs gpt-4o-mini vs claude-sonnet-4-6
 * Run: npx tsx eval-validate.ts
 *
 * 5 ideas: 2 great, 1 middle, 2 bad
 * 1 shared founder profile (strong full-stack indie hacker, side project goal)
 * 3 models × 5 cases = 15 calls
 * Output: eval-validate-results.md
 */

import "dotenv/config";
import path from "path";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { ANALYST_SYSTEM, buildAnalystPrompt } from "../../src/lib/ai/prompts";
import { ideaReportSchema, type IdeaReport } from "../../src/lib/schemas/idea-report";
import { founderProfileToText, type FounderProfile } from "../../src/lib/profile/founder-profile";
import * as fs from "fs";

// ─── Shared founder profile ───────────────────────────────────────────────────

const FOUNDER: FounderProfile = {
  role: ["Software engineer"],
  skills: [
    "Full-stack development",
    "React / Next.js",
    "Backend development",
    "SQL / database queries",
    "TypeScript",
  ],
  technicalLevel: "Full-stack / senior engineer",
  communities: [
    "Startup founders / indie hackers",
    "Software developers / engineers",
    "Freelancers / consultants",
    "Small business owners",
  ],
  goal: ["Build a profitable side project"],
  monetizationPref: ["Subscriptions (recurring)"],
  buildType: ["Software / app"],
  completedAt: new Date().toISOString(),
};

const FOUNDER_TEXT = founderProfileToText(FOUNDER);

// ─── Empty digest (same for all models — isolates reasoning quality) ──────────

const DIGEST =
  "No snippets gathered for this eval run. Base your analysis on your own market knowledge, startup history, and first-principles reasoning. Use calibrated language: 'reasoning suggests', 'market history shows'.";

// ─── Test cases ───────────────────────────────────────────────────────────────

interface TestCase {
  id: string;
  label: string;
  expectedTier: "great" | "middle" | "bad";
  topic: string;
  whyExpected: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: "V01",
    label: "Invoice reminder automation for freelancers",
    expectedTier: "great",
    topic:
      "Invoice reminder automation for freelance web developers — automatically sends customizable follow-up emails when invoices go overdue, integrates with FreshBooks, Wave, and Harvest, and shows an aging dashboard with days-outstanding tracking and one-click resend.",
    whyExpected:
      "Clear payer (freelancers already pay $15-30/mo for invoicing software), strong workflow pain (manual follow-up is universal), measurable ROI, reachable via freelancer and dev communities. Should score GOOD-GREAT (65+).",
  },
  {
    id: "V02",
    label: "Changelog generator for software teams",
    expectedTier: "great",
    topic:
      "Changelog generator for software teams — connects to GitHub PRs and Jira tickets, auto-drafts customer-facing release notes using AI, lets product managers review and publish with one click. Outputs to Notion, email digest, and in-app widget.",
    whyExpected:
      "Dev tools have strong existing spend, clear B2B workflow pain, obvious seat-based pricing, founder has exact skills. Should score GOOD-GREAT (65+).",
  },
  {
    id: "V03",
    label: "AI LinkedIn ghostwriter for B2B salespeople",
    expectedTier: "middle",
    topic:
      "AI LinkedIn ghostwriter for B2B salespeople — generates personalized thought leadership posts based on industry trends, company news, and the rep's own deal history. Schedules posts, tracks engagement metrics, and suggests follow-up replies.",
    whyExpected:
      "Real demand and real payers, but Taplio, Shield Analytics, and Authory already own this category. Differentiation unclear. Founder has no sales audience for distribution. Should score UNCLEAR (40-64).",
  },
  {
    id: "V04",
    label: "Anonymous neighbor and landlord rating app",
    expectedTier: "bad",
    topic:
      "A mobile app where apartment residents can anonymously rate and review their neighbors and landlords, helping renters avoid noisy neighbors and bad management before signing a lease. Community-sourced ratings, photo uploads, and a search by address.",
    whyExpected:
      "Anonymous social rating of real people = fatal structural pattern: legal liability, trust collapse, toxic dynamics, zero monetization path. Multiple fatal flags. Should score NON-STARTER (0-24).",
  },
  {
    id: "V05",
    label: "ChatGPT Chrome extension for page summarization",
    expectedTier: "bad",
    topic:
      "A Chrome extension that uses ChatGPT to summarize any webpage or article with a clean sidebar UI, history of recent summaries, and the ability to ask follow-up questions about the page content.",
    whyExpected:
      "Generic AI wrapper with no proprietary data, moat, or distribution. Chrome Web Store has 50+ identical extensions. Browsers are shipping native AI features. No payer, no workflow lock-in, no retention. Should score NON-STARTER or WEAK (0-35).",
  },
];

// ─── Models ───────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "gpt-4o",          label: "gpt-4o",           model: openai("gpt-4o") },
  { id: "gpt-4o-mini",     label: "gpt-4o-mini",      model: openai("gpt-4o-mini") },
  { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6", model: anthropic("claude-sonnet-4-6") },
] as const;

// ─── Runner ───────────────────────────────────────────────────────────────────

interface Result {
  caseId: string;
  caseLabel: string;
  expectedTier: "great" | "middle" | "bad";
  modelId: string;
  modelLabel: string;
  output: IdeaReport | null;
  error: string | null;
  durationMs: number;
}

async function runCell(tc: TestCase, m: typeof MODELS[number]): Promise<Result> {
  const start = Date.now();
  try {
    const { object } = await generateObject({
      model: m.model,
      schema: ideaReportSchema,
      system: ANALYST_SYSTEM,
      prompt: buildAnalystPrompt({
        topic: tc.topic,
        founderProfile: FOUNDER_TEXT,
        digest: DIGEST,
        manualBlock: "",
        gatherErrorsBlock: "",
      }),
      temperature: 0.2,
    });
    return {
      caseId: tc.id,
      caseLabel: tc.label,
      expectedTier: tc.expectedTier,
      modelId: m.id,
      modelLabel: m.label,
      output: object,
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      caseId: tc.id,
      caseLabel: tc.label,
      expectedTier: tc.expectedTier,
      modelId: m.id,
      modelLabel: m.label,
      output: null,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function tierEmoji(tier: "great" | "middle" | "bad"): string {
  return tier === "great" ? "✓ GREAT" : tier === "middle" ? "~ MIDDLE" : "✗ BAD";
}

function scoreBand(score: number): string {
  if (score >= 80) return "GREAT";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "UNCLEAR";
  if (score >= 25) return "WEAK";
  return "NON-STARTER";
}

function calibrationGrade(expected: "great" | "middle" | "bad", score: number): string {
  const band = scoreBand(score);
  if (expected === "great" && score >= 65) return "PASS";
  if (expected === "great" && score >= 50) return "PARTIAL";
  if (expected === "great") return "FAIL";
  if (expected === "middle" && score >= 40 && score <= 70) return "PASS";
  if (expected === "middle") return "PARTIAL";
  if (expected === "bad" && score <= 40) return "PASS";
  if (expected === "bad" && score <= 55) return "PARTIAL";
  return "FAIL";
  void band;
}

function formatModelResult(r: Result): string {
  const lines: string[] = [];

  if (r.error) {
    lines.push(`**${r.modelLabel}** — ERROR: ${r.error.slice(0, 120)}`);
    return lines.join("\n");
  }

  const o = r.output!;
  const score = o.validationQuality.buildGateScore;
  const verdict = o.validationQuality.verdict;
  const cal = calibrationGrade(r.expectedTier, score);
  const band = scoreBand(score);

  lines.push(`**${r.modelLabel}** — Score: **${score}/100** (${band}) — Verdict: *${verdict}* — Calibration: **${cal}** — ${(r.durationMs / 1000).toFixed(1)}s`);
  lines.push(``);
  lines.push(`*${o.validationQuality.summary}*`);
  lines.push(``);

  lines.push(`**Reasons:**`);
  for (const reason of o.validationQuality.reasons) {
    lines.push(`- ${reason}`);
  }
  lines.push(``);

  lines.push(`**Probability scores:**`);
  lines.push(`- Monetization potential: ${o.probabilityScores.monetizationPotential}`);
  lines.push(`- Ease of acquisition: ${o.probabilityScores.easeOfAcquisition}`);
  lines.push(`- Competition intensity: ${o.probabilityScores.competitionIntensity}`);
  lines.push(`- Founder viability: ${o.probabilityScores.founderViability}`);
  lines.push(``);

  lines.push(`**Top signals:**`);
  for (const s of o.topSignals) {
    lines.push(`- [${s.strength}${s.wtpEvidence ? " / WTP" : ""}] ${s.observation}`);
  }
  lines.push(``);

  if (o.dontBuildWarnings.length > 0) {
    lines.push(`**Don't build warnings:**`);
    for (const w of o.dontBuildWarnings) {
      lines.push(`- [${w.severity}] **${w.title}**: ${w.detail}`);
    }
    lines.push(``);
  }

  if (o.weakDemandSignals.length > 0) {
    lines.push(`**Weak demand signals:** ${o.weakDemandSignals.slice(0, 3).join("; ")}`);
    lines.push(``);
  }

  return lines.join("\n");
}

function buildReport(allResults: Result[]): string {
  const modelIds = MODELS.map(m => m.id);

  // ── Summary table ──────────────────────────────────────────────────────────

  const header = [
    `# Validate Eval — gpt-4o vs gpt-4o-mini vs claude-sonnet-4-6`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Founder profile:** Senior full-stack / indie hacker, side project goal, subscription SaaS`,
    `**Digest:** None (models reason from own knowledge — isolates reasoning quality)`,
    `**Cases:** 5 (2 great, 1 middle, 2 bad) × 3 models = 15 calls`,
    ``,
    `---`,
    ``,
    `## Summary Scoreboard`,
    ``,
    `| Case | Expected | ${MODELS.map(m => m.label).join(" | ")} |`,
    `|------|----------|${MODELS.map(() => "---").join("|")}|`,
    ...TEST_CASES.map(tc => {
      const cells = modelIds.map(mid => {
        const r = allResults.find(r => r.caseId === tc.id && r.modelId === mid);
        if (!r || r.error) return "ERROR";
        const score = r.output!.validationQuality.buildGateScore;
        const cal = calibrationGrade(tc.expectedTier, score);
        return `${score} (${cal})`;
      });
      return `| ${tc.id}: ${tc.label} | ${tierEmoji(tc.expectedTier)} | ${cells.join(" | ")} |`;
    }),
    ``,
    `### Calibration pass rates`,
    ``,
    `| Model | PASS | PARTIAL | FAIL | Avg score (great) | Avg score (bad) |`,
    `|-------|------|---------|------|-------------------|-----------------|`,
    ...MODELS.map(m => {
      const results = allResults.filter(r => r.modelId === m.id && !r.error);
      const passes = results.filter(r => calibrationGrade(r.expectedTier, r.output!.validationQuality.buildGateScore) === "PASS").length;
      const partials = results.filter(r => calibrationGrade(r.expectedTier, r.output!.validationQuality.buildGateScore) === "PARTIAL").length;
      const fails = results.filter(r => calibrationGrade(r.expectedTier, r.output!.validationQuality.buildGateScore) === "FAIL").length;
      const greatResults = results.filter(r => r.expectedTier === "great");
      const badResults = results.filter(r => r.expectedTier === "bad");
      const avgGreat = greatResults.length
        ? (greatResults.reduce((s, r) => s + r.output!.validationQuality.buildGateScore, 0) / greatResults.length).toFixed(0)
        : "—";
      const avgBad = badResults.length
        ? (badResults.reduce((s, r) => s + r.output!.validationQuality.buildGateScore, 0) / badResults.length).toFixed(0)
        : "—";
      return `| ${m.label} | ${passes}/5 | ${partials}/5 | ${fails}/5 | ${avgGreat} | ${avgBad} |`;
    }),
    ``,
    `---`,
    ``,
  ].join("\n");

  // ── Per-case detail ────────────────────────────────────────────────────────

  const caseDetails: string[] = [];

  for (const tc of TEST_CASES) {
    caseDetails.push(`## ${tc.id}: ${tc.label}`);
    caseDetails.push(``);
    caseDetails.push(`**Expected tier:** ${tierEmoji(tc.expectedTier)}`);
    caseDetails.push(`**Why expected:** ${tc.whyExpected}`);
    caseDetails.push(``);
    caseDetails.push(`**Idea:**`);
    caseDetails.push(`> ${tc.topic}`);
    caseDetails.push(``);

    for (const m of MODELS) {
      const r = allResults.find(r => r.caseId === tc.id && r.modelId === m.id);
      if (!r) {
        caseDetails.push(`**${m.label}** — Not run`);
      } else {
        caseDetails.push(formatModelResult(r));
      }
      caseDetails.push(`---`);
    }

    caseDetails.push(``);
  }

  // ── Per-model score timeline ───────────────────────────────────────────────

  const modelSummary: string[] = [
    `## Per-model score summary`,
    ``,
  ];

  for (const m of MODELS) {
    const results = allResults.filter(r => r.modelId === m.id);
    modelSummary.push(`### ${m.label}`);
    modelSummary.push(``);
    modelSummary.push(`| Case | Expected | Score | Band | Verdict | Calibration | Duration |`);
    modelSummary.push(`|------|----------|-------|------|---------|-------------|----------|`);
    for (const r of results) {
      if (r.error) {
        modelSummary.push(`| ${r.caseId} | ${tierEmoji(r.expectedTier)} | ERROR | — | — | — | ${(r.durationMs / 1000).toFixed(1)}s |`);
        continue;
      }
      const score = r.output!.validationQuality.buildGateScore;
      const band = scoreBand(score);
      const verdict = r.output!.validationQuality.verdict;
      const cal = calibrationGrade(r.expectedTier, score);
      modelSummary.push(`| ${r.caseId} | ${tierEmoji(r.expectedTier)} | ${score} | ${band} | ${verdict} | ${cal} | ${(r.durationMs / 1000).toFixed(1)}s |`);
    }
    const validResults = results.filter(r => !r.error);
    const avgScore = validResults.length
      ? (validResults.reduce((s, r) => s + r.output!.validationQuality.buildGateScore, 0) / validResults.length).toFixed(0)
      : "—";
    const avgDur = (results.reduce((s, r) => s + r.durationMs, 0) / results.length / 1000).toFixed(1);
    modelSummary.push(``);
    modelSummary.push(`**Avg score:** ${avgScore} | **Avg duration:** ${avgDur}s`);
    modelSummary.push(``);
  }

  return header + caseDetails.join("\n") + "\n\n" + modelSummary.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Validate eval: 5 cases × 3 models = 15 calls\n`);
  console.log(`Founder: Senior full-stack / indie hacker, side project goal`);
  console.log(`Models: gpt-4o | gpt-4o-mini | claude-sonnet-4-6\n`);

  const allResults: Result[] = [];

  for (const tc of TEST_CASES) {
    console.log(`\nRunning [${tc.id}] ${tc.label} (expected: ${tc.expectedTier}) ...`);

    // Run all 3 models concurrently for each case
    const cellResults = await Promise.all(
      MODELS.map(m => runCell(tc, m))
    );

    for (const r of cellResults) {
      allResults.push(r);
      if (r.error) {
        console.log(`  ${r.modelLabel}: ERROR — ${r.error.slice(0, 80)}`);
      } else {
        const score = r.output!.validationQuality.buildGateScore;
        const cal = calibrationGrade(r.expectedTier, score);
        console.log(`  ${r.modelLabel}: score=${score} (${scoreBand(score)}) cal=${cal} ${(r.durationMs / 1000).toFixed(1)}s`);
      }
    }

    // Brief pause between cases
    if (tc !== TEST_CASES[TEST_CASES.length - 1]) {
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  console.log(`\nBuilding report...`);
  const report = buildReport(allResults);
  fs.writeFileSync(path.join(__dirname, "../results/validate-v1.md"), report, "utf-8");
  console.log(`Report written to test/results/validate-v1.md`);
}

main().catch(console.error);
