/**
 * Finisher test suite — tier-aware
 *
 * For each test case:
 *   1. gatherDemandSnippets (real Reddit/HN/GitHub signals)
 *   2. generateObject with analyst model → real validate report
 *   3. generateObject with tier-specific finisher schema + prompt → full blueprint
 *
 * 5 unique tiers × 3 tests each = 15 total
 * ("Funded startup" and "Building a full company" share the venture prompt — counted as one tier)
 *
 * Run:  npx tsx scripts/test-finisher.ts
 * Takes ~2-4 min per test. 15 cases ≈ 45-60 min total.
 */

import * as fs from "fs";
import * as path from "path";

// ── Load .env before any imports that need API keys ───────────────────────────
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

// ── Now import project modules (API keys are loaded) ─────────────────────────
import { generateObject } from "ai";
import { getAnalystModel, getFinisherModel } from "../src/lib/ai/model";
import { ANALYST_SYSTEM, buildAnalystPrompt, getFinisherSystemPrompt, buildFinisherPrompt } from "../src/lib/ai/prompts";
import { ideaReportSchema, type IdeaReport } from "../src/lib/schemas/idea-report";
import { getGoalTier, getFinisherSchema, type GoalTier } from "../src/lib/schemas/idea-finisher";
import { extractSearchQuery } from "../src/lib/demand/extract-query";
import { gatherDemandSnippets, snippetsToPromptDigest } from "../src/lib/demand/gather";

// ── Test cases — 3 per tier (15 total) ───────────────────────────────────────

interface TestCase {
  id: string;
  tier: GoalTier;
  goal: string;
  topic: string;
  founderProfile: string;
}

const TEST_CASES: TestCase[] = [
  // ── LEAN: Fun side project / learn ──────────────────────────────────────────
  {
    id: "lean-01",
    tier: "lean",
    goal: "Build something fun / learn",
    topic: "A CLI tool that turns your git commit history into a bedtime story, narrated in the style of different famous authors (Hemingway, Tolkien, Dr. Seuss)",
    founderProfile: "Role: Software engineer, 3 years experience\nTechnical level: High - full-stack\nGoal: Build something fun / learn\nMonetization preference: Not important",
  },
  {
    id: "lean-02",
    tier: "lean",
    goal: "Build something fun / learn",
    topic: "A browser extension that replaces corporate jargon and buzzwords on any webpage with plain-English equivalents in real time",
    founderProfile: "Role: Product manager at a tech company\nTechnical level: Medium - some coding\nGoal: Build something fun / learn\nMonetization preference: Not important",
  },
  {
    id: "lean-03",
    tier: "lean",
    goal: "Build something fun / learn",
    topic: "A calendar-aware Pomodoro timer that names each focus block after the upcoming meeting it precedes and shows a one-sentence mental prep prompt before the meeting starts",
    founderProfile: "Role: Junior developer, 2 years experience, wants to practice TypeScript\nTechnical level: Medium - frontend focused\nGoal: Build something fun / learn\nMonetization preference: Not important",
  },

  // ── INDIE: Profitable side project ───────────────────────────────────────────
  {
    id: "indie-01",
    tier: "indie",
    goal: "Build a profitable side project",
    topic: "Weekly status report generator for freelancers and contractors - pulls from GitHub commits, Jira tickets, and calendar events to auto-draft a professional client-facing status update",
    founderProfile: "Role: Freelance developer, currently juggling 3 clients\nTechnical level: High - full-stack\nGoal: Build a profitable side project\nMonetization preference: Subscription\nDistribution: Active in freelancer Slack groups and Indie Hackers",
  },
  {
    id: "indie-02",
    tier: "indie",
    goal: "Build a profitable side project",
    topic: "Notion template store for independent consultants - SOW templates, client onboarding checklists, project trackers, invoicing dashboards",
    founderProfile: "Role: Independent strategy consultant, 5 years solo\nTechnical level: Low - no coding\nGoal: Build a profitable side project\nMonetization preference: One-time purchase\nDistribution: LinkedIn audience of 4K consultants, member of consulting communities",
  },
  {
    id: "indie-03",
    tier: "indie",
    goal: "Build a profitable side project",
    topic: "Upwork and Fiverr proposal generator - analyzes the job posting and writes a tailored, high-converting proposal for freelancers using AI",
    founderProfile: "Role: Freelance copywriter who also does gig economy side work\nTechnical level: Medium\nGoal: Build a profitable side project\nMonetization preference: Freemium with paid credits\nDistribution: Active in r/freelance and r/Upwork communities",
  },

  // ── BUSINESS: Bootstrapped small business ────────────────────────────────────
  {
    id: "biz-01",
    tier: "business",
    goal: "Bootstrapped small business",
    topic: "Done-for-you bookkeeping service for Shopify store owners doing $10K-$500K/year - AI categorizes transactions, human reviews and files quarterly taxes, flat monthly fee of $149",
    founderProfile: "Role: CPA with 8 years experience, currently works at an accounting firm\nTechnical level: Low\nGoal: Bootstrapped small business\nMonetization preference: Monthly retainer\nDistribution: Strong LinkedIn network of e-commerce business owners, local small business community",
  },
  {
    id: "biz-02",
    tier: "business",
    goal: "Bootstrapped small business",
    topic: "Local SEO SaaS for independent restaurant owners - automates Google Business Profile updates, AI-generated review responses, and local citation management for $99/month",
    founderProfile: "Role: Digital marketing consultant who has worked exclusively with restaurants for 6 years\nTechnical level: Medium - can use no-code tools\nGoal: Bootstrapped small business\nMonetization preference: Subscription\nDistribution: Network of 200+ restaurant owner contacts, local restaurant association memberships",
  },
  {
    id: "biz-03",
    tier: "business",
    goal: "Bootstrapped small business",
    topic: "White-label podcast editing and show notes service for B2B companies - turnaround in 48 hours, flat $499/month for one episode per week, includes transcript, blog post, and social clips",
    founderProfile: "Role: Former audio engineer with 8 years experience, now freelancing remotely\nTechnical level: Low - no coding\nGoal: Bootstrapped small business\nMonetization preference: Monthly retainer\nDistribution: Network of 15 B2B podcast producers and marketing agencies, active in podcast production communities",
  },

  // ── VENTURE: Funded startup / Building a full company ────────────────────────
  // Both "funded startup" and "building a full company" map to the venture prompt.
  // Test cases use both goal strings to verify routing works for each.
  {
    id: "venture-01",
    tier: "venture",
    goal: "Launch a funded startup",
    topic: "AI contract intelligence platform for mid-market companies ($10M-$500M revenue) - extracts obligations from contracts, flags renewal deadlines, auto-generates summaries, integrates with Salesforce and DocuSign",
    founderProfile: "Role: Former legal ops manager at a Series C startup, 7 years in contract management\nTechnical level: Medium - can manage engineers\nGoal: Launch a funded startup\nMonetization preference: Subscription (annual enterprise contracts)\nDistribution: 15 years of legal ops network, connections at 50+ mid-market companies",
  },
  {
    id: "venture-02",
    tier: "venture",
    goal: "Launch a funded startup",
    topic: "Developer tool that auto-generates and maintains integration tests by watching production traffic and replaying real API calls in staging - no manual test writing required",
    founderProfile: "Role: Staff engineer at a fintech company, previously built developer tools at two startups\nTechnical level: Very high - deep backend/infra expertise\nGoal: Launch a funded startup\nMonetization preference: Usage-based\nDistribution: Strong GitHub presence (12K followers), regular conference speaker",
  },
  {
    id: "venture-03",
    tier: "venture",
    goal: "Building a full company",
    topic: "B2B marketplace connecting US companies needing nearshore software development with pre-vetted agencies in Latin America - includes project management layer, escrow payments, and delivery guarantees",
    founderProfile: "Role: CEO of a staffing company focused on Latin American tech talent\nTechnical level: Medium\nGoal: Building a full company\nMonetization preference: Transaction fee + SaaS\nDistribution: Active relationships with 80+ LATAM dev agencies and 40+ US companies that have used nearshore teams",
  },

  // ── EXPLORE: Still figuring it out ───────────────────────────────────────────
  {
    id: "explore-01",
    tier: "explore",
    goal: "Still figuring it out",
    topic: "Something in the HR tech / recruiting space. I have 5 years in HR and some coding skills. I keep seeing people rage about ATS systems filtering out good candidates, and hiring managers spending hours on manual screening. Not sure if it should be a tool, a service, or something else.",
    founderProfile: "Role: HR manager at a mid-size tech company, also freelances as a recruiting consultant\nTechnical level: Medium - can build basic web apps\nGoal: Still figuring it out\nMonetization preference: Not sure yet\nDistribution: Network of 50+ recruiters and HR managers, active in SHRM communities",
  },
  {
    id: "explore-02",
    tier: "explore",
    goal: "Still figuring it out",
    topic: "I am a graphic designer with 8 years of client work experience and I am burned out on projects. I want to build something more passive - either a digital product, an info product, or some kind of SaaS. I have strong visual skills but limited coding ability. Not sure where to focus.",
    founderProfile: "Role: Freelance graphic designer specializing in brand identity\nTechnical level: Low - Webflow and some basic HTML/CSS only\nGoal: Still figuring it out\nMonetization preference: Not sure yet\nDistribution: Portfolio of 200+ client projects, small Instagram following (3K) in design niche, member of design communities on Slack and Discord",
  },
  {
    id: "explore-03",
    tier: "explore",
    goal: "Still figuring it out",
    topic: "I own a small fitness gym (30 members, been open 2 years) and I have basic coding skills from a bootcamp I did 3 years ago. I am looking for a business idea - could be tech or service - that either helps gym owners like me or uses my fitness industry knowledge. Open to anything.",
    founderProfile: "Role: Gym owner and personal trainer\nTechnical level: Low to medium - can build basic CRUD apps, no complex infrastructure\nGoal: Still figuring it out\nMonetization preference: Not sure yet\nDistribution: Network of local gym owners (knows 20+ personally), member of gym owner Facebook groups and IHRSA",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function words(s?: string) { return s ? s.split(/\s+/).length : 0; }
function hasEmDash(s?: string) { return s ? s.includes("—") : false; }
function checkEmDashes(obj: Record<string, unknown>, prefix = ""): string[] {
  const hits: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" && hasEmDash(v)) hits.push(key);
    else if (v && typeof v === "object" && !Array.isArray(v)) hits.push(...checkEmDashes(v as Record<string, unknown>, key));
    else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "string" && hasEmDash(item)) hits.push(`${key}[${i}]`);
        else if (item && typeof item === "object") hits.push(...checkEmDashes(item as Record<string, unknown>, `${key}[${i}]`));
      });
    }
  }
  return hits;
}

// Tier-aware quality checks
function getTierQualityIssues(tier: GoalTier, bp: Record<string, unknown>): string[] {
  const issues: string[] = [];
  const ba = bp.buildArtifacts as Record<string, unknown> | undefined;
  const buildPromptText = ba?.buildPrompt as string | undefined;
  const mil = bp.launchMilestones as Record<string, unknown> | undefined;

  // Core checks — all tiers
  if (!bp.positioning) issues.push("MISSING: positioning");
  if (!bp.coreProblem) issues.push("MISSING: coreProblem");
  if (!ba?.buildPrompt) issues.push("MISSING: buildPrompt");
  if (words(buildPromptText) < 700) issues.push(`SHORT buildPrompt: ${words(buildPromptText)} words (want 800+)`);
  if (!mil) issues.push("MISSING: launchMilestones");
  if (!mil?.biggestChallenges || (mil.biggestChallenges as unknown[]).length === 0) issues.push("MISSING: launchMilestones.biggestChallenges");

  // Lean: simple financials, no market research
  if (tier === "lean") {
    const fp = bp.financialPlan as Record<string, unknown> | undefined;
    if (!fp?.weeklyHours) issues.push("MISSING: financialPlan.weeklyHours");
    if (!fp?.earningsCeiling) issues.push("MISSING: financialPlan.earningsCeiling");
    if (!fp?.launchCost) issues.push("MISSING: financialPlan.launchCost");
  }

  // Indie: market research + SBA-style business plan
  if (tier === "indie") {
    const clusters = bp.painClusters as unknown[] | undefined;
    const comps = bp.competitors as Array<Record<string, unknown>> | undefined;
    const es = bp.executiveSummary as Record<string, unknown> | undefined;
    const fp = bp.financialPlan as Record<string, unknown> | undefined;
    if ((clusters?.length ?? 0) < 2) issues.push(`LOW: only ${clusters?.length ?? 0} pain clusters (want 3+)`);
    if ((comps?.length ?? 0) < 2) issues.push(`LOW: only ${comps?.length ?? 0} competitors (want 3+)`);
    if (!es) issues.push("MISSING: executiveSummary");
    if (!es?.missionStatement) issues.push("MISSING: executiveSummary.missionStatement");
    if (!es?.uniqueValueProposition) issues.push("MISSING: executiveSummary.uniqueValueProposition");
    if (!bp.customerProfile) issues.push("MISSING: customerProfile");
    if (!bp.pricingStructure) issues.push("MISSING: pricingStructure");
    if (!fp?.projectedRevenue6Month) issues.push("MISSING: financialPlan.projectedRevenue6Month");
    if (!fp?.monthlyBreakeven) issues.push("MISSING: financialPlan.monthlyBreakeven");
  }

  // Business: full 12-month plan + futureVision + growthPlan
  if (tier === "business") {
    const clusters = bp.painClusters as unknown[] | undefined;
    const comps = bp.competitors as Array<Record<string, unknown>> | undefined;
    const es = bp.executiveSummary as Record<string, unknown> | undefined;
    const fp = bp.financialPlan as Record<string, unknown> | undefined;
    if ((clusters?.length ?? 0) < 2) issues.push(`LOW: only ${clusters?.length ?? 0} pain clusters (want 3+)`);
    if ((comps?.length ?? 0) < 2) issues.push(`LOW: only ${comps?.length ?? 0} competitors (want 3+)`);
    if (!es) issues.push("MISSING: executiveSummary");
    if (!es?.futureVision) issues.push("MISSING: executiveSummary.futureVision");
    if (!es?.companyAdvantages || (es.companyAdvantages as unknown[]).length === 0) issues.push("MISSING: executiveSummary.companyAdvantages");
    if (!fp?.projectedRevenue12Month) issues.push("MISSING: financialPlan.projectedRevenue12Month");
    if (!fp?.growthPlan) issues.push("MISSING: financialPlan.growthPlan");
    if (!fp?.fundingNeeds) issues.push("MISSING: financialPlan.fundingNeeds");
  }

  // Venture: business plan + investor-grade extras
  if (tier === "venture") {
    const clusters = bp.painClusters as unknown[] | undefined;
    const comps = bp.competitors as Array<Record<string, unknown>> | undefined;
    const es = bp.executiveSummary as Record<string, unknown> | undefined;
    const fp = bp.financialPlan as Record<string, unknown> | undefined;
    if ((clusters?.length ?? 0) < 2) issues.push(`LOW: only ${clusters?.length ?? 0} pain clusters (want 3+)`);
    if ((comps?.length ?? 0) < 2) issues.push(`LOW: only ${comps?.length ?? 0} competitors (want 3+)`);
    if (!es) issues.push("MISSING: executiveSummary");
    if (!es?.futureVision) issues.push("MISSING: executiveSummary.futureVision");
    if (!bp.investorSummary) issues.push("MISSING: investorSummary");
    if (!(bp.investorSummary as Record<string, unknown> | undefined)?.moat) issues.push("MISSING: investorSummary.moat");
    if (!bp.unitEconomics) issues.push("MISSING: unitEconomics");
    if (!bp.fundingStrategy) issues.push("MISSING: fundingStrategy");
    if (!bp.teamPlan) issues.push("MISSING: teamPlan");
    if (!fp?.growthPlan) issues.push("MISSING: financialPlan.growthPlan");
    if (!fp?.projectedRevenue12Month) issues.push("MISSING: financialPlan.projectedRevenue12Month");
  }

  // Explore: businessTypeAnalysis + pivotTriggers
  if (tier === "explore") {
    const clusters = bp.painClusters as unknown[] | undefined;
    const comps = bp.competitors as Array<Record<string, unknown>> | undefined;
    const bta = bp.businessTypeAnalysis as Record<string, unknown> | undefined;
    if ((clusters?.length ?? 0) < 2) issues.push(`LOW: only ${clusters?.length ?? 0} pain clusters (want 3+)`);
    if ((comps?.length ?? 0) < 2) issues.push(`LOW: only ${comps?.length ?? 0} competitors (want 3+)`);
    if (!bta) issues.push("MISSING: businessTypeAnalysis");
    if (!bta?.whatTypeOfBusiness) issues.push("MISSING: businessTypeAnalysis.whatTypeOfBusiness");
    if (!bta?.cheapestValidation) issues.push("MISSING: businessTypeAnalysis.cheapestValidation");
    if (!bta?.readinessScore) issues.push("MISSING: businessTypeAnalysis.readinessScore");
    if (!mil?.pivotTriggers || (mil.pivotTriggers as unknown[]).length === 0) issues.push("MISSING: launchMilestones.pivotTriggers");
  }

  return issues;
}

// ── Result types ──────────────────────────────────────────────────────────────

interface StepResult {
  ok: boolean;
  durationMs: number;
  error?: string;
}

interface FinisherTestResult {
  id: string;
  tier: GoalTier;
  goal: string;
  topic: string;

  validateStep: StepResult & {
    buildGateScore?: number;
    verdict?: string;
    summary?: string;
    topSignalCount?: number;
    snippetCount?: number;
  };

  finisherStep: StepResult & {
    tier?: GoalTier;
    positioning?: string;
    coreProblem?: string;
    buildPromptWords?: number;
    competitorCount?: number;
    competitors?: Array<{ name: string; url: string | null }>;
    painClusterCount?: number;
    demandSignalCount?: number;
    hasExecutiveSummary?: boolean;
    hasFinancialPlan?: boolean;
    hasMilestones?: boolean;
    hasInvestorSummary?: boolean;
    hasBusinessTypeAnalysis?: boolean;
    qualityIssues?: string[];
    emDashFields?: string[];
  };
}

// ── Run one test ──────────────────────────────────────────────────────────────

async function runTestCase(tc: TestCase, idx: number, total: number): Promise<FinisherTestResult> {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`[${idx}/${total}] ${tc.id}  |  tier: ${tc.tier}  |  ${tc.goal}`);
  console.log(`Topic: ${tc.topic.slice(0, 90)}…`);
  console.log("═".repeat(70));

  const result: FinisherTestResult = {
    id: tc.id,
    tier: tc.tier,
    goal: tc.goal,
    topic: tc.topic,
    validateStep: { ok: false, durationMs: 0 },
    finisherStep: { ok: false, durationMs: 0 },
  };

  // ── STEP 1: gather real market signals + validate ──────────────────────────
  let report: IdeaReport | undefined;
  let snippetCount = 0;
  {
    const t0 = Date.now();
    try {
      console.log("  [validate] Extracting search query…");
      const query = await extractSearchQuery(tc.topic);
      console.log(`  [validate] Query: "${query}"`);

      console.log("  [validate] Gathering market signals (Reddit, HN, GitHub, SO)…");
      const { snippets, errors } = await gatherDemandSnippets(query);
      snippetCount = snippets.length;
      console.log(`  [validate] Got ${snippets.length} snippets. Errors: ${errors.length ? errors.join("; ") : "none"}`);

      const digest = snippetsToPromptDigest(snippets);
      const errBlock = errors.length ? `\n\nINGESTION NOTES:\n${errors.map(e => `- ${e}`).join("\n")}` : "";

      console.log("  [validate] Running analyst model (claude-sonnet-4-6)…");
      const { object } = await generateObject({
        model: getAnalystModel(),
        schema: ideaReportSchema,
        system: ANALYST_SYSTEM,
        prompt: buildAnalystPrompt({
          topic: tc.topic,
          founderProfile: tc.founderProfile,
          digest,
          manualBlock: "",
          gatherErrorsBlock: errBlock,
        }),
        temperature: 0.4,
      });
      report = object;

      const vq = report?.validationQuality;
      result.validateStep = {
        ok: true,
        durationMs: Date.now() - t0,
        buildGateScore: vq?.buildGateScore,
        verdict: vq?.verdict,
        summary: vq?.summary?.slice(0, 300),
        topSignalCount: report?.topSignals?.length,
        snippetCount,
      };
      console.log(`  [validate] Score: ${vq?.buildGateScore}/100 (${vq?.verdict}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      result.validateStep = { ok: false, durationMs: Date.now() - t0, error: String(e) };
      console.log(`  [validate] FAILED: ${result.validateStep.error}`);
      return result;
    }
  }

  // ── STEP 2: tier-aware finisher using real report ─────────────────────────
  {
    const t0 = Date.now();
    try {
      // Use the same tier routing the production route uses
      const tier = getGoalTier(tc.goal);
      const finisherSchema = getFinisherSchema(tier);
      const finisherSystem = getFinisherSystemPrompt(tier);

      console.log(`  [finish] Tier: ${tier} | Running finisher model (gpt-5.4)…`);
      const { object: blueprint } = await generateObject({
        model: getFinisherModel(),
        schema: finisherSchema,
        system: finisherSystem,
        prompt: buildFinisherPrompt({
          topic: tc.topic,
          founderProfile: tc.founderProfile,
          report,
          digest: "",    // report already has the market signals
          gatherErrorsBlock: "",
          planGoal: tc.goal,
        }),
        temperature: 0.6,
      });

      const bp = blueprint as Record<string, unknown>;
      const ba = bp.buildArtifacts as Record<string, unknown> | undefined;
      const es = bp.executiveSummary as Record<string, unknown> | undefined;
      const fp = bp.financialPlan as Record<string, unknown> | undefined;
      const mil = bp.launchMilestones as Record<string, unknown> | undefined;
      const comps = bp.competitors as Array<Record<string, unknown>> | undefined;
      const clusters = bp.painClusters as unknown[] | undefined;
      const signals = bp.demandSignalsSummary as unknown[] | undefined;
      const buildPromptText = ba?.buildPrompt as string | undefined;

      const qualityIssues = getTierQualityIssues(tier, bp);
      const emDashFields = checkEmDashes(bp);

      result.finisherStep = {
        ok: true,
        durationMs: Date.now() - t0,
        tier,
        positioning: bp.positioning as string | undefined,
        coreProblem: bp.coreProblem as string | undefined,
        buildPromptWords: words(buildPromptText),
        competitorCount: comps?.length ?? 0,
        competitors: comps?.map(c => ({ name: c.name as string, url: c.url as string | null ?? null })) ?? [],
        painClusterCount: clusters?.length ?? 0,
        demandSignalCount: signals?.length ?? 0,
        hasExecutiveSummary: !!es,
        hasFinancialPlan: !!fp,
        hasMilestones: !!mil,
        hasInvestorSummary: !!(bp.investorSummary),
        hasBusinessTypeAnalysis: !!(bp.businessTypeAnalysis),
        qualityIssues,
        emDashFields,
      };

      const fin = result.finisherStep;
      console.log(`  [finish] Done in ${(fin.durationMs / 1000).toFixed(1)}s`);
      console.log(`  [finish] BuildPrompt: ${fin.buildPromptWords}w | Competitors: ${fin.competitorCount} | Clusters: ${fin.painClusterCount}`);
      console.log(`  [finish] ExecSummary: ${fin.hasExecutiveSummary} | FinancialPlan: ${fin.hasFinancialPlan} | Milestones: ${fin.hasMilestones}`);
      if (tier === "venture") console.log(`  [finish] InvestorSummary: ${fin.hasInvestorSummary}`);
      if (tier === "explore") console.log(`  [finish] BusinessTypeAnalysis: ${fin.hasBusinessTypeAnalysis}`);
      if (emDashFields.length) console.log(`  [finish] EM DASH in: ${emDashFields.join(", ")}`);
      if (qualityIssues.length) {
        console.log(`  [finish] Issues: ${qualityIssues.join(" | ")}`);
      } else {
        console.log(`  [finish] ALL QUALITY CHECKS PASSED`);
      }
    } catch (e) {
      result.finisherStep = { ok: false, durationMs: Date.now() - t0, error: String(e) };
      console.log(`  [finish] FAILED: ${result.finisherStep.error}`);
    }
  }

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startAll = Date.now();
  console.log(`\nFounderHQ Finisher Test Suite (tier-aware) — ${new Date().toISOString()}`);
  console.log(`${TEST_CASES.length} test cases | Tiers: lean(3) indie(3) business(3) venture(3) explore(3)`);
  console.log(`Validate: claude-sonnet-4-6 | Finish: gpt-5.4`);

  const results: FinisherTestResult[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const r = await runTestCase(TEST_CASES[i], i + 1, TEST_CASES.length);
    results.push(r);
    if (i < TEST_CASES.length - 1) await new Promise(res => setTimeout(res, 1500));
  }

  const totalMin = ((Date.now() - startAll) / 60000).toFixed(1);
  console.log(`\n${"═".repeat(70)}`);
  console.log(`All tests complete in ${totalMin} minutes`);

  // ── Write JSON ──────────────────────────────────────────────────────────────
  const dir = path.join(process.cwd(), "scripts");
  const jsonPath = path.join(dir, "finisher-test-results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  // ── Write Markdown ──────────────────────────────────────────────────────────
  const validateFailed = results.filter(r => !r.validateStep.ok).length;
  const finishFailed = results.filter(r => r.validateStep.ok && !r.finisherStep.ok).length;
  const passed = results.filter(r => r.finisherStep.ok && (r.finisherStep.qualityIssues?.length ?? 0) === 0).length;
  const warned = results.filter(r => r.finisherStep.ok && (r.finisherStep.qualityIssues?.length ?? 0) > 0).length;

  let md = `# Finisher Test Results (Tier-Aware)\n\n`;
  md += `**Date:** ${new Date().toISOString()}  \n`;
  md += `**Validate model:** claude-sonnet-4-6  \n`;
  md += `**Finisher model:** gpt-5.4  \n`;
  md += `**Total time:** ${totalMin} min  \n`;
  md += `**Cases:** ${results.length} | Pass: ${passed} | Warn: ${warned} | FinishFail: ${finishFailed} | ValidateFail: ${validateFailed}\n\n`;
  md += `**Tiers tested:** lean(3) indie(3) business(3) venture(3) explore(3)\n\n---\n\n`;

  for (const r of results) {
    const vok = r.validateStep.ok;
    const fok = r.finisherStep.ok;
    const issues = r.finisherStep.qualityIssues ?? [];
    const status = !vok ? "VALIDATE FAILED" : !fok ? "FINISH FAILED" : issues.length ? "WARN" : "PASS";

    md += `## ${r.id} — ${r.tier} — ${r.goal}\n\n`;
    md += `**Status:** ${status}  \n`;
    md += `**Topic:** ${r.topic.slice(0, 200)}\n\n`;

    md += `### Validate\n\n`;
    if (!vok) {
      md += `Error: ${r.validateStep.error}\n\n`;
    } else {
      md += `- **Score:** ${r.validateStep.buildGateScore}/100 (${r.validateStep.verdict})  \n`;
      md += `- **Snippets gathered:** ${r.validateStep.snippetCount}  \n`;
      md += `- **Top signals:** ${r.validateStep.topSignalCount}  \n`;
      md += `- **Time:** ${(r.validateStep.durationMs / 1000).toFixed(1)}s  \n`;
      md += `- **Summary:** ${r.validateStep.summary}\n\n`;
    }

    md += `### Finisher\n\n`;
    if (!fok) {
      md += `Error: ${r.finisherStep.error}\n\n`;
    } else {
      const f = r.finisherStep;
      md += `- **Tier used:** ${f.tier}  \n`;
      md += `- **Time:** ${((f.durationMs ?? 0) / 1000).toFixed(1)}s  \n`;
      md += `- **Positioning:** ${f.positioning?.slice(0, 200) ?? "-"}  \n`;
      md += `- **Core problem:** ${f.coreProblem?.slice(0, 150) ?? "-"}  \n`;
      md += `- **Build prompt:** ${f.buildPromptWords} words  \n`;
      md += `- **Competitors:** ${f.competitorCount} | **Pain clusters:** ${f.painClusterCount} | **Demand signals:** ${f.demandSignalCount}  \n`;
      md += `- **ExecSummary:** ${f.hasExecutiveSummary} | **FinancialPlan:** ${f.hasFinancialPlan} | **Milestones:** ${f.hasMilestones}  \n`;
      if (r.tier === "venture") md += `- **InvestorSummary:** ${f.hasInvestorSummary}  \n`;
      if (r.tier === "explore") md += `- **BusinessTypeAnalysis:** ${f.hasBusinessTypeAnalysis}  \n`;
      md += `\n`;

      if ((f.competitors?.length ?? 0) > 0) {
        md += `**Competitors:**\n\n`;
        md += `| Name | URL field |\n|------|----------|\n`;
        for (const c of f.competitors!) {
          md += `| ${c.name} | ${c.url ?? "null (correct)"} |\n`;
        }
        md += `\n`;
      }

      if (f.emDashFields && f.emDashFields.length > 0) {
        md += `**Em dash violations:** ${f.emDashFields.join(", ")}\n\n`;
      }

      if (issues.length) {
        md += `**Quality issues:**\n`;
        for (const q of issues) md += `- ${q}\n`;
        md += `\n`;
      } else {
        md += `**Quality: all checks passed**\n\n`;
      }
    }

    md += `---\n\n`;
  }

  // Summary table
  md += `## Summary Table\n\n`;
  md += `| ID | Tier | Score | BuildPrompt | Competitors | Clusters | Status |\n`;
  md += `|----|------|-------|-------------|-------------|----------|--------|\n`;
  for (const r of results) {
    const issues = r.finisherStep.qualityIssues ?? [];
    const status = !r.validateStep.ok ? "VAL FAIL" : !r.finisherStep.ok ? "FIN FAIL" : issues.length ? "WARN" : "PASS";
    md += `| ${r.id} | ${r.tier} | ${r.validateStep.buildGateScore ?? "-"}/100 | ${r.finisherStep.buildPromptWords ?? "-"}w | ${r.finisherStep.competitorCount ?? "-"} | ${r.finisherStep.painClusterCount ?? "-"} | ${status} |\n`;
  }
  md += `\n`;

  // Recurring issues
  const allIssues = results.flatMap(r => r.finisherStep.qualityIssues ?? []);
  const freq = new Map<string, number>();
  for (const q of allIssues) {
    const key = q.replace(/\d+/g, "N");
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  if (freq.size) {
    md += `## Recurring Quality Issues\n\n`;
    for (const [issue, count] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
      md += `- ${issue} (${count}/${results.length} tests)\n`;
    }
    md += `\n`;
  }

  // Em dash violations
  const emDashTests = results.filter(r => (r.finisherStep.emDashFields?.length ?? 0) > 0);
  if (emDashTests.length) {
    md += `## Em Dash Violations\n\n`;
    for (const r of emDashTests) {
      md += `- **${r.id}:** ${r.finisherStep.emDashFields!.join(", ")}\n`;
    }
    md += `\n`;
  } else {
    md += `## Em Dash Violations: none\n\n`;
  }

  // Per-tier summary
  md += `## Per-Tier Results\n\n`;
  const tiers: GoalTier[] = ["lean", "indie", "business", "venture", "explore"];
  for (const tier of tiers) {
    const tierResults = results.filter(r => r.tier === tier);
    const tierPassed = tierResults.filter(r => r.finisherStep.ok && (r.finisherStep.qualityIssues?.length ?? 0) === 0).length;
    const tierIssues = tierResults.flatMap(r => r.finisherStep.qualityIssues ?? []);
    md += `### ${tier} (${tierPassed}/${tierResults.length} passed)\n`;
    if (tierIssues.length) {
      md += `Issues: ${tierIssues.join(" | ")}\n`;
    }
    md += `\n`;
  }

  const mdPath = path.join(dir, "finisher-test-results.md");
  fs.writeFileSync(mdPath, md);

  console.log(`\nResults written to:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log(`\nPass: ${passed} | Warn: ${warned} | FinishFail: ${finishFailed} | ValidateFail: ${validateFailed}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
