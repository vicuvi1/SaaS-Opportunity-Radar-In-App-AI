"use client";

import { Plus, Zap } from "lucide-react";

interface CreditsBadgeProps {
  credits: number | null;
  loading: boolean;
  onClick: () => void;
}

export function CreditsBadge({ credits, loading, onClick }: CreditsBadgeProps) {
  const low = typeof credits === "number" && credits < 6;

  const colorClass = low
    ? "border-amber-500/60 bg-amber-500/20 text-amber-400"
    : "border-primary/40 bg-primary/15 text-primary";

  return (
    <div className={`inline-flex items-center rounded-full border ${colorClass}`}>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 py-1.5 pl-3 pr-2 text-sm font-semibold"
        title="Credits"
      >
        <Zap className="size-3.5" fill="currentColor" />
        {loading ? (
          <span className="w-5 animate-pulse rounded bg-current/20">&nbsp;</span>
        ) : (
          <span>{credits ?? 0}</span>
        )}
      </button>
      <div className="mx-0.5 h-3.5 w-px bg-current opacity-20" />
      <button
        type="button"
        onClick={onClick}
        className="flex items-center px-2 py-1.5 transition-opacity hover:opacity-70"
        title="Buy more credits"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
