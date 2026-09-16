"use client";

import React from "react";
import type { Opportunity, OpportunityStatus } from "@/lib/opportunities/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bookmark,
  Star,
  Sparkles,
  User,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Archive,
  Ban,
  Clock,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opp: Opportunity) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleSaved: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: OpportunityStatus, e?: React.MouseEvent) => void;
  onDelete?: (id: string, e?: React.MouseEvent) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  onDeepResearch?: (opp: Opportunity, e: React.MouseEvent) => void;
}

const STATUS_ORDER: OpportunityStatus[] = [
  "NEW",
  "REVIEW",
  "INTERESTING",
  "RESEARCHING",
  "VALIDATING",
  "MVP",
  "BUILDING",
  "LAUNCHED",
];

export function OpportunityCard({
  opportunity,
  onSelect,
  onToggleFavorite,
  onToggleSaved,
  onStatusChange,
  onDelete,
  isDragging,
  isSelected,
  onToggleSelect,
  onDeepResearch,
}: OpportunityCardProps) {
  const currentIdx = STATUS_ORDER.indexOf(opportunity.status);
  const prevStatus = currentIdx > 0 ? STATUS_ORDER[currentIdx - 1] : null;
  const nextStatus =
    currentIdx >= 0 && currentIdx < STATUS_ORDER.length - 1
      ? STATUS_ORDER[currentIdx + 1]
      : null;

  // AI Priority styles
  const priorityConfig = {
    HIGH_POTENTIAL: {
      label: "HIGH POTENTIAL",
      badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold",
      dot: "bg-emerald-400",
    },
    MEDIUM_POTENTIAL: {
      label: "MEDIUM POTENTIAL",
      badge: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold",
      dot: "bg-amber-400",
    },
    LOW_POTENTIAL: {
      label: "LOW POTENTIAL",
      badge: "border-zinc-600 bg-zinc-800 text-zinc-300 font-normal",
      dot: "bg-zinc-400",
    },
    VERY_LOW_PRIORITY: {
      label: "VERY LOW",
      badge: "border-zinc-700 bg-zinc-900 text-zinc-500",
      dot: "bg-zinc-600",
    },
    CRITICAL_REVIEW: {
      label: "CRITICAL REVIEW",
      badge: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-semibold",
      dot: "bg-rose-400",
    },
  }[opportunity.aiPriority] ?? {
    label: opportunity.aiPriority,
    badge: "border-border bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground",
  };

  // Human decision badge styles
  const decisionConfig = {
    BUILD: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300",
    INTERESTED: "border-sky-500/50 bg-sky-950/40 text-sky-300",
    VALIDATING: "border-purple-500/50 bg-purple-950/40 text-purple-300",
    LATER: "border-amber-500/50 bg-amber-950/40 text-amber-300",
    DO_NOT_BUILD: "border-red-500/50 bg-red-950/40 text-red-300",
    UNDECIDED: "border-border/60 bg-muted/30 text-muted-foreground/80",
  }[opportunity.myDecision] ?? "border-border text-muted-foreground";

  return (
    <div
      onClick={() => onSelect(opportunity)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", opportunity.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group relative rounded-xl border border-border/80 bg-card p-4 transition-all duration-150 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer select-none space-y-3 ${
        isDragging ? "opacity-40 scale-95" : "opacity-100"
      }`}
    >
      {/* Top row: Badges & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Selection Checkbox */}
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                onToggleSelect(opportunity.id, e as any);
              }}
              className="size-3.5 rounded border-border accent-primary cursor-pointer mr-0.5"
            />
          )}

          {/* AI Priority */}
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] tracking-tight ${priorityConfig.badge}`}
          >
            <span className={`size-1.5 rounded-full ${priorityConfig.dot}`} />
            {priorityConfig.label}
          </span>

          {/* User vs AI origin */}
          {opportunity.isUserGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
              <User className="size-2.5" />
              MY IDEA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
              <Sparkles className="size-2.5" />
              AI DISCOVERED
            </span>
          )}
        </div>

        {/* Favorite & Bookmark Buttons */}
        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {onDeepResearch && (
            <button
              type="button"
              title="13-Dimension Deep Research"
              onClick={(e) => {
                e.stopPropagation();
                onDeepResearch(opportunity, e);
              }}
              className="p-1 rounded-md hover:bg-muted/70 text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Sparkles className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            title={opportunity.favorite ? "Favorited" : "Mark as Favorite"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(opportunity.id, e);
            }}
            className={`p-1 rounded-md hover:bg-muted/70 transition-colors ${
              opportunity.favorite ? "text-amber-400" : "text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            <Star className={`size-3.5 ${opportunity.favorite ? "fill-amber-400" : ""}`} />
          </button>
          <button
            type="button"
            title={opportunity.saved ? "Saved" : "Save for later"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved(opportunity.id, e);
            }}
            className={`p-1 rounded-md hover:bg-muted/70 transition-colors ${
              opportunity.saved ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            <Bookmark className={`size-3.5 ${opportunity.saved ? "fill-primary" : ""}`} />
          </button>

          {/* Quick Context Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-md hover:bg-muted/70 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              {onDeepResearch && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeepResearch(opportunity, e);
                  }}
                  className="text-violet-400 focus:text-violet-300 font-medium"
                >
                  <Sparkles className="size-3.5 mr-1.5 text-violet-400" />
                  13D Deep Research
                </DropdownMenuItem>
              )}
              {nextStatus && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, nextStatus, e);
                  }}
                >
                  <ArrowRight className="size-3.5 mr-1.5 text-primary" />
                  Move to {nextStatus}
                </DropdownMenuItem>
              )}
              {prevStatus && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, prevStatus, e);
                  }}
                >
                  <ArrowLeft className="size-3.5 mr-1.5 text-muted-foreground" />
                  Move back to {prevStatus}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {opportunity.status !== "REJECTED" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, "REJECTED", e);
                  }}
                >
                  <Ban className="size-3.5 mr-1.5 text-rose-400" />
                  Mark Rejected
                </DropdownMenuItem>
              )}
              {opportunity.status !== "ARCHIVED" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, "ARCHIVED", e);
                  }}
                >
                  <Archive className="size-3.5 mr-1.5 text-zinc-400" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(opportunity.id, e);
                    }}
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Opportunity Title */}
      <div>
        <h4 className="font-semibold text-sm leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {opportunity.title}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {opportunity.problem || opportunity.description}
        </p>
      </div>

      {/* Meta Bar: Industry + Research Score */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
        <span className="inline-flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {opportunity.industry || "General"}
        </span>

        {/* Score indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Score
          </span>
          <span
            className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
              opportunity.researchScore >= 80
                ? "bg-emerald-500/15 text-emerald-400"
                : opportunity.researchScore >= 60
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-zinc-500/15 text-zinc-400"
            }`}
          >
            {opportunity.researchScore}
          </span>
        </div>
      </div>

      {/* Bottom Bar: Human Decision + Next Action */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/70">My Decision:</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${decisionConfig}`}>
            {opportunity.myDecision.replace(/_/g, " ")}
          </span>
        </div>

        {opportunity.nextAction ? (
          <div className="rounded-md bg-muted/40 px-2 py-1 text-[11px] text-foreground/90 flex items-start gap-1.5">
            <span className="font-medium text-primary shrink-0">Next:</span>
            <span className="truncate">{opportunity.nextAction}</span>
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground/50 italic">No next action set</div>
        )}
      </div>

      {/* Quick Stage Shift Buttons */}
      <div className="flex items-center justify-between pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {prevStatus ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(opportunity.id, prevStatus, e);
            }}
          >
            <ArrowLeft className="size-2.5 mr-1" />
            {prevStatus}
          </Button>
        ) : (
          <div />
        )}
        {nextStatus ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-primary hover:text-primary hover:bg-primary/10 ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(opportunity.id, nextStatus, e);
            }}
          >
            {nextStatus}
            <ArrowRight className="size-2.5 ml-1" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
