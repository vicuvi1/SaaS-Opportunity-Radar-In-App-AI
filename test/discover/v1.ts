/**
 * Discover System Evaluation
 * Run: npx tsx eval-discover.ts
 *
 * Runs 30 diverse founder profiles through the Discover system and writes a
 * markdown report to eval-discover-results.md for manual review.
 */

import "dotenv/config";
import path from "path";
import { streamObject } from "ai";
import { getLanguageModel } from "../../src/lib/ai/model";
import { DISCOVER_SYSTEM, buildDiscoverPrompt } from "../../src/lib/ai/prompts";
import { ideaDiscoverySchema, type IdeaDiscovery } from "../../src/lib/schemas/idea-discovery";
import { founderProfileToText, type FounderProfile } from "../../src/lib/profile/founder-profile";
import * as fs from "fs";

// ─── Test Case Definitions ────────────────────────────────────────────────────

interface TestCase {
  id: string;
  label: string;
  profile: FounderProfile;
  niche: string; // empty string = no direct instruction
}

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

const TEST_CASES: TestCase[] = [
  // ── TECHNICAL FOUNDERS ───────────────────────────────────────────────────

  {
    id: "T01",
    label: "Senior full-stack, strong indie hacker community access",
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
    label: "ML engineer, funded startup goal, AI/ML community",
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
    id: "T03",
    label: "Backend Python dev, student, learn/build goal, no clear community",
    profile: p({
      role: ["Student", "Software engineer"],
      skills: ["Backend development", "Python development", "SQL / database queries", "DevOps / cloud infrastructure"],
      technicalLevel: "Strong developer",
      communities: ["Graduate students / PhD researchers"],
      goal: ["Build something fun / learn"],
      monetizationPref: ["Not sure yet"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  {
    id: "T04",
    label: "Frontend dev, ecommerce community, side project, subscription preference",
    profile: p({
      role: ["Software engineer"],
      skills: ["Frontend development", "React / Next.js", "UI / UX design", "SEO / content marketing"],
      technicalLevel: "Strong developer",
      communities: ["E-commerce sellers (Shopify / Amazon / Etsy)", "Small business owners", "Startup founders / indie hackers"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "Only interested in B2B tools. No consumer apps.",
  },

  {
    id: "T05",
    label: "Mobile dev (iOS), content creator community, side project",
    profile: p({
      role: ["Software engineer"],
      skills: ["iOS / Swift development", "Mobile development (iOS / Android)", "UI / UX design"],
      technicalLevel: "Strong developer",
      communities: ["Streamers (Twitch / Kick)", "YouTubers / video creators", "TikTok creators", "Podcasters"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["One-time purchase", "Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  {
    id: "T06",
    label: "DevOps / infra engineer, developer community, funded startup",
    profile: p({
      role: ["Software engineer"],
      skills: ["DevOps / cloud infrastructure", "Kubernetes / container orchestration", "Infrastructure as code (Terraform)", "Cybersecurity", "AWS / GCP / Azure"],
      technicalLevel: "Full-stack / senior engineer",
      communities: ["Software developers / engineers", "DevOps / infrastructure engineers", "Startup founders / indie hackers"],
      goal: ["Launch a funded startup"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  // ── NON-TECHNICAL FOUNDERS ───────────────────────────────────────────────

  {
    id: "N01",
    label: "B2B sales professional, knows SMB owners, side project",
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
    id: "N02",
    label: "Operations manager, logistics background, side project",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Operations management", "Supply chain / logistics", "Process improvement (Lean / Six Sigma)", "Vendor management", "Project management"],
      technicalLevel: "Little to none",
      communities: ["Small business owners", "Contractors / construction workers"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business"],
    }),
    niche: "",
  },

  {
    id: "N03",
    label: "UI/UX designer, design community, funded startup goal",
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
    id: "N04",
    label: "Digital marketer, agency owner background, side project",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Digital marketing", "SEO / content marketing", "Paid ads (Google / Meta)", "Email marketing", "Brand strategy"],
      technicalLevel: "Little to none",
      communities: ["Agency owners (digital marketing)", "Small business owners", "E-commerce sellers (Shopify / Amazon / Etsy)", "Freelancers / consultants"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)", "One-time purchase"],
      buildType: ["Software / app", "Content / media"],
    }),
    niche: "",
  },

  {
    id: "N05",
    label: "Finance professional, investor communities, funded startup",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Financial analysis", "Financial modeling", "Fundraising / investor relations", "Startup fundraising (SAFEs, priced rounds)", "Strategic planning"],
      technicalLevel: "Little to none",
      communities: ["Angel investors / VCs", "Startup founders / indie hackers", "Finance / investing professionals", "Day traders / stock investors"],
      goal: ["Launch a funded startup"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "Looking for fintech or B2B financial ops ideas. Not consumer finance apps.",
  },

  // ── STUDENTS ─────────────────────────────────────────────────────────────

  {
    id: "S01",
    label: "CS student, Greek life + intramural sports organizer, side project",
    profile: p({
      role: ["Student", "Software engineer"],
      skills: ["Software engineering", "Full-stack development", "React / Next.js", "Backend development"],
      technicalLevel: "Strong developer",
      communities: ["Greek life (fraternities / sororities)", "Local sports leagues / intramurals", "College students / campus life", "Student athletes"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  {
    id: "S02",
    label: "Business student, non-technical, startup founder network, funded startup",
    profile: p({
      role: ["Student"],
      skills: ["Strategic planning", "Business development", "Sales / closing deals", "Pitch deck creation"],
      technicalLevel: "Little to none",
      communities: ["College students / campus life", "Startup founders / indie hackers", "MBA students / business school"],
      goal: ["Launch a funded startup"],
      monetizationPref: ["Not sure yet"],
      buildType: ["Not sure yet"],
    }),
    niche: "I want marketplace or SaaS ideas that could attract VC funding. I can recruit a technical cofounder.",
  },

  {
    id: "S03",
    label: "Pre-med student, healthcare community, learn/build",
    profile: p({
      role: ["Student"],
      skills: ["Healthcare / clinical", "User research / UX research", "Writing / copywriting"],
      technicalLevel: "Just getting started",
      communities: ["Medical school students", "Pre-med / pre-law students", "Nurses / healthcare workers", "Therapists / counselors"],
      goal: ["Build something fun / learn"],
      monetizationPref: ["Not sure yet"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  {
    id: "S04",
    label: "Student athlete turned league organizer, strong coder, side project",
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

  // ── DOMAIN EXPERTS ───────────────────────────────────────────────────────

  {
    id: "D01",
    label: "Poker player who codes, knows poker communities",
    profile: p({
      role: ["Software engineer"],
      skills: ["Full-stack development", "Python development", "Data analysis", "Statistics / quantitative analysis"],
      technicalLevel: "Strong developer",
      communities: ["Poker / card players", "Sports betting communities", "Startup founders / indie hackers"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)", "One-time purchase"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  {
    id: "D02",
    label: "Gym owner, knows fitness operations, non-technical, service business",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Operations management", "Personal training / fitness coaching", "Customer success", "Sales / closing deals"],
      technicalLevel: "Little to none",
      communities: ["Gym regulars / weightlifters", "CrossFit communities", "Personal trainers / fitness coaches", "Small business owners"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business", "Software / app"],
    }),
    niche: "Prefer operational tools for gym owners or fitness coaches. Not a fitness app for end users.",
  },

  {
    id: "D03",
    label: "Real estate agent, non-technical, knows agents and investors",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Real estate transactions", "Sales / closing deals", "Business development", "Negotiation"],
      technicalLevel: "Little to none",
      communities: ["Real estate agents / brokers", "Real estate investors (REI clubs)", "Mortgage brokers / loan officers", "Property managers"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business", "Software / app"],
    }),
    niche: "",
  },

  {
    id: "D04",
    label: "Twitch streamer + developer, creator communities",
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
    id: "D05",
    label: "Restaurant owner, hospitality operations expert, non-technical",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Restaurant / kitchen management", "Operations management", "Vendor management", "Customer success"],
      technicalLevel: "Little to none",
      communities: ["Restaurant owners / managers", "Chefs / line cooks", "Food truck operators", "Small business owners"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business"],
    }),
    niche: "",
  },

  {
    id: "D06",
    label: "Nurse, healthcare worker community, wants side project",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Healthcare / clinical", "Nursing", "Operations management", "Customer support / CX"],
      technicalLevel: "Little to none",
      communities: ["Nurses / healthcare workers", "Therapists / counselors", "Medical school students"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app", "Service business"],
    }),
    niche: "Only healthcare B2B ideas. Not consumer wellness apps.",
  },

  {
    id: "D07",
    label: "Shopify/Amazon ecommerce seller, knows seller communities, side project",
    profile: p({
      role: ["Non-technical founder", "Already a founder"],
      skills: ["E-commerce operations", "Digital marketing", "Paid ads (Google / Meta)", "Supply chain / logistics"],
      technicalLevel: "Can build basic apps",
      communities: ["E-commerce sellers (Shopify / Amazon / Etsy)", "Dropshippers / print-on-demand sellers", "Small business owners"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "",
  },

  {
    id: "D08",
    label: "Local youth sports league organizer, parent community, non-technical",
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

  // ── EDGE CASES / STRESS TESTS ───────────────────────────────────────────

  {
    id: "E01",
    label: "Indie hacker with weak distribution - no clear community, generic skills",
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
    label: "Non-technical with extremely broad interests, no constraints",
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
    label: "Very constrained - no code, no budget, needs revenue in 30 days",
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

  {
    id: "E04",
    label: "Strong technical + strong distribution but funded startup goal (should match well)",
    profile: p({
      role: ["Software engineer", "Already a founder"],
      skills: ["Full-stack development", "Data science / ML", "LLM / AI engineering", "Product management"],
      technicalLevel: "Full-stack / senior engineer",
      communities: ["Startup founders / indie hackers", "Software developers / engineers", "E-commerce sellers (Shopify / Amazon / Etsy)", "Small business owners"],
      goal: ["Launch a funded startup"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Software / app"],
    }),
    niche: "I want defensible AI infrastructure or vertical SaaS. Not a chatbot or AI wrapper.",
  },

  {
    id: "E05",
    label: "Content creator + basic dev skills, wants physical product business",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Content creation", "Social media marketing", "Photography", "Video production / editing"],
      technicalLevel: "Just getting started",
      communities: ["Photographers", "YouTubers / video creators", "Instagram / social media influencers", "TikTok creators"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["One-time purchase"],
      buildType: ["Physical product", "Content / media"],
    }),
    niche: "",
  },

  {
    id: "E06",
    label: "Recruiter/HR professional, wants agency + software hybrid",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["HR / recruiting", "Outbound / cold outreach", "B2B enterprise sales", "Account management"],
      technicalLevel: "Little to none",
      communities: ["Recruiters / HR professionals", "Startup founders / indie hackers", "Software developers / engineers", "Small business owners"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["Subscriptions (recurring)"],
      buildType: ["Service business", "Software / app"],
    }),
    niche: "Want to productize my recruiting knowledge. Maybe a tool or a service. Open to either.",
  },

  {
    id: "E07",
    label: "Teacher, educator community, very non-technical, content business goal",
    profile: p({
      role: ["Non-technical founder"],
      skills: ["Teaching / instruction", "Curriculum design", "Coaching / mentorship", "Writing / copywriting"],
      technicalLevel: "Little to none",
      communities: ["K-12 teachers", "Online course creators / educators", "Homeschool parents", "Special education professionals"],
      goal: ["Build a profitable side project"],
      monetizationPref: ["One-time purchase", "Subscriptions (recurring)"],
      buildType: ["Content / media", "Service business"],
    }),
    niche: "",
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

interface Result {
  id: string;
  label: string;
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
    const model = getLanguageModel();
    let finalObject: IdeaDiscovery | null = null;

    const { partialObjectStream } = streamObject({
      model,
      schema: ideaDiscoverySchema,
      system: DISCOVER_SYSTEM,
      prompt: buildDiscoverPrompt({ niche: tc.niche, founderProfileText: profileText }),
      temperature: 1,
    });

    for await (const partial of partialObjectStream) {
      finalObject = partial as IdeaDiscovery;
    }

    return {
      id: tc.id,
      label: tc.label,
      profileText,
      niche: tc.niche,
      output: finalObject,
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      id: tc.id,
      label: tc.label,
      profileText,
      niche: tc.niche,
      output: null,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

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
  lines.push(`## Case ${index + 1}: [${r.id}] ${r.label}`);
  lines.push(`**Duration:** ${(r.durationMs / 1000).toFixed(1)}s`);
  lines.push(``);
  lines.push(`### Input Profile`);
  lines.push("```");
  lines.push(r.profileText || "(empty)");
  lines.push("```");
  if (r.niche) {
    lines.push(`**Direct instruction:** ${r.niche}`);
  } else {
    lines.push(`**Direct instruction:** (none)`);
  }
  lines.push(``);

  if (r.error) {
    lines.push(`### ERROR`);
    lines.push(`> ${r.error}`);
    lines.push(``);
    lines.push(`**Eval note:** [FILL IN]`);
    return lines.join("\n");
  }

  if (!r.output) {
    lines.push(`### No output received`);
    return lines.join("\n");
  }

  const out = r.output;

  if (out.founderSummary) {
    lines.push(`### Founder Summary (AI-parsed)`);
    lines.push(`Role: ${out.founderSummary.role || "(none)"} | Skills: ${(out.founderSummary.skills ?? []).slice(0, 4).join(", ")} | Communities: ${(out.founderSummary.communities ?? []).slice(0, 3).join(", ")}`);
    lines.push(``);
  }

  lines.push(`**Search context:** ${out.searchContext ?? "(none)"}`);
  lines.push(``);

  for (const zone of (out.opportunityZones ?? [])) {
    lines.push(`### Zone: ${zone.zone}`);
    lines.push(`*${zone.zoneRationale}*`);
    lines.push(``);
    for (const idea of (zone.ideas ?? [])) {
      lines.push(formatIdea(idea));
      lines.push(``);
    }
  }

  lines.push(`### Evaluator Notes`);
  lines.push(`- [ ] Ideas feel well-targeted (not generic)`);
  lines.push(`- [ ] Distribution alignment makes sense for this founder`);
  lines.push(`- [ ] Constraints respected`);
  lines.push(`- [ ] Scores feel calibrated`);
  lines.push(`**Quality:** [ ] Strong [ ] Acceptable [ ] Weak [ ] Garbage`);
  lines.push(`**Notes:** `);

  return lines.join("\n");
}

async function main() {
  const CONCURRENCY = 3;
  const results: Result[] = [];

  console.log(`Running ${TEST_CASES.length} eval cases with concurrency ${CONCURRENCY}...\n`);

  // Run in batches to avoid rate limits
  for (let i = 0; i < TEST_CASES.length; i += CONCURRENCY) {
    const batch = TEST_CASES.slice(i, i + CONCURRENCY);
    console.log(`Batch ${Math.floor(i / CONCURRENCY) + 1}: cases ${i + 1}-${Math.min(i + CONCURRENCY, TEST_CASES.length)}`);

    const batchResults = await Promise.all(batch.map(runCase));
    results.push(...batchResults);

    for (const r of batchResults) {
      const status = r.error ? "FAILED" : `OK (${(r.durationMs / 1000).toFixed(1)}s)`;
      const ideaCount = r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0;
      console.log(`  [${r.id}] ${status} - ${ideaCount} ideas`);
    }

    // Brief pause between batches
    if (i + CONCURRENCY < TEST_CASES.length) {
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  // Write report
  const header = [
    `# Discover System Evaluation Report`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Model:** ${process.env.IDEAFORGE_LLM_PROVIDER ?? "openai"} / ${process.env.IDEAFORGE_OPENAI_MODEL ?? "gpt-4o-mini"}`,
    `**Cases:** ${TEST_CASES.length}`,
    ``,
    `## Summary`,
    ``,
    `| # | ID | Label | Ideas | Duration | Status |`,
    `|---|-----|-------|-------|----------|--------|`,
    ...results.map((r, i) => {
      const ideaCount = r.output?.opportunityZones?.flatMap(z => z.ideas ?? []).length ?? 0;
      const status = r.error ? "ERROR" : "OK";
      return `| ${i + 1} | ${r.id} | ${r.label} | ${ideaCount} | ${(r.durationMs / 1000).toFixed(1)}s | ${status} |`;
    }),
    ``,
    `---`,
    ``,
    `## Detailed Results`,
    ``,
  ].join("\n");

  const body = results.map((r, i) => formatResult(r, i)).join("\n\n");
  const report = header + body;

  fs.writeFileSync(path.join(__dirname, "../results/discover-v1.md"), report, "utf-8");
  console.log(`\nReport written to test/results/discover-v1.md`);

  const failed = results.filter(r => r.error).length;
  const avgDuration = results.reduce((s, r) => s + r.durationMs, 0) / results.length;
  console.log(`Done. ${results.length - failed}/${results.length} succeeded. Avg: ${(avgDuration / 1000).toFixed(1)}s`);
}

main().catch(console.error);
