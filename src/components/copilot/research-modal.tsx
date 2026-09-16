"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ExternalLink,
  Flame,
  FileText,
  Search,
} from "lucide-react";

interface ResearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  onAttachSource?: (source: { title: string; url?: string; summary: string; grading: string }) => Promise<void>;
  onAddNote?: (content: string) => Promise<void>;
}

export function ResearchModal({
  open,
  onOpenChange,
  initialTopic = "",
  opportunityId,
  opportunityTitle,
  onAttachSource,
  onAddNote,
}: ResearchModalProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [attachedCount, setAttachedCount] = useState(0);

  React.useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  async function handleRunResearch() {
    if (!topic.trim()) return;
    setLoading(true);
    setReport(null);
    setAttachedCount(0);
    try {
      const res = await fetch("/api/copilot/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), opportunityId }),
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error("Research failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAttachAllFindings() {
    if (!report || !onAttachSource) return;
    for (const f of report.gradedFindings || []) {
      await onAttachSource({
        title: f.claim.slice(0, 80),
        summary: f.claim,
        grading: f.grading,
      });
    }
    setAttachedCount((report.gradedFindings || []).length);
  }

  async function handleAddSummaryNote() {
    if (!report || !onAddNote) return;
    const noteText = `[Research Summary] ${report.executiveSummary} (Demand: ${report.demandStrength}). Next recommended action: ${report.suggestedNextAction}`;
    await onAddNote(noteText);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Search className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">
                Live Evidence Research Engine
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Parallel search across Reddit, Hacker News, GitHub Issues, Stack Overflow, and Product Hunt.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Query input */}
          <div className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter problem space, competitor, or thesis topic..."
              className="text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleRunResearch()}
            />
            <Button
              size="sm"
              disabled={loading || !topic.trim()}
              onClick={handleRunResearch}
              className="text-xs shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Gathering Signals...
                </>
              ) : (
                <>
                  <Search className="mr-1.5 size-3.5" />
                  Research This
                </>
              )}
            </Button>
          </div>

          {/* Loading state indicator */}
          {loading && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
              <Loader2 className="size-8 animate-spin text-primary mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Querying Reddit, Hacker News, GitHub Issues, Stack Overflow & Product Hunt...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Deduplicating signals and synthesizing findings with OpenRouter DEEP analysis model.
              </p>
            </div>
          )}

          {/* Report Results */}
          {report && !loading && (
            <div className="space-y-4 pt-2 border-t border-border/60">
              {/* Executive Summary */}
              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Executive Verdict
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      report.demandStrength === "STRONG"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                        : report.demandStrength === "MODERATE"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    Demand: {report.demandStrength}
                  </Badge>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {report.executiveSummary}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Flame className="size-3.5" />
                  <span>Suggested Next Action: <strong>{report.suggestedNextAction}</strong></span>
                </div>
              </div>

              {/* Graded Evidence Findings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Graded Evidence Observations
                  </span>
                  {onAttachSource && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      onClick={handleAttachAllFindings}
                      disabled={attachedCount > 0}
                    >
                      {attachedCount > 0 ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          Attached {attachedCount} Sources
                        </>
                      ) : (
                        <>
                          <Plus className="size-3" />
                          Attach All to Opportunity
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card">
                  {(report.gradedFindings || []).map((f: any, i: number) => (
                    <div key={i} className="p-3 text-xs flex items-start gap-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                          f.grading === "FACT"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : f.grading === "SOURCE-BASED CLAIM"
                              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {f.grading}
                      </span>
                      <p className="text-foreground/90 leading-relaxed flex-1">{f.claim}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                {onAddNote && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={handleAddSummaryNote}
                  >
                    <FileText className="size-3" />
                    Save Summary to Notes
                  </Button>
                )}
                <Button size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
