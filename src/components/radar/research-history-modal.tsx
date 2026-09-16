"use client";

import React, { useState, useEffect } from "react";
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
  History,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";

interface ResearchRun {
  id: string;
  configId?: string | null;
  mode: string;
  topic: string;
  field?: string | null;
  status: string;
  summary?: string | null;
  qualityThreshold: number;
  requestedCount: number;
  createdCount: number;
  sourcesUsed?: string | null;
  durationMs: number;
  createdAt: string;
}

interface ResearchHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRunForFilter?: (runId: string, runTopic: string) => void;
}

export function ResearchHistoryModal({
  open,
  onOpenChange,
  onSelectRunForFilter,
}: ResearchHistoryModalProps) {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRuns();
    }
  }, [open]);

  async function fetchRuns() {
    setLoading(true);
    try {
      const res = await fetch("/api/research/runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error("Failed to load research runs:", err);
    } finally {
      setLoading(false);
    }
  }

  function parseSources(sourcesJson?: string | null): string[] {
    if (!sourcesJson) return ["reddit", "hackernews", "github", "producthunt"];
    try {
      const parsed = JSON.parse(sourcesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b bg-card/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <History className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Research History</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Audit trail of all automated discovery runs and investigative scans.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRuns}
              className="h-8 text-xs gap-1.5"
              disabled={loading}
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-5">
          {runs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Clock className="size-6" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">No research runs logged yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Trigger an on-demand scan via [Discovery & Schedule] or wait for your scheduled daily research run.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => {
                const sources = parseSources(run.sourcesUsed);
                const runDate = new Date(run.createdAt).toLocaleString();

                return (
                  <div
                    key={run.id}
                    className="rounded-xl border border-border/70 bg-card p-4 hover:border-primary/40 transition-all space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">
                            {run.topic || run.field || "General SaaS Discovery"}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              run.mode === "deep"
                                ? "border-violet-500/40 bg-violet-500/10 text-violet-300 font-semibold"
                                : "border-blue-500/40 bg-blue-500/10 text-blue-300"
                            }
                          >
                            {run.mode === "deep" ? "Deep 13D Scan" : "Quick Discovery"}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {runDate}
                          </span>
                        </div>

                        {run.summary && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {run.summary}
                          </p>
                        )}
                      </div>

                      {/* Filter discoveries button */}
                      {onSelectRunForFilter && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                          onClick={() => {
                            onSelectRunForFilter(run.id, run.topic || run.field || "Run");
                            onOpenChange(false);
                          }}
                        >
                          <Filter className="size-3" />
                          View Discoveries
                        </Button>
                      )}
                    </div>

                    {/* Metadata strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>
                          Ideas Found:{" "}
                          <strong className="text-foreground font-mono">
                            {run.createdCount}
                          </strong>{" "}
                          / {run.requestedCount} requested
                        </span>
                        <span>•</span>
                        <span>
                          Quality Gate:{" "}
                          <strong className="text-foreground font-mono">
                            ≥{run.qualityThreshold}/100
                          </strong>
                        </span>
                        {run.durationMs > 0 && (
                          <>
                            <span>•</span>
                            <span>Duration: {(run.durationMs / 1000).toFixed(1)}s</span>
                          </>
                        )}
                      </div>

                      {/* Sources list */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] uppercase font-semibold">Sources:</span>
                        {sources.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-muted/70 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground capitalize"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
