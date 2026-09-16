"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type {
  Opportunity,
  OpportunityStatus,
  MyDecision,
  AiPriority,
} from "@/lib/opportunities/types";
import { KanbanBoard } from "./kanban-board";
import { TableView } from "./table-view";
import { OpportunityDetailDialog } from "./opportunity-detail-dialog";
import { CreateOpportunityDialog } from "./create-opportunity-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { ResearchPreflightDialog } from "./research-preflight-dialog";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Star,
  Bookmark,
  Sparkles,
  User,
  Download,
  Flame,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Archive,
  Ban,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

interface OpportunityRadarProps {
  onSendToValidate?: (topic: string) => void;
  onOpenIntegrations?: () => void;
}

type ViewMode =
  | "kanban"
  | "table"
  | "copilot"
  | "saved"
  | "favorites"
  | "my-ideas"
  | "high-potential"
  | "validating"
  | "rejected"
  | "archived";

export function OpportunityRadar({ onSendToValidate, onOpenIntegrations }: OpportunityRadarProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState<"quick" | "deep" | false>(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<OpportunityStatus>("NEW");
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [preflightMode, setPreflightMode] = useState<"quick" | "deep">("quick");
  const [integrationStats, setIntegrationStats] = useState<{ total: number; connected: number }>({
    total: 6,
    connected: 0,
  });

  // Filter & Search states
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedConfidence, setSelectedConfidence] = useState("all");
  const [sortBy, setSortBy] = useState("updated");

  // Load opportunities from API
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const [oppsRes, intRes] = await Promise.all([
        fetch("/api/opportunities"),
        fetch("/api/integrations").catch(() => null),
      ]);
      if (oppsRes.ok) {
        const data = await oppsRes.json();
        setOpportunities(data.opportunities || []);
      }
      if (intRes && intRes.ok) {
        const intData = await intRes.json();
        if (intData.stats) {
          setIntegrationStats(intData.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleRunResearch = useCallback(
    async (mode: "quick" | "deep") => {
      setResearching(mode);
      try {
        const res = await fetch("/api/research/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        if (res.ok) {
          await fetchOpportunities();
        }
      } catch (err) {
        console.error("Research run error:", err);
      } finally {
        setResearching(false);
      }
    },
    [fetchOpportunities],
  );

  // Industry options derived dynamically
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.industry) set.add(o.industry);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  // Metric counts
  const stats = useMemo(() => {
    const total = opportunities.length;
    const highPotential = opportunities.filter((o) => o.aiPriority === "HIGH_POTENTIAL").length;
    const favorites = opportunities.filter((o) => o.favorite).length;
    const saved = opportunities.filter((o) => o.saved).length;
    const myIdeas = opportunities.filter((o) => o.isUserGenerated).length;
    const validating = opportunities.filter((o) => o.status === "VALIDATING").length;
    const building = opportunities.filter((o) => o.status === "BUILDING").length;
    const mvp = opportunities.filter((o) => o.status === "MVP").length;
    const newCount = opportunities.filter((o) => o.status === "NEW").length;
    return {
      total,
      highPotential,
      favorites,
      saved,
      myIdeas,
      validating,
      building,
      mvp,
      newCount,
    };
  }, [opportunities]);

  // Filtered & Sorted opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Tab view constraints
      if (viewMode === "saved" && !opp.saved) return false;
      if (viewMode === "favorites" && !opp.favorite) return false;
      if (viewMode === "my-ideas" && !opp.isUserGenerated) return false;
      if (viewMode === "high-potential" && opp.aiPriority !== "HIGH_POTENTIAL") return false;
      if (viewMode === "validating" && opp.status !== "VALIDATING") return false;
      if (viewMode === "rejected" && opp.status !== "REJECTED") return false;
      if (viewMode === "archived" && opp.status !== "ARCHIVED") return false;

      // In general Kanban / Table view, hide REJECTED and ARCHIVED by default
      if (
        (viewMode === "kanban" || viewMode === "table") &&
        (opp.status === "REJECTED" || opp.status === "ARCHIVED")
      ) {
        return false;
      }

      // Industry filter
      if (selectedIndustry !== "all" && opp.industry.toLowerCase() !== selectedIndustry.toLowerCase()) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== "all" && opp.aiPriority !== selectedPriority) {
        return false;
      }

      // Confidence filter
      if (selectedConfidence !== "all" && opp.aiConfidence !== selectedConfidence) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesProblem = opp.problem.toLowerCase().includes(q);
        const matchesCustomer = opp.targetCustomer.toLowerCase().includes(q);
        const matchesIndustry = opp.industry.toLowerCase().includes(q);
        const matchesTags = opp.tags && opp.tags.some((t) => t.toLowerCase().includes(q));
        const matchesNotes = opp.notes && opp.notes.some((n) => n.content.toLowerCase().includes(q));
        const matchesThoughts = opp.myThoughts && opp.myThoughts.toLowerCase().includes(q);
        if (
          !matchesTitle &&
          !matchesProblem &&
          !matchesCustomer &&
          !matchesIndustry &&
          !matchesTags &&
          !matchesNotes &&
          !matchesThoughts
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    opportunities,
    viewMode,
    selectedIndustry,
    selectedPriority,
    selectedConfidence,
    searchQuery,
  ]);

  // Status Change Handler
  async function handleStatusChange(id: string, newStatus: OpportunityStatus) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
    );
    try {
      await fetch(`/api/opportunities/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchOpportunities();
    }
  }

  // Decision Change Handler
  async function handleDecisionChange(id: string, newDecision: MyDecision) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, myDecision: newDecision } : o)),
    );
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myDecision: newDecision }),
      });
    } catch (err) {
      console.error("Failed to update decision:", err);
      fetchOpportunities();
    }
  }

  // Toggle Favorite
  async function handleToggleFavorite(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;
    const nextVal = !opp.favorite;
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, favorite: nextVal } : o)),
    );
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextVal }),
      });
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }

  // Toggle Saved
  async function handleToggleSaved(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;
    const nextVal = !opp.saved;
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, saved: nextVal } : o)),
    );
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: nextVal }),
      });
    } catch (err) {
      console.error("Failed to toggle saved:", err);
    }
  }

  // Update full opportunity
  async function handleUpdateOpportunity(id: string, updates: Partial<Opportunity>) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
    if (selectedOpp && selectedOpp.id === id) {
      setSelectedOpp((prev) => (prev ? { ...prev, ...updates } : null));
    }
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update opportunity:", err);
    }
  }

  // Delete Opportunity
  async function handleDeleteOpportunity(id: string) {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    if (selectedOpp && selectedOpp.id === id) setSelectedOpp(null);
    try {
      await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete opportunity:", err);
      fetchOpportunities();
    }
  }

  // Create Opportunity
  async function handleCreateOpportunity(data: Partial<Opportunity>) {
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setOpportunities((prev) => [json.opportunity, ...prev]);
        setSelectedOpp(json.opportunity);
      }
    } catch (err) {
      console.error("Failed to create opportunity:", err);
    }
  }

  // Bulk Export to Obsidian
  async function handleExportAllObsidian() {
    try {
      const res = await fetch("/api/opportunities/export/obsidian-all");
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `obsidian-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to bulk export:", err);
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
      {/* ── METRICS STRIP ────────────────────────────────────────────── */}
      <div className="border-b border-border/70 bg-card/50 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-foreground flex items-center gap-2">
                SaaS Opportunity Radar
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Hermes Ready
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Personal startup intelligence & workflow command center
              </p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 hover:border-primary transition-colors"
            >
              <span className="text-muted-foreground">Total:</span>
              <strong className="font-mono text-foreground">{stats.total}</strong>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("high-potential")}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Flame className="size-3" />
              <span>High Potential:</span>
              <strong className="font-mono">{stats.highPotential}</strong>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("favorites")}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Star className="size-3 fill-amber-400" />
              <span>Favorites:</span>
              <strong className="font-mono">{stats.favorites}</strong>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("saved")}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary hover:bg-primary/20 transition-colors"
            >
              <Bookmark className="size-3 fill-primary" />
              <span>Saved:</span>
              <strong className="font-mono">{stats.saved}</strong>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("my-ideas")}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              <User className="size-3" />
              <span>My Ideas:</span>
              <strong className="font-mono">{stats.myIdeas}</strong>
            </button>

            {/* Integrations Hub Indicator Pill */}
            <button
              type="button"
              onClick={onOpenIntegrations}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 hover:border-primary transition-colors text-xs"
              title="Open Integrations & Credentials Hub"
            >
              <span
                className={`size-2 rounded-full ${
                  integrationStats.connected > 0 ? "bg-emerald-400" : "bg-muted-foreground"
                }`}
              />
              <span className="text-muted-foreground">Integrations:</span>
              <strong className="font-mono text-foreground">
                {integrationStats.connected}/{integrationStats.total}
              </strong>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Run Research Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={researching !== false}
                className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 h-8 text-xs gap-1.5 px-3 font-medium cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {researching ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {researching === "deep" ? "Deep Crawl..." : "Quick Search..."}
                  </>
                ) : (
                  <>
                    <Search className="size-3.5 text-primary" />
                    Run Research Now
                  </>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuItem
                  onClick={() => {
                    setPreflightMode("quick");
                    setPreflightOpen(true);
                  }}
                >
                  <Search className="size-3.5 mr-2 text-primary" />
                  <div>
                    <p className="font-semibold">Quick Research</p>
                    <p className="text-[10px] text-muted-foreground">Fast signal discovery & scoring</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setPreflightMode("deep");
                    setPreflightOpen(true);
                  }}
                >
                  <Sparkles className="size-3.5 mr-2 text-purple-400" />
                  <div>
                    <p className="font-semibold">Deep Research</p>
                    <p className="text-[10px] text-muted-foreground">Exhaustive crawl & competitor gaps</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleExportAllObsidian}
              title="Download all opportunities as JSON bundle for Obsidian"
            >
              <Download className="size-3.5" />
              Obsidian Sync
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
              onClick={() => {
                setCreateDefaultStatus("NEW");
                setCreateOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Create Opportunity
            </Button>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: TABS & FILTERS ──────────────────────────────────── */}
      <div className="border-b border-border/70 bg-card/20 px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Nav */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2.5 font-medium"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="size-3.5" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2.5 font-medium"
              onClick={() => setViewMode("table")}
            >
              <List className="size-3.5" />
              Table View
            </Button>
            <Button
              variant={viewMode === "copilot" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2.5 font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => setViewMode("copilot")}
            >
              <MessageSquare className="size-3.5 text-primary" />
              AI Copilot
            </Button>
            <div className="h-4 w-px bg-border/80 mx-1" />
            <Button
              variant={viewMode === "saved" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("saved")}
            >
              Saved ({stats.saved})
            </Button>
            <Button
              variant={viewMode === "favorites" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("favorites")}
            >
              Favorites ({stats.favorites})
            </Button>
            <Button
              variant={viewMode === "my-ideas" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("my-ideas")}
            >
              My Ideas ({stats.myIdeas})
            </Button>
            <Button
              variant={viewMode === "high-potential" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("high-potential")}
            >
              High Potential ({stats.highPotential})
            </Button>
            <Button
              variant={viewMode === "validating" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("validating")}
            >
              Validating ({stats.validating})
            </Button>
            <Button
              variant={viewMode === "rejected" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("rejected")}
            >
              Rejected
            </Button>
            <Button
              variant={viewMode === "archived" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setViewMode("archived")}
            >
              Archived
            </Button>
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, problem, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 text-xs"
              />
            </div>

            {/* Industry Filter */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="h-7 rounded-lg border border-border/80 bg-background px-2 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="all">All Industries</option>
              {availableIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {/* AI Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-7 rounded-lg border border-border/80 bg-background px-2 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="HIGH_POTENTIAL">High Potential</option>
              <option value="MEDIUM_POTENTIAL">Medium Potential</option>
              <option value="LOW_POTENTIAL">Low Potential</option>
              <option value="VERY_LOW_PRIORITY">Very Low</option>
              <option value="CRITICAL_REVIEW">Critical Review</option>
            </select>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={fetchOpportunities}
              title="Refresh opportunities"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ─────────────────────────────────── */}
      <div className="flex-1 overflow-hidden p-4">
        {viewMode === "copilot" ? (
          <CopilotChat
            onRefreshOpportunities={fetchOpportunities}
            onSelectOpportunity={(opp) => setSelectedOpp(opp)}
          />
        ) : viewMode === "table" ||
          viewMode === "saved" ||
          viewMode === "favorites" ||
          viewMode === "my-ideas" ||
          viewMode === "high-potential" ||
          viewMode === "validating" ||
          viewMode === "rejected" ||
          viewMode === "archived" ? (
          <TableView
            opportunities={filteredOpportunities}
            onSelectOpportunity={(opp) => setSelectedOpp(opp)}
            onToggleFavorite={handleToggleFavorite}
            onToggleSaved={handleToggleSaved}
            onStatusChange={handleStatusChange}
            onDecisionChange={handleDecisionChange}
            onDeleteOpportunity={handleDeleteOpportunity}
          />
        ) : (
          <KanbanBoard
            opportunities={filteredOpportunities}
            onSelectOpportunity={(opp) => setSelectedOpp(opp)}
            onToggleFavorite={handleToggleFavorite}
            onToggleSaved={handleToggleSaved}
            onStatusChange={handleStatusChange}
            onDeleteOpportunity={handleDeleteOpportunity}
            onCreateInStatus={(status) => {
              setCreateDefaultStatus(status);
              setCreateOpen(true);
            }}
          />
        )}
      </div>

      {/* ── DIALOGS ─────────────────────────────────────────────────── */}
      <OpportunityDetailDialog
        opportunity={selectedOpp}
        open={!!selectedOpp}
        onOpenChange={(open) => {
          if (!open) setSelectedOpp(null);
        }}
        onUpdateOpportunity={handleUpdateOpportunity}
        onSendToValidate={onSendToValidate}
      />

      <CreateOpportunityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus={createDefaultStatus}
        onCreateOpportunity={handleCreateOpportunity}
      />

      <ResearchPreflightDialog
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        mode={preflightMode}
        onProceed={handleRunResearch}
        onOpenIntegrations={() => onOpenIntegrations?.()}
      />
    </div>
  );
}
