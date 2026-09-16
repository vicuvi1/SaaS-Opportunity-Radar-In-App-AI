"use client";

import React from "react";
import type { Opportunity, OpportunityStatus, MyDecision } from "@/lib/opportunities/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Bookmark,
  Sparkles,
  User,
  ArrowUpDown,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface TableViewProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleSaved: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: OpportunityStatus) => void;
  onDecisionChange: (id: string, decision: MyDecision) => void;
  onDeleteOpportunity?: (id: string, e?: React.MouseEvent) => void;
}

const ALL_STATUSES: OpportunityStatus[] = [
  "NEW",
  "REVIEW",
  "INTERESTING",
  "RESEARCHING",
  "VALIDATING",
  "MVP",
  "BUILDING",
  "LAUNCHED",
  "REJECTED",
  "ARCHIVED",
];

const ALL_DECISIONS: MyDecision[] = [
  "UNDECIDED",
  "INTERESTED",
  "LATER",
  "VALIDATING",
  "BUILD",
  "DO_NOT_BUILD",
];

export function TableView({
  opportunities,
  onSelectOpportunity,
  onToggleFavorite,
  onToggleSaved,
  onStatusChange,
  onDecisionChange,
  onDeleteOpportunity,
}: TableViewProps) {
  if (opportunities.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-8 text-center">
        <p className="text-sm font-medium text-foreground">No opportunities match the current filter</p>
        <p className="mt-1 text-xs text-muted-foreground">Adjust filters or create a new opportunity to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border/70 bg-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
            <th className="py-3 px-3 w-10 text-center">★</th>
            <th className="py-3 px-4 min-w-[240px]">Opportunity</th>
            <th className="py-3 px-3 min-w-[130px]">Status</th>
            <th className="py-3 px-3 min-w-[140px]">AI Priority</th>
            <th className="py-3 px-3 w-20 text-center">Score</th>
            <th className="py-3 px-3 min-w-[130px]">My Decision</th>
            <th className="py-3 px-4 min-w-[200px]">Next Action</th>
            <th className="py-3 px-3 min-w-[100px]">Industry</th>
            <th className="py-3 px-3 w-16 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {opportunities.map((opp) => {
            const scoreColor =
              opp.researchScore >= 80
                ? "bg-emerald-500/15 text-emerald-400 font-bold"
                : opp.researchScore >= 60
                  ? "bg-amber-500/15 text-amber-400 font-semibold"
                  : "bg-zinc-500/15 text-zinc-400";

            return (
              <tr
                key={opp.id}
                onClick={() => onSelectOpportunity(opp)}
                className="group hover:bg-muted/30 transition-colors cursor-pointer"
              >
                {/* Star & Bookmark */}
                <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(opp.id, e)}
                      className={`p-1 rounded hover:bg-muted/70 ${
                        opp.favorite ? "text-amber-400" : "text-muted-foreground/40 hover:text-foreground"
                      }`}
                    >
                      <Star className={`size-3.5 ${opp.favorite ? "fill-amber-400" : ""}`} />
                    </button>
                  </div>
                </td>

                {/* Title & Problem */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm line-clamp-1">
                        {opp.title}
                      </span>
                      {opp.isUserGenerated ? (
                        <span className="shrink-0 rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.2 text-[9px] font-medium text-purple-300">
                          MY IDEA
                        </span>
                      ) : (
                        <span className="shrink-0 rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.2 text-[9px] font-medium text-sky-300">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{opp.problem}</p>
                  </div>
                </td>

                {/* Status selector */}
                <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={opp.status}
                    onChange={(e) => onStatusChange(opp.id, e.target.value as OpportunityStatus)}
                    className="rounded-lg border border-border/70 bg-background px-2 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* AI Priority */}
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                      opp.aiPriority === "HIGH_POTENTIAL"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
                        : opp.aiPriority === "MEDIUM_POTENTIAL"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {opp.aiPriority.replace(/_/g, " ")}
                  </span>
                </td>

                {/* Score */}
                <td className="py-3 px-3 text-center">
                  <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded ${scoreColor}`}>
                    {opp.researchScore}
                  </span>
                </td>

                {/* My Decision */}
                <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={opp.myDecision}
                    onChange={(e) => onDecisionChange(opp.id, e.target.value as MyDecision)}
                    className={`rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none ${
                      opp.myDecision === "BUILD"
                        ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                        : opp.myDecision === "INTERESTED"
                          ? "border-sky-500/50 bg-sky-950/40 text-sky-300"
                          : "border-border/70 bg-background text-foreground"
                    }`}
                  >
                    {ALL_DECISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Next Action */}
                <td className="py-3 px-4">
                  <p className="text-xs text-foreground/80 line-clamp-1 italic">
                    {opp.nextAction || <span className="text-muted-foreground/50 not-italic">None</span>}
                  </p>
                </td>

                {/* Industry */}
                <td className="py-3 px-3">
                  <span className="rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {opp.industry}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title={opp.saved ? "Saved" : "Save"}
                      onClick={(e) => onToggleSaved(opp.id, e)}
                      className={`p-1.5 rounded hover:bg-muted ${
                        opp.saved ? "text-primary" : "text-muted-foreground/40 hover:text-foreground"
                      }`}
                    >
                      <Bookmark className={`size-3.5 ${opp.saved ? "fill-primary" : ""}`} />
                    </button>
                    {onDeleteOpportunity && (
                      <button
                        type="button"
                        title="Delete"
                        onClick={(e) => onDeleteOpportunity(opp.id, e)}
                        className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
