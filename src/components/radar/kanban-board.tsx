"use client";

import React, { useState } from "react";
import type { Opportunity, OpportunityStatus } from "@/lib/opportunities/types";
import { OpportunityCard } from "./opportunity-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleSaved: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: OpportunityStatus, e?: React.MouseEvent) => void;
  onShortlist?: (id: string, e: React.MouseEvent) => void;
  onReject?: (id: string, e: React.MouseEvent) => void;
  onDeleteOpportunity?: (id: string, e?: React.MouseEvent) => void;
  onCreateInStatus?: (status: OpportunityStatus) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  onDeepResearch?: (opp: Opportunity, e: React.MouseEvent) => void;
}

const KANBAN_COLUMNS: Array<{
  status: OpportunityStatus;
  label: string;
  description: string;
  accent: string;
}> = [
  { status: "NEW", label: "NEW", description: "Fresh AI discoveries", accent: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
  { status: "REVIEW", label: "REVIEW", description: "Promising thesis to explore", accent: "border-purple-500/50 bg-purple-500/10 text-purple-400" },
  { status: "DEEP_RESEARCH", label: "DEEP RESEARCH", description: "13-dimension investigation active", accent: "border-violet-500/50 bg-violet-500/10 text-violet-400" },
  { status: "SHORTLIST", label: "SHORTLIST", description: "Personally selected for serious pursuit", accent: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" },
];

export function KanbanBoard({
  opportunities,
  onSelectOpportunity,
  onToggleFavorite,
  onToggleSaved,
  onStatusChange,
  onShortlist,
  onReject,
  onDeleteOpportunity,
  onCreateInStatus,
  selectedIds,
  onToggleSelect,
  onDeepResearch,
}: KanbanBoardProps) {
  const [dragOverCol, setDragOverCol] = useState<OpportunityStatus | null>(null);

  return (
    <div className="grid h-full w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 pt-1 px-1 overflow-y-auto">
      {KANBAN_COLUMNS.map((col) => {
        const columnOpps = opportunities.filter((o) => o.status === col.status);
        const highPotentialCount = columnOpps.filter(
          (o) => o.aiPriority === "HIGH_POTENTIAL",
        ).length;
        const isTarget = dragOverCol === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverCol !== col.status) setDragOverCol(col.status);
            }}
            onDragLeave={(e) => {
              // Only clear if leaving the column container
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverCol(null);
              const oppId = e.dataTransfer.getData("text/plain");
              if (oppId) {
                onStatusChange(oppId, col.status);
              }
            }}
            className={`flex w-full flex-col rounded-2xl border bg-muted/20 backdrop-blur-sm transition-colors duration-150 ${
              isTarget
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border/60"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full border ${col.accent}`} />
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                  {columnOpps.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {highPotentialCount > 0 && (
                  <span
                    title={`${highPotentialCount} High Potential in this stage`}
                    className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30"
                  >
                    ★ {highPotentialCount}
                  </span>
                )}
                {onCreateInStatus && (
                  <button
                    type="button"
                    title={`Create opportunity in ${col.label}`}
                    onClick={() => onCreateInStatus(col.status)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Opportunity Cards List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 max-h-[calc(100vh-210px)] min-h-[160px]">
              {columnOpps.length === 0 ? (
                <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/40 p-4 text-center">
                  <p className="text-xs text-muted-foreground/60">No opportunities</p>
                  <span className="text-[10px] text-muted-foreground/40 mt-0.5">Drag card here</span>
                </div>
              ) : (
                columnOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onSelect={onSelectOpportunity}
                    onToggleFavorite={onToggleFavorite}
                    onToggleSaved={onToggleSaved}
                    onStatusChange={onStatusChange}
                    onShortlist={onShortlist}
                    onReject={onReject}
                    onDelete={onDeleteOpportunity}
                    isSelected={selectedIds?.has(opp.id)}
                    onToggleSelect={onToggleSelect}
                    onDeepResearch={onDeepResearch}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
