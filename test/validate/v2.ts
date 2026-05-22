/**
 * Validate v2 eval — gpt-4o vs claude-sonnet-4-6
 * Run: npx tsx eval-validate-v2.ts
 *
 * 10 test cases (same for both models) — 2 great, 3 good/middle, 3 middle/tricky, 2 bad
 * 1 shared founder profile (senior full-stack, indie hacker, side project goal)
 * 2 models × 10 cases = 20 calls, timed per-call and total
 * Output: eval-validate-v2-results.md
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

const DIGEST =
  "No snippets gathered for this eval. Base your analysis on your own market knowledge, startup history, and first-principles reasoning. Use calibrated language: 'reasoning suggests', 'market history shows'.";

// ─── Test cases ───────────────────────────────────────────────────────────────

type Tier = "great" | "good" | "middle" | "bad";

interface TestCase {
  id: string;
  label: string;
  tier: Tier;
  expectedScore: string;
  topic: string;
  thesis: string;
}

const TEST_CASES: TestCase[] = [
  // ── 2 Great ──────────────────────────────────────────────────────────────
  {
    id: "C01",
    label: "Client reporting automation for solo bookkeepers",
    tier: "great",
    expectedScore: "70–90",
    topic:
      "Automated client reporting for solo bookkeepers — pulls transaction data from QuickBooks and Xero via API, generates clean monthly cash-flow and P&L PDFs with branded charts, and emails them automatically to each client on a schedule the bookkeeper sets. The bookkeeper spends zero time on report assembly.",
    thesis:
      "Clear payer (solo bookkeepers pay $30–80/mo for tools, and client reporting is their most hated time sink), measurable ROI (2–4 hours saved per client per month), reachable via bookkeeper forums and Facebook groups. Should score GOOD–GREAT (70+).",
  },
  {
    id: "C02",
    label: "Policy renewal tracker for independent insurance agents",
    tier: "great",
    expectedScore: "70–90",
    topic:
      "Policy renewal CRM for independent insurance agents — tracks all client policy expiration dates across carriers, auto-sends renewal reminder emails and texts on a configurable schedule, logs follow-up outcomes, and shows an agent-level revenue-at-risk dashboard (policies due in 30/60/90 days). Replaces the spreadsheets most independent agents use today.",
    thesis:
      "Very high-value niche (insurance agents earn 10–20% commission; one saved renewal pays for years of subscription), clear payer, painful manual workflow (spreadsheet-based tracking is universal among solo agents), reachable via independent agent associations and forums. Should score GOOD–GREAT (70+).",
  },

  // ── 3 Good / Middle ──────────────────────────────────────────────────────
  {
    id: "C03",
    label: "Code review quality tracker for engineering managers",
    tier: "good",
    expectedScore: "60–78",
    topic:
      "Code review quality tracker for engineering managers — integrates with GitHub, measures PR review thoroughness (comments per PR, round-trip count, time-to-first-review), surfaces engineers who are rubber-stamping reviews, and sends a weekly Slack digest with trend charts. Helps managers catch review quality problems before they become bugs in production.",
    thesis:
      "Dev tools have strong existing spend, clear B2B workflow pain (rubber-stamp reviews are a real management problem), obvious seat-based pricing, and the founder can build and sell into developer/startup communities. Competitive but differentiated enough. Should score GOOD (60–78).",
  },
  {
    id: "C04",
    label: "Shopify product description A/B tester using review data",
    tier: "good",
    expectedScore: "55–75",
    topic:
      "Product description optimizer for Shopify stores — scrapes the store's own reviews to extract the exact language customers use to describe the product, generates multiple description variants using that language, runs native A/B tests against the control, and surfaces the winner with statistical confidence. No copywriting required.",
    thesis:
      "Shopify merchants pay for apps, have a clear conversion ROI, and the review-language angle is a real differentiator over generic AI copy tools. Competitive (CopyAI, Jasper exist) but the Shopify App Store gives distribution. Should score GOOD (55–75).",
  },
  {
    id: "C05",
    label: "Async standup bot for remote engineering teams",
    tier: "good",
    expectedScore: "55–72",
    topic:
      "Async standup bot for Slack — sends daily prompts to each team member, collects responses, detects blockers using keyword matching, and posts a formatted digest to a team channel. Managers get a weekly rollup of recurring blockers. Works entirely inside Slack with no new app to learn.",
    thesis:
      "Remote teams pay for productivity tools, Slack integrations have strong distribution, and the blocker-detection angle is a real differentiator over simple standup bots. But Geekbot and Standuply already exist and are established. Should score GOOD (55–72).",
  },

  // ── 3 Middle / Tricky ────────────────────────────────────────────────────
  {
    id: "C06",
    label: "Simple yoga studio management for studios under 5 staff",
    tier: "middle",
    expectedScore: "35–58",
    topic:
      "Lightweight class scheduling and membership management for small yoga and pilates studios — handles class bookings, monthly membership billing via Stripe, automated class reminder texts, and a simple attendance dashboard. Positioned as the un-Mindbody: no onboarding fee, no long contract, under $50/month.",
    thesis:
      "Real pain (Mindbody is notoriously overpriced and complex for small studios), real payers, but Glofox, PushPress, and WellnessLiving already target this exact wedge. Also requires selling into a non-technical vertical with long sales cycles. Should score MIDDLE (35–58).",
  },
  {
    id: "C07",
    label: "Job application tracker with AI follow-up drafts",
    tier: "middle",
    expectedScore: "25–52",
    topic:
      "AI job application tracker — pastes a job description URL, auto-parses the role and company, tracks application status (applied, interview, offer, rejected), generates personalized follow-up email drafts based on the JD and the company's recent news, and shows a pipeline dashboard of all active applications.",
    thesis:
      "Real frustration (job seekers hate tracking and drafting follow-ups), but job seekers are historically price-sensitive and use free tools (Notion, Huntr, Google Sheets). Low retention after job search ends. Founder has no distribution into job seekers. Should score MIDDLE-WEAK (25–52).",
  },
  {
    id: "C08",
    label: "Peer-to-peer dog sitting marketplace",
    tier: "middle",
    expectedScore: "20–45",
    topic:
      "Peer-to-peer dog sitting marketplace for neighborhood dog owners — connects dog owners with verified sitters within a 2-mile radius, handles booking, payment, and real-time photo updates during the sit. Sitters set their own rates. Platform takes 15% of each transaction.",
    thesis:
      "Real demand and real spend (pet care is a large market), but Rover already owns this category with millions of sitters, massive trust infrastructure, and SEO dominance. Classic two-sided cold-start problem with geographic density requirements. Should score WEAK (20–45).",
  },

  // ── 2 Bad ────────────────────────────────────────────────────────────────
  {
    id: "C09",
    label: "Generic AI customer support chatbot builder",
    tier: "bad",
    expectedScore: "0–30",
    topic:
      "No-code AI customer support chatbot builder — any business can paste their FAQ, upload a PDF, or connect their Notion docs, and get an embeddable chat widget trained on their content. Deploy to any website with a single script tag. No technical setup required.",
    thesis:
      "Completely commoditized. Intercom, Zendesk, Freshdesk, Crisp, Tidio, and at least 50 funded startups (Chatbase, Dante AI, CustomGPT) do exactly this. Users are overwhelmed with free tiers. No moat, no differentiation, no distribution. Should score NON-STARTER (0–30).",
  },
  {
    id: "C10",
    label: "Social travel planning app for friend groups",
    tier: "bad",
    expectedScore: "0–30",
    topic:
      "Collaborative travel planning app for friend groups — create a trip, invite friends, vote on destination and dates, build a shared itinerary with places and activities, split costs automatically, and get AI-suggested packing lists and local tips. Works on iOS and Android.",
    thesis:
      "Classic consumer social app in a crowded space (TripIt, Wanderlog, TripAdvisor, Google Trips all exist for free), no payer, no retention after trip ends, and viral growth is the only acquisition path for a friend-group product. Should score NON-STARTER (0–30).",
  },
];

// ─── Models ───────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "gpt-4o",            label: "gpt-4o",            model: openai("gpt-4o") },
  { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6", model: anthropic("claude-sonnet-4-6") },
] as const;

// ─── Runner ───────────────────────────────────────────────────────────────────

interface Result {
  caseId: string;
  caseLabel: string;
  tier: Tier;
  expectedScore: string;
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
    return { caseId: tc.id, caseLabel: tc.label, tier: tc.tier, expectedScore: tc.expectedScore, modelId: m.id, modelLabel: m.label, output: object, error: null, durationMs: Date.now() - start };
  } catch (err) {
    return { caseId: tc.id, caseLabel: tc.label, tier: tc.tier, expectedScore: tc.expectedScore, modelId: m.id, modelLabel: m.label, output: null, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function scoreBand(score: number): string {
  if (score >= 80) return "GREAT";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "UNCLEAR";
  if (score >= 25) return "WEAK";
  return "NON-STARTER";
}

function calibration(tier: Tier, score: number): "PASS" | "PARTIAL" | "FAIL" {
  if (tier === "great")  return score >= 65 ? "PASS" : score >= 50 ? "PARTIAL" : "FAIL";
  if (tier === "good")   return (score >= 50 && score <= 80) ? "PASS" : (score >= 40 || score <= 85) ? "PARTIAL" : "FAIL";
  if (tier === "middle") return (score >= 25 && score <= 65) ? "PASS" : "PARTIAL";
  // bad
  return score <= 35 ? "PASS" : score <= 50 ? "PARTIAL" : "FAIL";
}

function tierLabel(t: Tier): string {
  return { great: "✓ GREAT", good: "~ GOOD", middle: "~ MIDDLE", bad: "✗ BAD" }[t];
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtResult(r: Result): string {
  if (r.error) return `**${r.modelLabel}** — ERROR: ${r.error.slice(0, 120)}\n\n---`;

  const o = r.output!;
  const score = o.validationQuality.buildGateScore;
  const band = scoreBand(score);
  const cal = calibration(r.tier, score);
  const dur = (r.durationMs / 1000).toFixed(1);

  const lines: string[] = [];
  lines.push(`**${r.modelLabel}** — Score: **${score}/100** (${band}) | Verdict: *${o.validationQuality.verdict}* | Calibration: **${cal}** | Time: ${dur}s`);
  lines.push(``);
  lines.push(`*${o.validationQuality.summary}*`);
  lines.push(``);
  lines.push(`**Reasons:**`);
  for (const rea of o.validationQuality.reasons) lines.push(`- ${rea}`);
  lines.push(``);
  lines.push(`**Prob scores:** Monetization: ${o.probabilityScores.monetizationPotential} | Acquisition: ${o.probabilityScores.easeOfAcquisition} | Competition: ${o.probabilityScores.competitionIntensity} | Founder: ${o.probabilityScores.founderViability}`);
  lines.push(``);
  lines.push(`**Top signals:**`);
  for (const s of o.topSignals) lines.push(`- [${s.strength}${s.wtpEvidence ? "/WTP" : ""}] ${s.observation}`);
  lines.push(``);
  if (o.dontBuildWarnings.length) {
    lines.push(`**Don't build warnings:**`);
    for (const w of o.dontBuildWarnings) lines.push(`- [${w.severity}] **${w.title}**: ${w.detail.slice(0, 200)}`);
    lines.push(``);
  }
  if (o.weakDemandSignals.length) {
    lines.push(`**Weak signals:** ${o.weakDemandSignals.slice(0, 2).join("; ")}`);
    lines.push(``);
  }
  lines.push(`---`);
  return lines.join("\n");
}

// ─── Report builder ───────────────────────────────────────────────────────────

function buildReport(all: Result[], totalMs: number): string {
  const gpt4o   = all.filter(r => r.modelId === "gpt-4o");
  const sonnet  = all.filter(r => r.modelId === "claude-sonnet-4-6");

  const avgDur = (rs: Result[]) => (rs.reduce((s, r) => s + r.durationMs, 0) / rs.length / 1000).toFixed(1);
  const totalDur = (rs: Result[]) => (rs.reduce((s, r) => s + r.durationMs, 0) / 1000).toFixed(1);
  const avgScore = (rs: Result[]) => {
    const valid = rs.filter(r => r.output);
    return valid.length ? (valid.reduce((s, r) => s + r.output!.validationQuality.buildGateScore, 0) / valid.length).toFixed(0) : "—";
  };
  const countCal = (rs: Result[], c: "PASS" | "PARTIAL" | "FAIL") =>
    rs.filter(r => r.output && calibration(r.tier, r.output.validationQuality.buildGateScore) === c).length;

  const spread = (rs: Result[]) => {
    const greatBad = rs.filter(r => r.tier === "great" || r.tier === "bad");
    const great = greatBad.filter(r => r.tier === "great" && r.output);
    const bad   = greatBad.filter(r => r.tier === "bad" && r.output);
    const avgG = great.length ? great.reduce((s, r) => s + r.output!.validationQuality.buildGateScore, 0) / great.length : 0;
    const avgB = bad.length   ? bad.reduce((s, r) => s + r.output!.validationQuality.buildGateScore, 0) / bad.length : 0;
    return (avgG - avgB).toFixed(0);
  };

  const header = [
    `# Validate v2 Eval — gpt-4o vs claude-sonnet-4-6`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Founder:** Senior full-stack / indie hacker, side project goal, subscription SaaS`,
    `**Cases:** 10 (2 great, 3 good, 3 middle, 2 bad) × 2 models = 20 calls`,
    `**Total wall time:** ${(totalMs / 1000).toFixed(1)}s (cases run sequentially, models per-case run in parallel)`,
    ``,
    `---`,
    ``,
    `## Summary Scoreboard`,
    ``,
    `| # | Case | Tier | Expected | gpt-4o | sonnet |`,
    `|---|------|------|----------|--------|--------|`,
    ...TEST_CASES.map(tc => {
      const g = all.find(r => r.caseId === tc.id && r.modelId === "gpt-4o");
      const s = all.find(r => r.caseId === tc.id && r.modelId === "claude-sonnet-4-6");
      const fmt = (r?: Result) => {
        if (!r || r.error) return "ERROR";
        const score = r.output!.validationQuality.buildGateScore;
        const cal = calibration(r.tier, score);
        const dur = (r.durationMs / 1000).toFixed(1);
        return `${score} (${cal}) ${dur}s`;
      };
      return `| ${tc.id} | ${tc.label} | ${tierLabel(tc.tier)} | ${tc.expectedScore} | ${fmt(g)} | ${fmt(s)} |`;
    }),
    ``,
    `## Calibration Summary`,
    ``,
    `| Model | PASS | PARTIAL | FAIL | Avg score | Avg/call | Total time | Good-bad spread |`,
    `|-------|------|---------|------|-----------|----------|------------|-----------------|`,
    `| gpt-4o | ${countCal(gpt4o, "PASS")}/10 | ${countCal(gpt4o, "PARTIAL")}/10 | ${countCal(gpt4o, "FAIL")}/10 | ${avgScore(gpt4o)} | ${avgDur(gpt4o)}s | ${totalDur(gpt4o)}s | ${spread(gpt4o)} pts |`,
    `| claude-sonnet-4-6 | ${countCal(sonnet, "PASS")}/10 | ${countCal(sonnet, "PARTIAL")}/10 | ${countCal(sonnet, "FAIL")}/10 | ${avgScore(sonnet)} | ${avgDur(sonnet)}s | ${totalDur(sonnet)}s | ${spread(sonnet)} pts |`,
    ``,
    `*Good-bad spread = avg score on great/good ideas minus avg score on bad ideas. Higher = sharper discrimination.*`,
    ``,
    `---`,
    ``,
  ].join("\n");

  const caseBlocks: string[] = [];
  for (const tc of TEST_CASES) {
    const g = all.find(r => r.caseId === tc.id && r.modelId === "gpt-4o");
    const s = all.find(r => r.caseId === tc.id && r.modelId === "claude-sonnet-4-6");

    caseBlocks.push(`## ${tc.id}: ${tc.label}`);
    caseBlocks.push(``);
    caseBlocks.push(`**Tier:** ${tierLabel(tc.tier)} | **Expected score:** ${tc.expectedScore}`);
    caseBlocks.push(`**Thesis:** ${tc.thesis}`);
    caseBlocks.push(``);
    caseBlocks.push(`> ${tc.topic}`);
    caseBlocks.push(``);
    caseBlocks.push(g ? fmtResult(g) : "**gpt-4o** — Not run\n\n---");
    caseBlocks.push(``);
    caseBlocks.push(s ? fmtResult(s) : "**claude-sonnet-4-6** — Not run\n\n---");
    caseBlocks.push(``);
  }

  const perModel: string[] = [
    `## Per-model Detail`,
    ``,
    `### gpt-4o`,
    ``,
    `| Case | Tier | Score | Band | Verdict | Cal | Time |`,
    `|------|------|-------|------|---------|-----|------|`,
    ...gpt4o.map(r => {
      if (r.error) return `| ${r.caseId} | ${tierLabel(r.tier)} | ERR | — | — | — | ${(r.durationMs/1000).toFixed(1)}s |`;
      const score = r.output!.validationQuality.buildGateScore;
      return `| ${r.caseId} | ${tierLabel(r.tier)} | ${score} | ${scoreBand(score)} | ${r.output!.validationQuality.verdict} | ${calibration(r.tier, score)} | ${(r.durationMs/1000).toFixed(1)}s |`;
    }),
    ``,
    `**Avg:** ${avgScore(gpt4o)} score | ${avgDur(gpt4o)}s/call | ${totalDur(gpt4o)}s total`,
    ``,
    `### claude-sonnet-4-6`,
    ``,
    `| Case | Tier | Score | Band | Verdict | Cal | Time |`,
    `|------|------|-------|------|---------|-----|------|`,
    ...sonnet.map(r => {
      if (r.error) return `| ${r.caseId} | ${tierLabel(r.tier)} | ERR | — | — | — | ${(r.durationMs/1000).toFixed(1)}s |`;
      const score = r.output!.validationQuality.buildGateScore;
      return `| ${r.caseId} | ${tierLabel(r.tier)} | ${score} | ${scoreBand(score)} | ${r.output!.validationQuality.verdict} | ${calibration(r.tier, score)} | ${(r.durationMs/1000).toFixed(1)}s |`;
    }),
    ``,
    `**Avg:** ${avgScore(sonnet)} score | ${avgDur(sonnet)}s/call | ${totalDur(sonnet)}s total`,
    ``,
    `---`,
    ``,
    `## Evaluator Notes`,
    ``,
    `*(Fill in after reviewing results)*`,
    ``,
  ].join("\n");

  return header + caseBlocks.join("\n") + "\n\n" + perModel;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Validate v2 eval: 10 cases × 2 models = 20 calls\n`);
  console.log(`gpt-4o vs claude-sonnet-4-6 — same cases for both\n`);

  const all: Result[] = [];
  const wallStart = Date.now();

  for (const tc of TEST_CASES) {
    console.log(`\n[${tc.id}] ${tc.label} (${tc.tier}, expected: ${tc.expectedScore})`);

    // Run both models concurrently per case
    const [g, s] = await Promise.all([
      runCell(tc, MODELS[0]),
      runCell(tc, MODELS[1]),
    ]);

    for (const r of [g, s]) {
      all.push(r);
      if (r.error) {
        console.log(`  ${r.modelLabel}: ERROR — ${r.error.slice(0, 80)}`);
      } else {
        const score = r.output!.validationQuality.buildGateScore;
        const cal = calibration(r.tier, score);
        console.log(`  ${r.modelLabel}: ${score} (${scoreBand(score)}) cal=${cal} ${(r.durationMs / 1000).toFixed(1)}s`);
      }
    }

    if (tc !== TEST_CASES[TEST_CASES.length - 1]) {
      await new Promise(res => setTimeout(res, 800));
    }
  }

  const totalMs = Date.now() - wallStart;
  console.log(`\nTotal wall time: ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`Building report...`);

  const report = buildReport(all, totalMs);
  fs.writeFileSync(path.join(__dirname, "../results/validate-v2.md"), report, "utf-8");
  console.log(`Report written to test/results/validate-v2.md`);
}

main().catch(console.error);
