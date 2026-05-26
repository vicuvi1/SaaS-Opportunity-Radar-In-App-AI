"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { getGoalTier } from "@/lib/schemas/idea-finisher";
import { GOAL_OPTIONS } from "@/lib/profile/options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  ChevronDown,
  ClipboardCopy,
  ExternalLink,
  FileDown,
  Loader2,
  Rocket,
  Crosshair,
  Users,
  Zap,
  Hammer,
  Compass,
  DollarSign,
  Megaphone,
  ListOrdered,
  ShieldAlert,
  TriangleAlert,
  CheckCircle2,
  Circle,
  X,
  TrendingUp,
  Target,
  CalendarCheck,
  BarChart3,
  Info,
  BookOpen,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
}

function CopyBlock({ label, text, expand = false }: { label: string; text?: string; expand?: boolean }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => copyText(text)}>
          <ClipboardCopy className="size-3.5" />
        </Button>
      </div>
      <pre className={`overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground ${expand ? "max-h-96" : "max-h-52"}`}>
        {text}
      </pre>
    </div>
  );
}

function Collapsible({ title, badge, defaultOpen = false, children }: {
  title: string; badge?: ReactNode; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/70 bg-background/55 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{title}</span>
          {badge}
        </div>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border/50 px-3 py-3">{children}</div>}
    </div>
  );
}

function SLabel({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
      {children}
    </h3>
  );
}

function Empty({ streaming }: { streaming: boolean }) {
  return <p className="text-xs text-muted-foreground">{streaming ? "Generating…" : "Nothing yet."}</p>;
}

function Card({
  icon: Icon,
  title,
  accent = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      accent ? "border-primary/30 bg-primary/[0.06]" : "border-border/60 bg-card/50"
    }`}>
      <div className="flex items-center gap-2">
        <Icon className={`size-3.5 shrink-0 ${accent ? "text-primary" : "text-muted-foreground/70"}`} />
        <h3 className={`text-[11px] font-bold uppercase tracking-widest ${accent ? "text-primary" : "text-muted-foreground/60"}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">{label}</p>
      <p className="text-sm text-foreground/85 leading-relaxed">{value}</p>
    </div>
  );
}

function Bullets({ items, variant = "default" }: {
  items?: (string | undefined | null)[];
  variant?: "default" | "check" | "cross" | "numbered";
}) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => {
        if (!item) return null;
        const prefix =
          variant === "check"    ? <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-emerald-400" /> :
          variant === "cross"    ? <X className="size-3.5 shrink-0 mt-0.5 text-red-400/70" /> :
          variant === "numbered" ? <span className="text-muted-foreground/50 shrink-0 tabular-nums text-[11px] min-w-[1rem]">{i + 1}.</span> :
                                   <Circle className="size-1.5 shrink-0 mt-1.5 fill-muted-foreground/40 text-transparent" />;
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
            {prefix}
            <span>{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Goal selector ─────────────────────────────────────────────────────────────

export function GoalSelector({ value, onChange, compact = false }: {
  value?: string;
  onChange?: (goal: string) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <select
        value={value ?? ""}
        onChange={e => onChange?.(e.target.value)}
        className="h-7 rounded-lg border border-border/60 bg-background/60 px-2 text-[11px] text-muted-foreground transition-colors hover:border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
      >
        <option value="">Set your goal</option>
        {GOAL_OPTIONS.map(g => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
          What are you building toward? <span className="text-destructive">*</span>
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">Shapes the depth, GTM focus, and financial projections in your blueprint.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {GOAL_OPTIONS.map(goal => {
          const selected = value === goal;
          return (
            <button
              key={goal}
              type="button"
              onClick={() => onChange?.(goal)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {selected && <Check className="size-3 shrink-0" />}
              {goal}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── PDF generation ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPDFHTML(b: any, ideaTitle?: string, planGoal?: string): string {
  const esc = (s?: string | null) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const listItems = (items?: (string | undefined | null)[]) =>
    (items ?? []).filter(Boolean).map(i => `<li>${esc(i)}</li>`).join("");
  const section = (title: string, content: string) =>
    content.trim() ? `<div class="section"><h2>${esc(title)}</h2>${content}</div>` : "";
  const field = (label: string, value?: string) =>
    value ? `<div class="field"><span class="label">${esc(label)}</span><p>${esc(value)}</p></div>` : "";

  const execSum = b.executiveSummary;
  const fin = b.financialPlan;
  const mil = b.launchMilestones;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(ideaTitle)} - Business Plan</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 860px; margin: 0 auto; padding: 48px 40px; color: #111; font-size: 13px; line-height: 1.65; }
  .cover { padding-bottom: 32px; border-bottom: 3px solid #000; margin-bottom: 40px; }
  .cover h1 { font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
  .cover .goal-badge { display: inline-block; background: #f0f0f0; border: 1px solid #ddd; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 12px; }
  .cover .meta { font-size: 12px; color: #666; }
  .section { margin-top: 36px; }
  h2 { font-size: 17px; font-weight: 700; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px; }
  h3 { font-size: 13px; font-weight: 700; margin: 14px 0 6px; color: #222; }
  p { margin-bottom: 10px; }
  ul, ol { padding-left: 20px; margin-bottom: 10px; }
  li { margin-bottom: 4px; }
  .field { margin-bottom: 14px; }
  .label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 3px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 12px; }
  .milestones { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .milestone-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 14px; }
  .milestone-box .period { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 6px; }
  .competitor { border: 1px solid #e8e8e8; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
  .competitor-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .competitor-name { font-weight: 700; font-size: 14px; }
  .competitor-pricing { font-size: 11px; background: #f5f5f5; padding: 2px 8px; border-radius: 4px; }
  .ai-notice { background: #fff8e7; border: 1px solid #f0d060; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #7a5c00; margin-bottom: 16px; }
  .disclaimer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #aaa; }
  @media print {
    body { padding: 20px 24px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>${esc(ideaTitle || b.positioning || "Startup Business Plan")}</h1>
  ${planGoal ? `<div class="goal-badge">${esc(planGoal)}</div>` : ""}
  <p class="meta">Generated by FounderHQ | ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
</div>

${execSum ? section("1. Executive Summary", `
  ${field("Company Description", execSum.businessDescription)}
  ${field("Mission", execSum.missionStatement)}
  ${field("Problem", execSum.problemStatement)}
  ${field("Solution", execSum.solutionStatement)}
  ${field("Unique Value Proposition", execSum.uniqueValueProposition)}
  ${field("Future Vision", execSum.futureVision)}
  ${(execSum.companyAdvantages?.length ?? 0) > 0 ? `<h3>Company Advantages</h3><ul>${listItems(execSum.companyAdvantages)}</ul>` : ""}
  ${(execSum.keySuccessFactors?.length ?? 0) > 0 ? `<h3>Key Success Factors</h3><ul>${listItems(execSum.keySuccessFactors)}</ul>` : ""}
`) : ""}

${b.positioning ? section("2. Company Overview", `
  ${field("Positioning", b.positioning)}
  ${b.coreProblem ? field("Core Problem", b.coreProblem) : ""}
  ${b.targetUser ? `
    <h3>Target Customer</h3>
    ${field("Primary User", b.targetUser.primary)}
    ${field("Secondary User", b.targetUser.secondary)}
    ${field("Pain Context", b.targetUser.painContext)}
    ${field("Why Existing Solutions Fail", b.targetUser.whyExistingFail)}
  ` : ""}
`) : ""}

${b.problemAnalysis || b.marketReality ? section("3. Market Opportunity", `
  ${b.problemAnalysis ? `
    ${field("Customer Pain", b.problemAnalysis.customerPain)}
    <div class="grid2">
      ${field("Who Experiences It", b.problemAnalysis.whoExperiences)}
      ${field("Frequency", b.problemAnalysis.frequency)}
    </div>
    ${(b.problemAnalysis.currentAlternatives?.length ?? 0) > 0 ? `<h3>Current Alternatives</h3><ul>${listItems(b.problemAnalysis.currentAlternatives)}</ul>` : ""}
  ` : ""}
  ${b.marketReality ? `
    ${field("Market Size (TAM/SAM/SOM)", b.marketReality.tamSamSom)}
    ${field("Search Demand", b.marketReality.searchDemand)}
    ${field("Trend Momentum", b.marketReality.trendMomentum)}
    ${b.marketReality.oversaturationWarning ? `<p style="color:#9a6000;background:#fff8e7;padding:8px 12px;border-radius:6px;font-size:12px;">Warning: ${esc(b.marketReality.oversaturationWarning)}</p>` : ""}
  ` : ""}
`) : ""}

${(b.competitors?.length ?? 0) > 0 ? section("4. Competitive Analysis", `
  <div class="ai-notice">Competitor data is AI-generated from market knowledge. Verify URLs, pricing, and details independently before making decisions.</div>
  ${(b.competitors ?? []).map((c: any) => c ? `
    <div class="competitor">
      <div class="competitor-header">
        <span class="competitor-name">${esc(c.name)}</span>
        ${c.pricing ? `<span class="competitor-pricing">${esc(c.pricing)}</span>` : ""}
      </div>
      ${c.name ? `<p style="font-size:11px;color:#2563eb;margin-bottom:8px;"><a href="https://www.google.com/search?q=${encodeURIComponent(c.name)}" style="color:#2563eb;">Search ${esc(c.name)} on Google</a></p>` : ""}
      ${c.sentiment ? `<p style="color:#555;margin-bottom:8px;">${esc(c.sentiment)}</p>` : ""}
      <div class="grid2">
        ${(c.strengths?.length ?? 0) > 0 ? `<div><h3 style="color:#15803d">Strengths</h3><ul>${listItems(c.strengths)}</ul></div>` : ""}
        ${(c.weaknesses?.length ?? 0) > 0 ? `<div><h3 style="color:#b91c1c">Weaknesses</h3><ul>${listItems(c.weaknesses)}</ul></div>` : ""}
      </div>
      ${(c.commonComplaints?.length ?? 0) > 0 ? `<h3>User Complaints</h3><ul>${listItems(c.commonComplaints)}</ul>` : ""}
    </div>
  ` : "").join("")}
`) : ""}

${b.mvp || b.wedgeStrategy || b.monetization ? section("5. Product & Strategy", `
  ${b.mvp ? `
    <h3>MVP Scope</h3>
    ${(b.mvp.features?.length ?? 0) > 0 ? `<h4 style="font-size:11px;color:#15803d;font-weight:600;margin:8px 0 4px;">In scope</h4><ul>${listItems(b.mvp.features)}</ul>` : ""}
    ${(b.mvp.excluded?.length ?? 0) > 0 ? `<h4 style="font-size:11px;color:#b91c1c;font-weight:600;margin:8px 0 4px;">Out of scope (v1)</h4><ul>${listItems(b.mvp.excluded)}</ul>` : ""}
    ${field("Platform", b.mvp.platform)}
    ${field("Behavior", b.mvp.behavior)}
  ` : ""}
  ${b.wedgeStrategy ? `
    ${field("Wedge Strategy", b.wedgeStrategy.summary)}
    ${(b.wedgeStrategy.channels?.length ?? 0) > 0 ? `<h3>Acquisition Channels</h3><ul>${listItems(b.wedgeStrategy.channels)}</ul>` : ""}
  ` : ""}
  ${b.monetization ? `
    ${field("Revenue Model", b.monetization.model)}
    ${field("Pricing", b.monetization.pricingIdea)}
    ${field("Rationale", b.monetization.rationale)}
  ` : ""}
  ${(b.gtmSteps?.length ?? 0) > 0 ? `<h3>Go-To-Market Steps</h3><ol>${listItems(b.gtmSteps)}</ol>` : ""}
`) : ""}

${fin ? section("6. Financial Plan", `
  ${field("Revenue Model", fin.revenueModel)}
  ${field("Pricing Strategy", fin.pricingStrategy)}
  <div class="grid2">
    ${field("Monthly Break-Even", fin.monthlyBreakeven)}
    ${field("Startup Costs", fin.startupCosts)}
    ${field("3-Month Revenue Projection", fin.projectedRevenue3Month)}
    ${field("12-Month Revenue Projection", fin.projectedRevenue12Month)}
  </div>
  ${field("Funding Needs", fin.fundingNeeds)}
  ${field("Growth Plan", fin.growthPlan)}
  ${(fin.keyAssumptions?.length ?? 0) > 0 ? `<h3>Key Assumptions</h3><ul>${listItems(fin.keyAssumptions)}</ul>` : ""}
`) : ""}

${mil ? section("7. Launch Milestones & Roadmap", `
  <div class="milestones">
    ${(mil.week1?.length ?? 0) > 0 ? `<div class="milestone-box"><div class="period">Week 1</div><ul>${listItems(mil.week1)}</ul></div>` : ""}
    ${(mil.month1?.length ?? 0) > 0 ? `<div class="milestone-box"><div class="period">Month 1</div><ul>${listItems(mil.month1)}</ul></div>` : ""}
    ${(mil.month3?.length ?? 0) > 0 ? `<div class="milestone-box"><div class="period">Month 3</div><ul>${listItems(mil.month3)}</ul></div>` : ""}
    ${(mil.month6?.length ?? 0) > 0 ? `<div class="milestone-box"><div class="period">Month 6</div><ul>${listItems(mil.month6)}</ul></div>` : ""}
  </div>
  ${(mil.successMetrics?.length ?? 0) > 0 ? `<h3 style="margin-top:16px;">Success Metrics</h3><ul>${listItems(mil.successMetrics)}</ul>` : ""}
  ${(mil.biggestChallenges?.length ?? 0) > 0 ? `<h3>Biggest Challenges</h3><ul>${listItems(mil.biggestChallenges)}</ul>` : ""}
`) : ""}

${(b.executionRisks?.length ?? 0) > 0 ? section("8. Risks & Mitigations", `
  ${(b.executionRisks ?? []).map((r: any) => r ? `
    <div style="margin-bottom:12px;">
      <h3 style="color:#b45309">${esc(r.risk)}</h3>
      ${r.mitigation ? `<p style="color:#555">${esc(r.mitigation)}</p>` : ""}
    </div>
  ` : "").join("")}
`) : ""}

<div class="disclaimer">
  This business plan was generated by FounderHQ using AI. All financial projections, market data, and competitor information are estimates based on AI analysis and should be independently verified before making business decisions.
</div>

</body>
</html>`;
  return html;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function downloadAsPDF(b: any, ideaTitle?: string, planGoal?: string) {
  const html = buildPDFHTML(b, ideaTitle, planGoal);
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site to download the PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 600);
}

// ── Main component ────────────────────────────────────────────────────────────

export function FinisherBlueprint({
  blueprint,
  generating,
  onGenerate,
  onRegenerate,
  canGenerate,
  ideaTitle,
  planGoal,
  onGoalChange,
}: {
  blueprint: Record<string, unknown> | undefined;
  generating: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  canGenerate: boolean;
  ideaTitle?: string;
  planGoal?: string;
  onGoalChange?: (goal: string) => void;
}) {
  if (!blueprint && !generating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Rocket className="size-7 text-primary/60" />
        </div>
        <div className="max-w-sm space-y-2">
          <p className="font-semibold text-foreground text-base">Turn your idea into a real business plan.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Generate a complete plan: executive summary, market research, competitor analysis, financial projections, milestones, MVP definition, and build-ready prompts for Lovable, v0, Cursor, and Claude Code.
          </p>
        </div>

        {canGenerate ? (
          <Button onClick={onGenerate} className="gap-2 shadow-md shadow-primary/20">
            <Rocket className="size-4" />
            Generate Business Plan
            {ideaTitle && (
              <span className="opacity-60 font-normal">
                for "{ideaTitle.slice(0, 28)}{ideaTitle.length > 28 ? "…" : ""}"
              </span>
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Validate an idea first to generate a plan from real market signals.</p>
        )}
      </div>
    );
  }

  if (generating && !blueprint) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <Loader2 className="size-8 animate-spin text-primary/60" />
        <div>
          <p className="font-medium text-foreground">Building your complete business plan…</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Researching market signals, analyzing competitors, modeling financials, writing launch copy…
          </p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = blueprint as any;
  const tier = getGoalTier(planGoal);
  const tabCount = tier === "lean" ? 4 : tier === "venture" ? 6 : 5;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header strip */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5 shrink-0">
            {generating && <Loader2 className="size-3 animate-spin" />}
            {generating ? "Generating…" : "Business Plan"}
          </p>
          {!generating && (
            <GoalSelector value={planGoal} onChange={onGoalChange} compact />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!generating && b.positioning && (
            <Button
              type="button" size="sm" variant="outline"
              className="gap-1.5 text-xs h-7"
              onClick={() => downloadAsPDF(b, ideaTitle, planGoal)}
            >
              <FileDown className="size-3.5" />
              Download PDF
            </Button>
          )}
          {!generating && (
            <Button type="button" size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground h-7" onClick={onRegenerate}>
              Regenerate
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="plan" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList
          className="mx-4 mt-3 mb-0 grid h-9 w-auto shrink-0 rounded-xl bg-muted/70 p-1"
          style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
        >
          <TabsTrigger value="plan"     className="text-[10px] px-1">Plan</TabsTrigger>
          {tier !== "lean" && <TabsTrigger value="market"   className="text-[10px] px-1">Market</TabsTrigger>}
          <TabsTrigger value="strategy" className="text-[10px] px-1">Strategy</TabsTrigger>
          <TabsTrigger value="build"    className="text-[10px] px-1">Build</TabsTrigger>
          <TabsTrigger value="finance"  className="text-[10px] px-1">Finance</TabsTrigger>
          {tier === "venture" && <TabsTrigger value="investor" className="text-[10px] px-1">Investor</TabsTrigger>}
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4 pb-12 space-y-3">

            {/* ── PLAN TAB ─────────────────────────────────────────────── */}
            <TabsContent value="plan" className="mt-0 space-y-3">

              {/* Business Type Analysis - Explore tier only */}
              {tier === "explore" && b?.businessTypeAnalysis && (
                <Card icon={Compass} title="Business Type Analysis" accent>
                  <Row label="What type of business" value={b.businessTypeAnalysis.whatTypeOfBusiness} />
                  <Row label="Primary path" value={b.businessTypeAnalysis.primaryPath} />
                  {b.businessTypeAnalysis.readinessScore && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Readiness</p>
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        b.businessTypeAnalysis.readinessScore === "ready" ? "bg-emerald-500/20 text-emerald-400" :
                        b.businessTypeAnalysis.readinessScore === "almost ready" ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>{b.businessTypeAnalysis.readinessScore}</span>
                    </div>
                  )}
                  {(b.businessTypeAnalysis.alternativePaths?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Alternative Paths</p>
                      {b.businessTypeAnalysis.alternativePaths.map((path: any, i: number) => (
                        <div key={i} className="rounded-md bg-muted/30 p-2.5 space-y-1 text-xs">
                          <p className="font-semibold text-foreground">{path.type}</p>
                          <p className="text-muted-foreground"><span className="text-emerald-400/80">Pros:</span> {path.pros}</p>
                          <p className="text-muted-foreground"><span className="text-red-400/80">Cons:</span> {path.cons}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {(b.businessTypeAnalysis.keyUnknowns?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Key Unknowns</p>
                      <Bullets items={b.businessTypeAnalysis.keyUnknowns} />
                    </div>
                  )}
                  <Row label="Cheapest validation" value={b.businessTypeAnalysis.cheapestValidation} />
                </Card>
              )}

              {b?.executiveSummary && (
                <Card icon={BookOpen} title="Executive Summary" accent>
                  {b.executiveSummary.businessDescription && (
                    <p className="text-sm text-foreground/85 leading-relaxed">{b.executiveSummary.businessDescription}</p>
                  )}
                  {b.executiveSummary.missionStatement && (
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/60 mb-1">Mission</p>
                      <p className="text-sm text-foreground/85 italic leading-relaxed">"{b.executiveSummary.missionStatement}"</p>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row label="Problem" value={b.executiveSummary.problemStatement} />
                    <Row label="Solution" value={b.executiveSummary.solutionStatement} />
                  </div>
                  {b.executiveSummary.uniqueValueProposition && (
                    <Row label="Unique Value Proposition" value={b.executiveSummary.uniqueValueProposition} />
                  )}
                  {b.executiveSummary.futureVision && (
                    <Row label="Future Vision" value={b.executiveSummary.futureVision} />
                  )}
                  {(b.executiveSummary.companyAdvantages?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Company Advantages</p>
                      <Bullets items={b.executiveSummary.companyAdvantages} variant="check" />
                    </div>
                  )}
                  {(b.executiveSummary.keySuccessFactors?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Key Success Factors</p>
                      <Bullets items={b.executiveSummary.keySuccessFactors} variant="check" />
                    </div>
                  )}
                </Card>
              )}

              {b.positioning && (
                <Card icon={Crosshair} title="Positioning">
                  <p className="text-sm text-foreground/85 leading-relaxed">{b.positioning}</p>
                </Card>
              )}

              {b.targetUser && (
                <Card icon={Users} title="Target Customer">
                  <Row label="Primary user" value={b.targetUser.primary} />
                  <Row label="Secondary user" value={b.targetUser.secondary} />
                  <Row label="Pain context" value={b.targetUser.painContext} />
                  <Row label="Why existing tools fail" value={b.targetUser.whyExistingFail} />
                </Card>
              )}

              {b?.coreProblem && (
                <Card icon={Zap} title="Core Problem Insight">
                  <p className="text-sm text-foreground/85 leading-relaxed">{b.coreProblem}</p>
                </Card>
              )}

              {/* Customer Profile - Indie tier */}
              {tier === "indie" && b?.customerProfile && (
                <Card icon={Users} title="Customer Profile">
                  <Row label="Description" value={b.customerProfile.description} />
                  <Row label="Demographics" value={b.customerProfile.demographics} />
                  <Row label="Buying behavior" value={b.customerProfile.buyingBehavior} />
                  <Row label="Why they buy" value={b.customerProfile.whyTheyBuy} />
                </Card>
              )}

              {/* Industry Context - Indie tier */}
              {tier === "indie" && b?.industryContext && (
                <Card icon={TrendingUp} title="Industry Context">
                  <Row label="Industry" value={b.industryContext.industry} />
                  <Row label="Trends" value={b.industryContext.trends} />
                  <Row label="Market size" value={b.industryContext.marketSize} />
                  {(b.industryContext.companyAdvantages?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Advantages in this industry</p>
                      <Bullets items={b.industryContext.companyAdvantages} variant="check" />
                    </div>
                  )}
                </Card>
              )}

              {/* Pricing Structure - Indie tier */}
              {tier === "indie" && b?.pricingStructure && (
                <Card icon={DollarSign} title="Pricing Structure">
                  {(b.pricingStructure.tiers?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      {b.pricingStructure.tiers.map((t: any, i: number) => (
                        <div key={i} className="rounded-md border border-border/50 bg-muted/20 p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{t.name}</p>
                            <span className="text-xs font-bold text-primary">{t.price}</span>
                          </div>
                          {(t.includes?.length ?? 0) > 0 && (
                            <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                              {t.includes.map((item: string, j: number) => <li key={j}>{item}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {b.pricingStructure.rationale && (
                    <Row label="Rationale" value={b.pricingStructure.rationale} />
                  )}
                </Card>
              )}

              {/* Marketing & Sales - Indie tier */}
              {tier === "indie" && b?.marketingAndSales && (
                <Card icon={Megaphone} title="Marketing & Sales">
                  {(b.marketingAndSales.growthStrategy?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Growth Strategy</p>
                      <Bullets items={b.marketingAndSales.growthStrategy} variant="check" />
                    </div>
                  )}
                  {(b.marketingAndSales.communicationChannels?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Channels</p>
                      <Bullets items={b.marketingAndSales.communicationChannels} />
                    </div>
                  )}
                  <Row label="How to sell" value={b.marketingAndSales.howToSell} />
                </Card>
              )}

            </TabsContent>

            {/* ── MARKET TAB ───────────────────────────────────────────── */}
            <TabsContent value="market" className="mt-0 space-y-4">

              {b.problemAnalysis && (
                <Collapsible title="The problem" defaultOpen>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>{b.problemAnalysis.customerPain}</p>
                    <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/30 p-2">
                      <div><p className="font-medium text-foreground text-[11px]">Who</p><p>{b.problemAnalysis.whoExperiences}</p></div>
                      <div><p className="font-medium text-foreground text-[11px]">Urgency</p><p className="capitalize">{b.problemAnalysis.urgency}</p></div>
                      <div className="col-span-2"><p className="font-medium text-foreground text-[11px]">Frequency</p><p>{b.problemAnalysis.frequency}</p></div>
                    </div>
                    {(b.problemAnalysis.currentAlternatives?.length ?? 0) > 0 && (
                      <div>
                        <p className="font-medium text-foreground text-[11px] mb-1">Current alternatives</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {b.problemAnalysis.currentAlternatives?.map((a: any, i: number) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </Collapsible>
              )}

              {b.marketReality && (
                <Collapsible title="Market size & trends" defaultOpen>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>{b.marketReality.tamSamSom}</p>
                    <p>{b.marketReality.searchDemand}</p>
                    <p>{b.marketReality.trendMomentum}</p>
                    {b.marketReality.oversaturationWarning && (
                      <p className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 text-amber-200/90">
                        Warning: {b.marketReality.oversaturationWarning}
                      </p>
                    )}
                    <p>{b.marketReality.competitorDensity}</p>
                  </div>
                </Collapsible>
              )}

              {/* Competitors */}
              <div className="space-y-2">
                <SLabel>Competitors</SLabel>

                {/* Trust indicator */}
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2">
                  <Info className="size-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    Competitor data is AI-generated from training knowledge. Links and pricing should be verified independently before relying on them. Click any link to confirm the site is current.
                  </p>
                </div>

                {(b.competitors?.length ?? 0) === 0 ? <Empty streaming={generating} /> : (
                  <div className="space-y-2">
                    {(b?.competitors ?? []).map((c: any, i: number) => (
                      <Collapsible key={i}
                        title={c?.name ?? "…"}
                        badge={c?.pricing ? <Badge variant="outline" className="text-[10px] font-normal">{c.pricing}</Badge> : undefined}>
                        <div className="space-y-3 text-xs">
                          {c?.name && (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(c.name)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors"
                            >
                              <ExternalLink className="size-3" />
                              Search {c.name} on Google
                            </a>
                          )}
                          {c?.sentiment && <p className="text-muted-foreground">{c.sentiment}</p>}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="font-medium text-foreground mb-1">Strengths</p>
                              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                {c?.strengths?.map((s: any, j: number) => <li key={j}>{s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">Weaknesses</p>
                              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                {c?.weaknesses?.map((s: any, j: number) => <li key={j}>{s}</li>)}
                              </ul>
                            </div>
                          </div>
                          {(c?.commonComplaints?.length ?? 0) > 0 && (
                            <div>
                              <p className="font-medium text-foreground mb-1">User complaints</p>
                              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                {c?.commonComplaints?.map((s: any, j: number) => <li key={j}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence */}
              <div className="space-y-2">
                <SLabel>Pain clusters</SLabel>
                <p className="text-[11px] text-muted-foreground">Groups of similar complaints from real posts. Each cluster is a product opportunity.</p>
                {(b.painClusters?.length ?? 0) === 0 ? <Empty streaming={generating} /> : (
                  <div className="space-y-2">
                    {(b?.painClusters ?? []).map((c: any, i: number) => (
                      <Collapsible key={i} title={c?.theme ?? "…"} defaultOpen={i === 0}>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">{c?.opportunityHypothesis}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Evidence snippets</p>
                            {c?.evidenceSnippets?.map((ex: any, j: number) => (
                              <p key={j} className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">"{ex}"</p>
                            ))}
                          </div>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}

                <SLabel>Demand signals</SLabel>
                <p className="text-[11px] text-muted-foreground"><span className="text-violet-400">Purple</span> = payment language found. Click links to view the original posts.</p>
                {(b.demandSignalsSummary?.length ?? 0) === 0 ? <Empty streaming={generating} /> : (
                  <div className="space-y-2">
                    {(b?.demandSignalsSummary ?? []).map((s: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border/70 bg-background/55 p-3 text-xs space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="font-normal capitalize text-[10px]">{s?.source}</Badge>
                          {s?.wtpSignal && (
                            <Badge className="bg-violet-600/90 font-normal text-[10px]">Mentions paying</Badge>
                          )}
                          <Badge variant="outline" className="font-normal text-[10px]">
                            {s?.frustration === "high" ? "Very frustrated" : s?.frustration === "medium" ? "Somewhat frustrated" : "Mildly frustrated"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">"{s?.excerpt}"</p>
                        {s?.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 truncate text-[11px] text-primary/80 hover:text-primary transition-colors">
                            <ExternalLink className="size-3 shrink-0" />
                            View original post
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </TabsContent>

            {/* ── STRATEGY TAB ─────────────────────────────────────────── */}
            <TabsContent value="strategy" className="mt-0 space-y-3">

              {b.wedgeStrategy && (
                <Card icon={Compass} title="Wedge Strategy" accent>
                  {b.wedgeStrategy.summary && (
                    <p className="text-sm text-foreground/85 leading-relaxed">{b.wedgeStrategy.summary}</p>
                  )}
                  <Bullets items={b.wedgeStrategy.channels} />
                </Card>
              )}

              {b.opportunityWedge && (
                <Collapsible title="Your angles of attack" defaultOpen>
                  <dl className="space-y-3 text-xs text-muted-foreground">
                    {([
                      { k: "underservedAudience", label: "Underserved audience" },
                      { k: "ignoredWorkflow",     label: "Ignored workflow"     },
                      { k: "pricingGap",          label: "Pricing gap"          },
                      { k: "uxGap",               label: "UX gap"               },
                      { k: "aiLeverage",          label: "AI leverage"          },
                      { k: "speedAdvantage",      label: "Speed advantage"      },
                    ] as const).map(({ k, label }) => {
                      const val = (b.opportunityWedge as Record<string, string | undefined> | undefined)?.[k];
                      if (!val) return null;
                      return (
                        <div key={k}>
                          <dt className="font-medium text-foreground">{label}</dt>
                          <dd className="mt-0.5">{val}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </Collapsible>
              )}

              {(b.gtmSteps?.length ?? 0) > 0 && (
                <Card icon={Megaphone} title="Go-To-Market">
                  <Bullets items={b.gtmSteps} variant="numbered" />
                </Card>
              )}

              {b.monetization && (
                <Card icon={DollarSign} title="Monetization">
                  <div className="flex items-start gap-3">
                    {b.monetization.model && (
                      <span className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {b.monetization.model}
                      </span>
                    )}
                    <div className="space-y-1 min-w-0">
                      {b.monetization.pricingIdea && (
                        <p className="text-sm font-medium text-foreground">{b.monetization.pricingIdea}</p>
                      )}
                      {b.monetization.rationale && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{b.monetization.rationale}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {(b.executionRisks?.length ?? 0) > 0 && (
                <Card icon={ShieldAlert} title="Execution Risks">
                  <div className="space-y-3">
                    {(b?.executionRisks ?? []).map((r: any, i: number) => {
                      if (!r) return null;
                      return (
                        <div key={i} className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <TriangleAlert className="size-3 shrink-0 text-amber-400/80" />
                            <p className="text-xs font-semibold text-foreground/90">{r.risk}</p>
                          </div>
                          {r.mitigation && (
                            <p className="text-xs text-muted-foreground leading-relaxed pl-5">{r.mitigation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

            </TabsContent>

            {/* ── BUILD TAB ────────────────────────────────────────────── */}
            <TabsContent value="build" className="mt-0 space-y-4">

              {b.mvp && (
                <Card icon={Hammer} title="MVP Definition" accent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50">In scope</p>
                      <Bullets items={b.mvp.features} variant="check" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50">Out of scope (v1)</p>
                      <Bullets items={b.mvp.excluded} variant="cross" />
                    </div>
                  </div>
                  {(b.mvp.platform || b.mvp.behavior) && (
                    <div className="flex flex-wrap gap-4 border-t border-border/30 pt-3 mt-1">
                      {b.mvp.platform && <Row label="Platform" value={b.mvp.platform} />}
                      {b.mvp.behavior && <Row label="Behavior" value={b.mvp.behavior} />}
                    </div>
                  )}
                </Card>
              )}

              {b.founderFit && (
                <Collapsible title="Founder fit">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>{b.founderFit.skillsMatch}</p>
                    <p>{b.founderFit.buildTimeline}</p>
                    <p>{b.founderFit.technicalComplexity}</p>
                    <p>Difficulty: <span className="text-foreground capitalize">{b.founderFit.difficulty}</span></p>
                  </div>
                </Collapsible>
              )}

              {b.buildArtifacts?.buildPrompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">AI Build Prompt</p>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => copyText(b.buildArtifacts!.buildPrompt!)}>
                      <ClipboardCopy className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">Paste into Claude Code, Cursor, Lovable, v0, or any AI coding tool to start building immediately.</p>
                  <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground max-h-[480px]">
                    {b.buildArtifacts.buildPrompt}
                  </pre>
                </div>
              )}

              {b.buildArtifacts && (
                <Collapsible title="Architecture & schema">
                  <div className="space-y-4">
                    <CopyBlock label="Database schema" text={b.buildArtifacts.dbSchema} />
                    <CopyBlock label="Architecture overview" text={b.buildArtifacts.architecture} />
                    <CopyBlock label="Auth & payments" text={b.buildArtifacts.authPayments} />
                    <CopyBlock label="Landing copy"    text={b.buildArtifacts.landingCopy} />
                    <CopyBlock label="Onboarding flow" text={b.buildArtifacts.onboardingFlow} />
                    {(b.buildArtifacts.mvpFeatures?.length ?? 0) > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">MVP features</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                          {b.buildArtifacts.mvpFeatures?.map((f: any, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                    {(b.buildArtifacts.roadmap30Day?.length ?? 0) > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">30-day build roadmap</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
                          {b.buildArtifacts.roadmap30Day?.map((step: any, i: number) => <li key={i}>{step}</li>)}
                        </ol>
                      </div>
                    )}
                  </div>
                </Collapsible>
              )}

              {b.buildArtifacts && (
                <Collapsible title="Build order">
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Sequential steps to ship the MVP from scratch.</p>
                    <Bullets items={b.buildOrder} variant="numbered" />
                  </div>
                </Collapsible>
              )}

              {b.validationPack && (
                <Collapsible title="Launch copy & outreach">
                  <div className="space-y-4">
                    <CopyBlock label="Reddit post draft"    text={b.validationPack.redditPostDraft} />
                    <CopyBlock label="Twitter/X launch"     text={b.validationPack.twitterLaunchDraft} />
                    <CopyBlock label="Landing page copy"    text={b.validationPack.landingPageCopy} />
                    <CopyBlock label="Waitlist copy"        text={b.validationPack.waitlistCopy} />
                    <CopyBlock label="Cold outreach script" text={b.validationPack.coldOutreachScript} />
                    <CopyBlock label="Community plan"       text={b.validationPack.communityPlan} />
                    {(b.validationPack.interviewQuestions?.length ?? 0) > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer interview questions</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
                          {b.validationPack.interviewQuestions?.map((q: any, i: number) => <li key={i}>{q}</li>)}
                        </ol>
                      </div>
                    )}
                  </div>
                </Collapsible>
              )}

              {(b.buildArtifacts?.pricingIdeas?.length ?? 0) > 0 && (
                <Collapsible title="Pricing experiments">
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                    {b.buildArtifacts?.pricingIdeas?.map((p: any, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </Collapsible>
              )}

            </TabsContent>

            {/* ── FINANCE TAB ──────────────────────────────────────────── */}
            <TabsContent value="finance" className="mt-0 space-y-3">

              {tier === "lean" ? (
                b?.financialPlan ? (
                  <Card icon={BarChart3} title="Financial Overview" accent>
                    <Row label="Weekly hours" value={b.financialPlan.weeklyHours} />
                    <Row label="Earnings ceiling" value={b.financialPlan.earningsCeiling} />
                    <Row label="Launch cost" value={b.financialPlan.launchCost} />
                    <Row label="First revenue timeline" value={b.financialPlan.firstRevenueTimeline} />
                    {(b.financialPlan.keyAssumptions?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Key Assumptions</p>
                        <Bullets items={b.financialPlan.keyAssumptions} />
                      </div>
                    )}
                  </Card>
                ) : <Empty streaming={generating} />
              ) : tier === "explore" ? (
                b?.financialPlan ? (
                  <Card icon={BarChart3} title="Financial Overview" accent>
                    <Row label="Revenue model" value={b.financialPlan.revenueModel} />
                    <Row label="Estimated revenue ceiling" value={b.financialPlan.estimatedRevenueCeiling} />
                    <Row label="Launch cost" value={b.financialPlan.launchCost} />
                    <Row label="Funding needs" value={b.financialPlan.fundingNeeds} />
                    {(b.financialPlan.keyAssumptions?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Key Assumptions to Validate First</p>
                        <Bullets items={b.financialPlan.keyAssumptions} />
                      </div>
                    )}
                  </Card>
                ) : <Empty streaming={generating} />
              ) : (
                b?.financialPlan ? (
                  <>
                    <Card icon={BarChart3} title="Financial Plan" accent>
                      <Row label="Revenue model" value={b.financialPlan.revenueModel} />
                      <Row label="Pricing strategy" value={b.financialPlan.pricingStrategy} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Row label="Monthly break-even" value={b.financialPlan.monthlyBreakeven} />
                        <Row label="Startup costs" value={b.financialPlan.startupCosts} />
                        <Row label="3-month revenue projection" value={b.financialPlan.projectedRevenue3Month} />
                        {tier === "indie"
                          ? <Row label="6-month revenue projection" value={b.financialPlan.projectedRevenue6Month} />
                          : <Row label="12-month revenue projection" value={b.financialPlan.projectedRevenue12Month} />
                        }
                      </div>
                      {b.financialPlan.fundingNeeds && (
                        <Row label="Funding needs" value={b.financialPlan.fundingNeeds} />
                      )}
                      {(tier === "business" || tier === "venture") && b.financialPlan.growthPlan && (
                        <Row label="Growth plan" value={b.financialPlan.growthPlan} />
                      )}
                      {(b.financialPlan.keyAssumptions?.length ?? 0) > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Key Assumptions</p>
                          <Bullets items={b.financialPlan.keyAssumptions} />
                        </div>
                      )}
                    </Card>
                    <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2 flex items-start gap-2">
                      <Info className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/50" />
                      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                        Financial projections are AI estimates based on market patterns. Treat them as rough planning anchors, not forecasts. Verify assumptions with real customer conversations.
                      </p>
                    </div>
                  </>
                ) : <Empty streaming={generating} />
              )}

              {b?.launchMilestones ? (
                <Card icon={CalendarCheck} title="Launch Milestones">
                  <div className="space-y-3">
                    {(b.launchMilestones.week1?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50 flex items-center gap-1.5">
                          <TrendingUp className="size-3 text-emerald-400/70" />
                          Week 1
                        </p>
                        <Bullets items={b.launchMilestones.week1} variant="check" />
                      </div>
                    )}
                    {(b.launchMilestones.month1?.length ?? 0) > 0 && (
                      <div className="space-y-1.5 border-t border-border/30 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50">Month 1</p>
                        <Bullets items={b.launchMilestones.month1} variant="numbered" />
                      </div>
                    )}
                    {(b.launchMilestones.month3?.length ?? 0) > 0 && (
                      <div className="space-y-1.5 border-t border-border/30 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50">Month 3</p>
                        <Bullets items={b.launchMilestones.month3} variant="numbered" />
                      </div>
                    )}
                    {(b.launchMilestones.month6?.length ?? 0) > 0 && (
                      <div className="space-y-1.5 border-t border-border/30 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50">Month 6</p>
                        <Bullets items={b.launchMilestones.month6} variant="numbered" />
                      </div>
                    )}
                    {tier === "explore" && (b.launchMilestones.pivotTriggers?.length ?? 0) > 0 && (
                      <div className="space-y-1.5 border-t border-border/30 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400/70">Pivot Triggers</p>
                        <Bullets items={b.launchMilestones.pivotTriggers} variant="cross" />
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                !b?.financialPlan && <Empty streaming={generating} />
              )}

              {(b?.launchMilestones?.successMetrics?.length ?? 0) > 0 && (
                <Card icon={Target} title="Success Metrics">
                  <Bullets items={b.launchMilestones.successMetrics} variant="check" />
                </Card>
              )}

              {(b?.launchMilestones?.biggestChallenges?.length ?? 0) > 0 && (
                <Card icon={ShieldAlert} title="Biggest Challenges">
                  <Bullets items={b.launchMilestones.biggestChallenges} variant="cross" />
                </Card>
              )}

            </TabsContent>

            {/* ── INVESTOR TAB (Venture only) ───────────────────────────── */}
            {tier === "venture" && (
              <TabsContent value="investor" className="mt-0 space-y-3">

                {b?.investorSummary && (
                  <Card icon={TrendingUp} title="Investor Summary" accent>
                    <Row label="Pitch narrative" value={b.investorSummary.pitchNarrative} />
                    <Row label="TAM / SAM / SOM" value={b.investorSummary.tamSamSomDetail} />
                    <Row label="Moat" value={b.investorSummary.moat} />
                    <Row label="Why now" value={b.investorSummary.whyNow} />
                    <Row label="Traction" value={b.investorSummary.traction} />
                  </Card>
                )}

                {b?.unitEconomics && (
                  <Card icon={BarChart3} title="Unit Economics">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Row label="CAC" value={b.unitEconomics.cac} />
                      <Row label="LTV" value={b.unitEconomics.ltv} />
                      <Row label="LTV/CAC ratio" value={b.unitEconomics.ltvCacRatio} />
                      <Row label="Payback period" value={b.unitEconomics.paybackPeriod} />
                    </div>
                    <Row label="Gross margin" value={b.unitEconomics.grossMargin} />
                  </Card>
                )}

                {b?.fundingStrategy && (
                  <Card icon={DollarSign} title="Funding Strategy">
                    <Row label="Raise amount" value={b.fundingStrategy.raiseAmount} />
                    <Row label="Investor profile" value={b.fundingStrategy.investorProfile} />
                    {(b.fundingStrategy.useOfFunds?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Use of Funds</p>
                        <Bullets items={b.fundingStrategy.useOfFunds} variant="numbered" />
                      </div>
                    )}
                    {(b.fundingStrategy.seriesATriggers?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Series A Triggers</p>
                        <Bullets items={b.fundingStrategy.seriesATriggers} variant="check" />
                      </div>
                    )}
                  </Card>
                )}

                {b?.teamPlan && (
                  <Card icon={Users} title="Team Plan">
                    {(b.teamPlan.founderRoles?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Founder Roles</p>
                        <Bullets items={b.teamPlan.founderRoles} />
                      </div>
                    )}
                    {(b.teamPlan.earlyHires?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Early Hires (in order)</p>
                        <Bullets items={b.teamPlan.earlyHires} variant="numbered" />
                      </div>
                    )}
                    <Row label="Advisors" value={b.teamPlan.advisors} />
                  </Card>
                )}

                {!b?.investorSummary && !b?.unitEconomics && <Empty streaming={generating} />}

              </TabsContent>
            )}

          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
