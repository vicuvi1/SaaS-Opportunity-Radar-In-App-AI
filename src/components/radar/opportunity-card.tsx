"use client";

import React from "react";
import type { Opportunity, OpportunityStatus } from "@/lib/opportunities/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Bookmark,
  Star,
  MoreVertical,
  Trash2,
  Archive,
  Ban,
  Check,
  Search,
  CheckCircle2,
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
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  onToggleSaved?: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: OpportunityStatus, e?: React.MouseEvent) => void;
  onShortlist?: (id: string, e: React.MouseEvent) => void;
  onReject?: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string, e?: React.MouseEvent) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  onDeepResearch?: (opp: Opportunity, e: React.MouseEvent) => void;
}

export function OpportunityCard({
  opportunity,
  onSelect,
  onToggleFavorite,
  onToggleSaved,
  onStatusChange,
  onShortlist,
  onReject,
  onDelete,
  isDragging,
  isSelected,
  onToggleSelect,
  onDeepResearch,
}: OpportunityCardProps) {
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
      badge: "border-zinc-700 bg-zinc-800 text-zinc-300",
      dot: "bg-zinc-400",
    },
    VERY_LOW_PRIORITY: {
      label: "VERY LOW",
      badge: "border-zinc-800 bg-zinc-900 text-zinc-500",
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

  const evidenceBadge = {
    HIGH: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    MEDIUM: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    LOW: "border-zinc-700 bg-zinc-800 text-zinc-400",
  }[opportunity.evidenceStrength] ?? "border-border text-muted-foreground";

  return (
    <div
      onClick={() => onSelect(opportunity)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", opportunity.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group relative rounded-xl border border-border/70 bg-card p-4 transition-all duration-150 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer select-none space-y-3 ${
        isDragging ? "opacity-40 scale-95" : "opacity-100"
      }`}
    >
      {/* 1. Header: Selection Checkbox + AI Priority + Evidence Strength + Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onToggleSelect(opportunity.id, e as any)}
              className="size-3.5 rounded border-border accent-primary cursor-pointer mr-0.5"
              title="Select for compare or export"
            />
          )}

          {/* AI Priority */}
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] tracking-tight ${priorityConfig.badge}`}>
            <span className={`size-1.5 rounded-full ${priorityConfig.dot}`} />
            {priorityConfig.label}
          </span>

          {/* Evidence Strength */}
          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${evidenceBadge}`}>
            Evidence: {opportunity.evidenceStrength}
          </span>
        </div>

        {/* Research Score */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Score:</span>
          <span
            className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ${
              opportunity.researchScore >= 75
                ? "bg-emerald-500/15 text-emerald-400"
                : opportunity.researchScore >= 55
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {opportunity.researchScore}
          </span>
        </div>
      </div>

      {/* 2. Title */}
      <div>
        <h4 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {opportunity.title}
        </h4>
        {/* Customer / Industry */}
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground/80 truncate">
          {opportunity.targetCustomer || "B2B Customers"} • {opportunity.industry || "General SaaS"}
        </p>
      </div>

      {/* 3. Short Problem */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {opportunity.problem || opportunity.description}
      </p>

      {/* 4. Next Research Action */}
      {opportunity.nextAction ? (
        <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-primary shrink-0">Next:</span>
          <span className="truncate">{opportunity.nextAction}</span>
        </div>
      ) : null}

      {/* 5. Actions: Primary [Deep Research] + Secondary [Shortlist], [Reject], [⋮] */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
        {/* Primary Action: Deep Research */}
        <Button
          type="button"
          size="sm"
          className="flex-1 h-7 text-xs gap-1.5 bg-violet-600/15 text-violet-300 hover:bg-violet-600/25 border border-violet-500/30 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            if (onDeepResearch) {
              onDeepResearch(opportunity, e);
            } else {
              onSelect(opportunity);
            }
          }}
        >
          <Sparkles className="size-3 text-violet-400" />
          Deep Research
        </Button>

        {/* Secondary Action: Shortlist */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 border-emerald-500/30"
          title="Save to Shortlist"
          onClick={(e) => {
            e.stopPropagation();
            if (onShortlist) {
              onShortlist(opportunity.id, e);
            } else {
              onStatusChange(opportunity.id, "SHORTLIST", e);
            }
          }}
        >
          <Check className="size-3 mr-1 text-emerald-400" />
          Shortlist
        </Button>

        {/* Secondary Action: Reject */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
          title="Reject Opportunity"
          onClick={(e) => {
            e.stopPropagation();
            if (onReject) {
              onReject(opportunity.id, e);
            } else {
              onStatusChange(opportunity.id, "REJECTED", e);
            }
          }}
        >
          <Ban className="size-3" />
        </Button>

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md hover:bg-muted/70 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(opportunity.id, "REVIEW", e);
              }}
            >
              <CheckCircle2 className="size-3.5 mr-1.5 text-sky-400" />
              Keep in Review
            </DropdownMenuItem>
            {onToggleFavorite && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(opportunity.id, e);
                }}
              >
                <Star className={`size-3.5 mr-1.5 ${opportunity.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                {opportunity.favorite ? "Favorited" : "Favorite"}
              </DropdownMenuItem>
            )}
            {onToggleSaved && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSaved(opportunity.id, e);
                }}
              >
                <Bookmark className={`size-3.5 mr-1.5 ${opportunity.saved ? "fill-primary text-primary" : ""}`} />
                {opportunity.saved ? "Bookmarked" : "Bookmark"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(opportunity.id, "ARCHIVED", e);
              }}
            >
              <Archive className="size-3.5 mr-1.5 text-zinc-400" />
              Archive
            </DropdownMenuItem>
            {onDelete && (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
