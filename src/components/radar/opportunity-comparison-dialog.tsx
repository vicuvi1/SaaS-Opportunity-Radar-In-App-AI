"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Check,
  Ban,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import type {
  Opportunity,
  OpportunityStatus,
  MyDecision,
} from "@/lib/opportunities/types";

interface OpportunityComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunities: Opportunity[];
  onStatusChange: (id: string, status: OpportunityStatus) => void;
  onDecisionChange: (id: string, decision: MyDecision) => void;
  onDeepResearch: (opp: Opportunity) => void;
  onRemoveFromCompare: (id: string) => void;
}

const COMPARISON_DIMENSIONS: Array<{
  key: keyof Opportunity["researchScoreFactors"];
  label: string;
  description: string;
}> = [
  { key: "problemSeverity", label: "Problem Severity", description: "How acute and costly the issue is" },
  { key: "problemFrequency", label: "Frequency", description: "Daily/weekly recurrence of friction" },
  { key: "economicValue", label: "Economic Value", description: "Direct revenue impact or labor saved" },
  { key: "willingnessToPay", label: "Willingness to Pay", description: "Active budget & purchasing intent" },
  { key: "marketOpportunity", label: "Market Opportunity", description: "TAM and total reachable customers" },
  { key: "competitionGap", label: "Competition Gap", description: "Unaddressed whitespace by incumbents" },
  { key: "aiFit", label: "AI Fit", description: "Degree to which AI creates 10x leverage" },
  { key: "technicalFeasibility", label: "Technical Feasibility", description: "Ease of building and maintaining" },
  { key: "distributionPotential", label: "Distribution Potential", description: "Clear organic & outbound reach" },
  { key: "evidenceStrength", label: "Evidence Strength", description: "Hard facts vs speculative inference" },
];

export function OpportunityComparisonDialog({
  open,
  onOpenChange,
  opportunities,
  onStatusChange,
  onDecisionChange,
  onDeepResearch,
  onRemoveFromCompare,
}: OpportunityComparisonDialogProps) {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-card/60">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <BarChart2 className="size-4" />
                </div>
                <DialogTitle className="text-lg font-bold">
                  Side-by-Side Opportunity Comparison
                </DialogTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {opportunities.length} Selected (2–5)
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Neutral comparative analysis across 12 commercial and technical dimensions. No automated winner is declared; evaluate the evidence to make your personal shortlisting decision.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Grid */}
        <ScrollArea className="flex-1 p-5 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header Columns: Titles & Actions */}
            <div
              className="grid gap-4 pb-4 border-b border-border/70"
              style={{
                gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
              }}
            >
              {/* Row Header Label */}
              <div className="flex flex-col justify-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Opportunity
              </div>

              {/* Opportunity Cards in Column Header */}
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2 relative group shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => onRemoveFromCompare(opp.id)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                    title="Remove from comparison"
                  >
                    <X className="size-3.5" />
                  </button>

                  <div className="pr-6">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {opp.industry}
                    </span>
                    <h4 className="font-bold text-sm leading-snug text-foreground line-clamp-2">
                      {opp.title}
                    </h4>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs bg-violet-600/15 text-violet-300 hover:bg-violet-600/25 border border-violet-500/30 gap-1"
                      onClick={() => {
                        onOpenChange(false);
                        onDeepResearch(opp);
                      }}
                    >
                      <Sparkles className="size-3 text-violet-400" />
                      Deep Research
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                      title="Move to Shortlist"
                      onClick={() => {
                        onStatusChange(opp.id, "SHORTLIST");
                        onDecisionChange(opp.id, "SHORTLISTED");
                      }}
                    >
                      <Check className="size-3 text-emerald-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-rose-400 hover:bg-rose-500/10"
                      title="Reject"
                      onClick={() => {
                        onStatusChange(opp.id, "REJECTED");
                        onDecisionChange(opp.id, "REJECTED");
                      }}
                    >
                      <Ban className="size-3 text-rose-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 1. High-Level Summary Metrics */}
            <div className="py-4 border-b border-border/50 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                1. High-Level Intelligence
              </h5>

              {/* Research Score */}
              <div
                className="grid gap-4 items-center py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">Research Score (0-100)</div>
                {opportunities.map((opp) => (
                  <div key={opp.id} className="flex items-center gap-2">
                    <span
                      className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${
                        opp.researchScore >= 75
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : opp.researchScore >= 55
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {opp.researchScore} / 100
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Priority */}
              <div
                className="grid gap-4 items-center py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">AI Priority</div>
                {opportunities.map((opp) => (
                  <div key={opp.id}>
                    <span className="font-semibold text-xs px-2 py-0.5 rounded border border-border/80 bg-muted/30">
                      {opp.aiPriority.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Confidence */}
              <div
                className="grid gap-4 items-center py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">AI Confidence</div>
                {opportunities.map((opp) => (
                  <div key={opp.id} className="text-xs font-semibold">
                    {opp.aiConfidence}
                  </div>
                ))}
              </div>

              {/* Evidence Strength */}
              <div
                className="grid gap-4 items-center py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">Evidence Strength</div>
                {opportunities.map((opp) => (
                  <div key={opp.id}>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        opp.evidenceStrength === "HIGH"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : opp.evidenceStrength === "MEDIUM"
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {opp.evidenceStrength}
                    </span>
                  </div>
                ))}
              </div>

              {/* My Personal Decision */}
              <div
                className="grid gap-4 items-center py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-bold text-primary">My Status / Decision</div>
                {opportunities.map((opp) => (
                  <div key={opp.id}>
                    <select
                      value={opp.myDecision}
                      onChange={(e) => onDecisionChange(opp.id, e.target.value as MyDecision)}
                      className="rounded border border-primary/40 bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
                    >
                      <option value="UNDECIDED">UNDECIDED</option>
                      <option value="INTERESTED">INTERESTED</option>
                      <option value="SHORTLISTED">SHORTLISTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Qualitative Commercial Thesis */}
            <div className="py-4 border-b border-border/50 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                2. Market Problem & Target Customer
              </h5>

              {/* Target Customer */}
              <div
                className="grid gap-4 items-start py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">Target Customer</div>
                {opportunities.map((opp) => (
                  <div key={opp.id} className="text-xs text-foreground font-medium">
                    {opp.targetCustomer}
                  </div>
                ))}
              </div>

              {/* Core Problem */}
              <div
                className="grid gap-4 items-start py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">Problem Statement</div>
                {opportunities.map((opp) => (
                  <div key={opp.id} className="text-xs text-muted-foreground leading-relaxed">
                    {opp.problem}
                  </div>
                ))}
              </div>

              {/* Market Gap */}
              <div
                className="grid gap-4 items-start py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">Incumbent Whitespace / Gap</div>
                {opportunities.map((opp) => (
                  <div key={opp.id} className="text-xs text-foreground/90">
                    {opp.marketGap || "Underserved niche workflows"}
                  </div>
                ))}
              </div>

              {/* AI Fit */}
              <div
                className="grid gap-4 items-start py-1.5 text-xs"
                style={{
                  gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="font-medium text-muted-foreground">AI Leverage Angle</div>
                {opportunities.map((opp) => (
                  <div key={opp.id} className="text-xs text-muted-foreground">
                    {opp.aiOpportunity || "Automated synthesis & structured extraction"}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 10-Dimension Comparative Matrix */}
            <div className="py-4 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                3. 10-Dimension Scoring Breakdown (0–10 each)
              </h5>

              {COMPARISON_DIMENSIONS.map((dim) => (
                <div
                  key={dim.key}
                  className="grid gap-4 items-center py-1.5 text-xs hover:bg-muted/20 rounded px-1 transition-colors"
                  style={{
                    gridTemplateColumns: `180px repeat(${opportunities.length}, minmax(220px, 1fr))`,
                  }}
                >
                  <div>
                    <span className="font-semibold text-foreground">{dim.label}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{dim.description}</p>
                  </div>

                  {opportunities.map((opp) => {
                    const score = opp.researchScoreFactors?.[dim.key] ?? 5;
                    return (
                      <div key={opp.id} className="flex items-center gap-2">
                        <div className="w-16 bg-muted/60 h-2 rounded-full overflow-hidden border border-border/40">
                          <div
                            className={`h-full ${
                              score >= 8
                                ? "bg-emerald-400"
                                : score >= 6
                                  ? "bg-amber-400"
                                  : "bg-zinc-500"
                            }`}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs">{score} / 10</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
