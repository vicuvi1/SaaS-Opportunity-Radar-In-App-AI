"use client";

import { useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";

function PresetChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        selected
          ? "border-primary bg-primary/20 text-primary"
          : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function CustomChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full opacity-60 hover:opacity-100 transition-opacity"
        aria-label={`Remove ${label}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

export function ChipGroup({
  options,
  selected,
  multi = false,
  onChange,
  allowCustom = false,
  customPlaceholder = "Add your own…",
  searchable = false,
  searchPlaceholder = "Search…",
}: {
  options: string[];
  selected: string | string[];
  multi?: boolean;
  onChange: (val: string | string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const optionSet = new Set(options);

  const selectedArr: string[] = multi
    ? (selected as string[])
    : selected
      ? [selected as string]
      : [];

  const customValues: string[] = selectedArr.filter((v) => !optionSet.has(v));

  const isSelected = (opt: string) =>
    multi ? (selected as string[]).includes(opt) : selected === opt;

  const toggle = (opt: string) => {
    if (multi) {
      const arr = selected as string[];
      onChange(arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]);
    } else {
      onChange(opt === selected ? "" : opt);
    }
  };

  const remove = (val: string) => {
    if (multi) {
      onChange((selected as string[]).filter((v) => v !== val));
    } else {
      onChange("");
    }
  };

  const addCustom = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (multi) {
      if (!(selected as string[]).includes(v)) onChange([...(selected as string[]), v]);
    } else {
      onChange(v);
    }
  };

  // ── Searchable mode ───────────────────────────────────────────────────────
  if (searchable) {
    const q = query.trim().toLowerCase();
    const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    const hasExactMatch = options.some((o) => o.toLowerCase() === q);
    const showAdd =
      allowCustom && query.trim() && !hasExactMatch && !selectedArr.includes(query.trim());

    return (
      <div className="space-y-2">
        {/* Selected chips */}
        {selectedArr.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedArr.map((val) => (
              <CustomChip key={val} label={val} onRemove={() => remove(val)} />
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (showAdd) { addCustom(query); setQuery(""); }
              }
            }}
            placeholder={searchPlaceholder}
            className={`h-8 w-full rounded-lg border border-border/50 bg-background/60 pl-8 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 ${showAdd ? "pr-16" : "pr-3"}`}
          />
          {showAdd && (
            <button
              type="button"
              onClick={() => { addCustom(query); setQuery(""); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="size-3" />
              Add
            </button>
          )}
        </div>

        {/* Options list */}
        <div className="max-h-44 overflow-y-auto rounded-lg border border-border/50 bg-background/40">
          {filtered.map((opt) => {
            const sel = isSelected(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { toggle(opt); setQuery(""); }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-muted/40 ${
                  sel ? "bg-primary/5 font-medium text-primary" : "text-foreground"
                }`}
              >
                {opt}
                {sel && <Check className="size-3 shrink-0 text-primary" />}
              </button>
            );
          })}
          {showAdd && (
            <button
              type="button"
              onClick={() => { addCustom(query); setQuery(""); }}
              className="flex w-full items-center gap-1.5 border-t border-border/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <span className="text-primary">+</span> Add &ldquo;{query.trim()}&rdquo;
            </button>
          )}
          {filtered.length === 0 && !showAdd && (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground/50">
              No matches
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Default (non-searchable) mode ─────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <PresetChip
            key={opt}
            label={opt}
            selected={isSelected(opt)}
            onClick={() => toggle(opt)}
          />
        ))}
        {customValues.map((val) => (
          <CustomChip key={val} label={val} onRemove={() => remove(val)} />
        ))}
      </div>

      {allowCustom && (
        <form
          onSubmit={(e) => { e.preventDefault(); addCustom(draft); setDraft(""); }}
          className="flex gap-1.5"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={customPlaceholder}
            className="h-7 min-w-0 flex-1 rounded-lg border border-border/50 bg-background/60 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
