"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  ExternalLink,
  ShieldAlert,
  Layers,
  DollarSign,
  Users,
  Target,
} from "lucide-react";
import type { Opportunity } from "@/lib/opportunities/types";

interface DeepResearchDialogProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpportunityUpdated?: (opp: Opportunity) => void;
}

export function DeepResearchDialog({
  opportunity,
  open,
  onOpenChange,
  onOpportunityUpdated,
}: DeepResearchDialogProps) {
  const [running, setRunning] = useState(false);
  const [researchData, setResearchData] = useState<any | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!opportunity) return null;

  const handleStartDeepResearch = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/deep-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResearchData(data.research);
      setReportMarkdown(data.reportMarkdown);
      if (data.opportunity && onOpportunityUpdated) {
        onOpportunityUpdated(data.opportunity);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run deep research");
    } finally {
      setRunning(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportObsidian = async () => {
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/export/obsidian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        alert("Exported opportunity & research notes to Obsidian vault!");
      }
    } catch (err) {
      console.error("Obsidian export error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-violet-500 border-violet-500/30">
                Mode 2
              </Badge>
              <DialogTitle className="text-xl">13-Dimension Deep Research</DialogTitle>
            </div>
            {researchData && (
              <Badge
                className={
                  researchData.aiRecommendation === "BUILD"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }
              >
                Verdict: {researchData.aiRecommendation} ({researchData.revisedScore}/100)
              </Badge>
            )}
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            Exhaustive commercial and technical audit with strict evidence grading (FACT / CLAIM / INFERENCE / HYPOTHESIS).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!researchData && !running && (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Run a comprehensive 13-stage investigation covering root-cause problem analysis, competitor pricing gaps, technical feasibility, AI leverage, MVP scope, anti-scope, and strict claim verification.
                </p>
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-md flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <Button
                onClick={handleStartDeepResearch}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2 px-6"
              >
                <Sparkles className="w-4 h-4" />
                Launch 13-Dimension Deep Research
              </Button>
            </div>
          )}

          {running && (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 my-auto">
              <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
              <h3 className="font-semibold text-lg">Analyzing 13 Strategic Dimensions...</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Querying OpenRouter multi-model gateway. Auditing problem severity, market economics, competitor pricing, MVP boundaries, and classifying evidence claims.
              </p>
            </div>
          )}

          {researchData && (
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b bg-muted/20">
                <TabsList className="bg-transparent h-12 gap-4">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-muted">
                    Overview & Verdict
                  </TabsTrigger>
                  <TabsTrigger value="problem-market" className="data-[state=active]:bg-muted">
                    Problem & Market
                  </TabsTrigger>
                  <TabsTrigger value="strategy" className="data-[state=active]:bg-muted">
                    Pricing & MVP Scope
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="data-[state=active]:bg-muted">
                    Evidence Audit
                  </TabsTrigger>
                  <TabsTrigger value="report" className="data-[state=active]:bg-muted">
                    Full Markdown
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-6">
                <TabsContent value="overview" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card/50 space-y-1">
                      <div className="text-xs text-muted-foreground">Revised Score</div>
                      <div className="text-2xl font-bold text-violet-400">
                        {researchData.revisedScore} <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card/50 space-y-1">
                      <div className="text-xs text-muted-foreground">Recommendation</div>
                      <div className="text-2xl font-bold">{researchData.aiRecommendation}</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card/50 space-y-1">
                      <div className="text-xs text-muted-foreground">Problem Severity</div>
                      <div className="text-2xl font-bold text-amber-400">
                        {researchData.problemAnalysis.severityRating} <span className="text-sm text-muted-foreground">/ 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/10 space-y-2">
                    <h4 className="font-semibold text-sm">Strategic Rationale</h4>
                    <p className="text-sm text-muted-foreground">{researchData.recommendationReasoning}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        MVP Scope (What to Build)
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {researchData.mvpFeatures.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">{i + 1}.</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg border space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        Anti-Scope (Excluded from V1)
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {researchData.excludedFeatures.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-400">✕</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="problem-market" className="m-0 space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Root Cause Problem Analysis</h4>
                    <p className="text-sm text-muted-foreground">{researchData.problemAnalysis.rootCause}</p>
                    <div className="text-xs text-muted-foreground mt-2">Affected Workflows:</div>
                    <div className="flex flex-wrap gap-2">
                      {researchData.problemAnalysis.affectedWorkflows.map((w: string, i: number) => (
                        <Badge key={i} variant="secondary">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Current Workarounds & Cost of Inaction</h4>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded">
                      Estimated Hours Lost: {researchData.currentWorkarounds.hoursLostPerWeek}
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                      {researchData.currentWorkarounds.existingProcesses.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Competitor Landscape & Gaps</h4>
                    <div className="space-y-3">
                      {researchData.competitors.map((c: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg bg-card/40 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{c.name}</span>
                            <Badge variant="outline">{c.pricing || "Pricing N/A"}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong className="text-foreground">Gap:</strong> {c.gap}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="strategy" className="m-0 space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Monetization & Pricing Tiers</h4>
                    <p className="text-sm text-muted-foreground">{researchData.pricingStrategy.willingnessToPaySignals}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {researchData.pricingStrategy.tierRecommendations.map((t: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg bg-card/40 space-y-1">
                          <div className="text-xs text-muted-foreground">{t.name}</div>
                          <div className="text-lg font-bold text-emerald-400">{t.price}</div>
                          <div className="text-xs text-muted-foreground">{t.targetSubsegment}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">AI Leverage (Why Now vs 3 Years Ago)</h4>
                    <p className="text-sm text-muted-foreground">{researchData.aiLeverage.whereAiProvides10xSpeedup}</p>
                    <p className="text-xs text-muted-foreground italic">
                      {researchData.aiLeverage.whyNotPossibleYearsAgo}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Validation Experiments</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                      {researchData.validationPlan.smokeTests.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="evidence" className="m-0 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Evidence Audit & Fact Classification</h4>
                    <p className="text-xs text-muted-foreground">
                      Claims are strictly segregated to prevent hallucination: FACT, SOURCE-BASED CLAIM, INFERENCE, or HYPOTHESIS.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {researchData.evidenceAudit.map((item: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg flex items-start justify-between gap-3 text-sm">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{item.claim}</div>
                          <div className="text-xs text-muted-foreground">{item.confidenceNote}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            item.grading === "FACT"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : item.grading === "SOURCE-BASED CLAIM"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : item.grading === "HYPOTHESIS"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          }
                        >
                          {item.grading}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="report" className="m-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Full structured report saved to <code>data/reports/</code>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopyMarkdown} className="gap-1.5 text-xs">
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy Markdown"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleExportObsidian} className="gap-1.5 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Export to Obsidian
                      </Button>
                    </div>
                  </div>

                  <pre className="p-4 bg-muted/40 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {reportMarkdown}
                  </pre>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
