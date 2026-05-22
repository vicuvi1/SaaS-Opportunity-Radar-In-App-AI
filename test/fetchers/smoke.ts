/**
 * Fetcher smoke tests — run: npx tsx eval-fetchers.ts
 * Tests Reddit, HN, GitHub, Stack Overflow, and Product Hunt.
 * PH runs sequentially with pacing to respect rate limit (450 req/15min).
 * With batching, each PH query = 2 GQL calls max → safe at 7s between tests.
 */

import "dotenv/config";
import path from "path";
import { fetchRedditSignals }        from "../../src/lib/demand/reddit";
import { fetchHnCommentSignals }     from "../../src/lib/demand/hackernews";
import { fetchGithubSignals }        from "../../src/lib/demand/github";
import { fetchStackOverflowSignals } from "../../src/lib/demand/stackoverflow";
import { fetchProductHuntSignals }   from "../../src/lib/demand/producthunt";
import * as fs from "fs";

type Snippet = { text: string; title?: string; source: string };
type FetchFn = (q: string) => Promise<Snippet[]>;

// ─── Test queries ─────────────────────────────────────────────────────────────

const GENERAL_QUERIES = [
  "invoicing freelancer payments",
  "github code review quality",
  "shopify conversion product",
  "saas analytics dashboard",
  "poker tilt session variance",
  "slack developer productivity",
  "crm sales pipeline outreach",
];

// PH extended — variety of topic resolution paths:
// direct match, fallback map, no match (expected zero)
const PH_QUERIES: Array<{ q: string; note: string }> = [
  // --- Should resolve via direct API match ---
  { q: "freelance invoicing payments",       note: "freelance+payments (direct)" },
  { q: "github code review pull request",    note: "github (direct)" },
  { q: "marketing email automation",         note: "marketing+email (direct)" },
  { q: "design figma prototype ux",          note: "design (direct)" },
  { q: "crm sales pipeline",                 note: "crm+sales (direct)" },
  { q: "seo content writing",                note: "seo+writing (direct)" },
  { q: "accounting finance bookkeeping",     note: "accounting+finance (direct)" },
  { q: "analytics data dashboard",           note: "analytics (direct)" },
  { q: "health fitness tracking",            note: "health (direct)" },
  { q: "education online learning",          note: "education (direct)" },
  // --- Should resolve via fallback map ---
  { q: "shopify ecommerce store conversion", note: "shopify→e-commerce (fallback)" },
  { q: "ai llm chatbot automation",          note: "ai→developer-tools (fallback)" },
  { q: "poker gaming session variance",      note: "poker→games (fallback)" },
  { q: "scheduling calendar booking",        note: "scheduling→calendar (fallback)" },
  { q: "b2b saas startup subscription",     note: "b2b+subscription→saas (fallback)" },
  { q: "discord slack community developer",  note: "discord→developer-tools (fallback)" },
  { q: "figma design prototype wireframe",   note: "figma→design (fallback)" },
  { q: "chrome browser extension tab",      note: "chrome→browser-extensions (fallback)" },
  // --- Expected zero results (too niche for PH topics) ---
  { q: "poker tilt bankroll variance",       note: "niche — expect zero" },
  { q: "intramural league roster spreadsheet", note: "niche — expect zero" },
  { q: "youtube thumbnail ctr retention",    note: "niche — expect zero" },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

interface Result {
  source: string;
  query: string;
  note?: string;
  count: number;
  durationMs: number;
  sample: string[];
  error?: string;
}

async function run(label: string, query: string, fn: FetchFn, note?: string): Promise<Result> {
  const start = Date.now();
  try {
    const snippets = await fn(query);
    return {
      source: label,
      query,
      note,
      count: snippets.length,
      durationMs: Date.now() - start,
      sample: snippets.slice(0, 2).map(s =>
        `[${s.title?.slice(0, 50) ?? ""}] ${s.text.slice(0, 80)}`
      ),
    };
  } catch (e) {
    return {
      source: label,
      query,
      note,
      count: 0,
      durationMs: Date.now() - start,
      sample: [],
      error: e instanceof Error ? e.message.slice(0, 140) : String(e),
    };
  }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ─── Report builder ───────────────────────────────────────────────────────────

function buildReport(general: Result[], phResults: Result[]): string {
  const lines: string[] = [
    `# Fetcher Smoke Tests`,
    `**Date:** ${new Date().toISOString()}`,
    ``,
  ];

  // ── General: all sources ──────────────────────────────────────────────────
  lines.push(`## All Sources — General Queries`);
  lines.push(`*(Run in parallel per query; PH included)*`);
  lines.push(``);
  lines.push(`| Source | Query | Count | Time | First snippet |`);
  lines.push(`|--------|-------|-------|------|---------------|`);
  for (const r of general) {
    const status = r.error ? `ERR` : String(r.count);
    const preview = r.sample[0] ? r.sample[0].slice(0, 90) : r.error?.slice(0, 80) ?? "—";
    lines.push(`| ${r.source} | ${r.query} | ${status} | ${(r.durationMs/1000).toFixed(1)}s | ${preview} |`);
  }
  lines.push(``);

  // Per-source summary
  const sources = ["reddit","hackernews","github","stackoverflow","producthunt"];
  lines.push(`### Per-source summary (general queries)`);
  lines.push(``);
  lines.push(`| Source | Queries | Total | Avg snippets | Avg time | Zeros | Errors |`);
  lines.push(`|--------|---------|-------|--------------|----------|-------|--------|`);
  for (const src of sources) {
    const rows = general.filter(r => r.source === src);
    const total = rows.reduce((s, r) => s + r.count, 0);
    const avg   = rows.length ? (total / rows.length).toFixed(1) : "—";
    const avgT  = rows.length ? (rows.reduce((s, r) => s + r.durationMs, 0) / rows.length / 1000).toFixed(1) + "s" : "—";
    const zeros = rows.filter(r => r.count === 0 && !r.error).length;
    const errs  = rows.filter(r => r.error).length;
    lines.push(`| ${src} | ${rows.length} | ${total} | ${avg} | ${avgT} | ${zeros} | ${errs} |`);
  }
  lines.push(``);

  // ── Product Hunt deep dive ────────────────────────────────────────────────
  lines.push(`## Product Hunt Extended Coverage`);
  lines.push(`*(Sequential with 7s pacing; 2 GQL calls per query after batching)*`);
  lines.push(``);
  lines.push(`| Query | Note | Count | Time | Sample |`);
  lines.push(`|-------|------|-------|------|--------|`);
  for (const r of phResults) {
    const status = r.error ? `ERR` : String(r.count);
    const preview = r.error
      ? r.error.slice(0, 80)
      : r.sample[0]?.slice(0, 90) ?? "—";
    lines.push(`| ${r.query} | ${r.note ?? ""} | ${status} | ${(r.durationMs/1000).toFixed(1)}s | ${preview} |`);
  }
  lines.push(``);

  // PH stats
  const phAll   = [...phResults];
  const phHits  = phAll.filter(r => r.count > 0);
  const phZero  = phAll.filter(r => r.count === 0 && !r.error);
  const phErr   = phAll.filter(r => r.error);
  const avgSnip = phAll.length ? (phAll.reduce((s, r) => s + r.count, 0) / phAll.length).toFixed(1) : "—";
  const avgTime = phAll.length ? (phAll.reduce((s, r) => s + r.durationMs, 0) / phAll.length / 1000).toFixed(1) + "s" : "—";

  lines.push(`### Product Hunt summary`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total queries tested | ${phAll.length} |`);
  lines.push(`| Queries with results | ${phHits.length} |`);
  lines.push(`| Zero-result (no topic match) | ${phZero.length} |`);
  lines.push(`| Errors (rate limit / network) | ${phErr.length} |`);
  lines.push(`| Avg snippets/query | ${avgSnip} |`);
  lines.push(`| Avg time/query | ${avgTime} |`);
  lines.push(``);

  if (phZero.length > 0) {
    lines.push(`**Zero-result queries** (no PH topic matched — expected for very niche ideas):`);
    for (const r of phZero) lines.push(`- \`${r.query}\` — ${r.note}`);
    lines.push(``);
  }

  if (phHits.length > 0) {
    lines.push(`**Sample snippets from high-yield queries:**`);
    lines.push(``);
    for (const r of phHits.slice(0, 5)) {
      lines.push(`**[${r.query}]** (${r.count} snippets)`);
      for (const s of r.sample) lines.push(`- ${s}`);
      lines.push(``);
    }
  }

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetcher smoke tests\n");

  // Phase 1: all sources in parallel, per query, with 1.5s between queries
  console.log("=== Phase 1: All sources — general queries ===\n");
  const general: Result[] = [];

  for (const q of GENERAL_QUERIES) {
    console.log(`[${q}]`);
    const results = await Promise.all([
      run("reddit",        q, fetchRedditSignals),
      run("hackernews",    q, fetchHnCommentSignals),
      run("github",        q, fetchGithubSignals),
      run("stackoverflow", q, fetchStackOverflowSignals),
      run("producthunt",   q, fetchProductHuntSignals),
    ]);
    for (const r of results) {
      general.push(r);
      const tag = r.error ? `ERR: ${r.error.slice(0,50)}` : `${r.count} snippets`;
      console.log(`  ${r.source.padEnd(14)} ${tag.padEnd(20)} ${(r.durationMs/1000).toFixed(1)}s`);
    }
    console.log();
    await delay(8000); // 8s between queries — each PH call = 2 GQL requests; 8s gives safe headroom
  }

  // Phase 2: PH deep dive — sequential, 7s between each
  console.log("=== Phase 2: Product Hunt extended queries ===\n");
  const phResults: Result[] = [];

  for (const { q, note } of PH_QUERIES) {
    const r = await run("producthunt", q, fetchProductHuntSignals, note);
    phResults.push(r);
    const tag = r.error ? `ERR` : `${r.count} snippets`;
    console.log(`  [${tag.padEnd(12)}] ${note.padEnd(38)} ${(r.durationMs/1000).toFixed(1)}s`);
    await delay(7000);
  }

  console.log("\nBuilding report...");
  const report = buildReport(general, phResults);
  fs.writeFileSync(path.join(__dirname, "../results/fetchers-smoke.md"), report, "utf-8");
  console.log("Written to test/results/fetchers-smoke.md");
}

main().catch(console.error);
