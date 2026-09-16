"use client";

import React, { useState, useMemo } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Compass,
  Search,
  Crosshair,
  ShieldAlert,
  Flame,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface MarketMatrixProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
}

export function MarketMatrix({
  opportunities,
  onSelectOpportunity,
}: MarketMatrixProps) {
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [hoveredOpp, setHoveredOpp] = useState<Opportunity | null>(null);

  // Extract unique industries
  const industries = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.industry) set.add(o.industry);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  // Filtered dataset
  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (selectedIndustry !== "all" && opp.industry !== selectedIndustry) {
        return false;
      }
      if (selectedStatus !== "all" && opp.status !== selectedStatus) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = opp.title.toLowerCase().includes(q);
        const matchProblem = opp.problem.toLowerCase().includes(q);
        const matchCustomer = opp.targetCustomer.toLowerCase().includes(q);
        if (!matchTitle && !matchProblem && !matchCustomer) return false;
      }
      return true;
    });
  }, [opportunities, selectedIndustry, selectedStatus, search]);

  // Calculate coordinates (X: Crowdedness 0-100, Y: Potential 0-100)
  const plotPoints = useMemo(() => {
    return filtered.map((opp) => {
      let x = opp.marketCrowdednessScore ?? 50;
      if (!opp.marketCrowdednessScore) {
        switch (opp.marketCrowdedness) {
          case "LOW":
            x = 22;
            break;
          case "MEDIUM":
            x = 48;
            break;
          case "HIGH":
            x = 76;
            break;
          case "SATURATED":
            x = 92;
            break;
          default:
            x = 50;
            break;
        }
      }

      // Y-axis is Business Potential (Research Score: 0-100)
      const y = Math.max(5, Math.min(95, opp.researchScore || 50));

      return {
        opp,
        x: Math.max(5, Math.min(95, x)),
        y,
      };
    });
  }, [filtered]);

  // Quadrant metrics
  const quadrantStats = useMemo(() => {
    let blueOcean = 0;
    let redOcean = 0;
    let niche = 0;
    let trap = 0;

    plotPoints.forEach(({ x, y }) => {
      if (y >= 50 && x <= 50) blueOcean++;
      else if (y >= 50 && x > 50) redOcean++;
      else if (y < 50 && x <= 50) niche++;
      else trap++;
    });

    return { blueOcean, redOcean, niche, trap };
  }, [plotPoints]);

  return (
    <div className="space-y-4">
      {/* Top Controls & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 backdrop-blur border border-border/70 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-cyan-400" />
            <h2 className="text-base font-semibold tracking-tight">
              Business Potential × Market Crowdedness Matrix
            </h2>
            <Badge variant="outline" className="text-xs bg-cyan-950/40 text-cyan-400 border-cyan-800">
              {filtered.length} Opportunities Plotted
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Objective competitive positioning. AI does not pick a winner — inspect evidence and decide what to shortlist.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search matrix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/40"
            />
          </div>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="NEW">New</option>
            <option value="REVIEW">Review</option>
            <option value="DEEP_RESEARCH">Deep Research</option>
            <option value="SHORTLIST">Shortlist</option>
          </select>
        </div>
      </div>

      {/* Quadrant Overview Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg border border-emerald-800/40 bg-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-400" />
            <div>
              <div className="font-medium text-emerald-300">Blue Ocean Wedge</div>
              <div className="text-[10px] text-muted-foreground">High Potential · Low Crowding</div>
            </div>
          </div>
          <span className="text-base font-bold text-emerald-400">{quadrantStats.blueOcean}</span>
        </div>

        <div className="p-2.5 rounded-lg border border-purple-800/40 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-purple-400" />
            <div>
              <div className="font-medium text-purple-300">Red Ocean Battlefield</div>
              <div className="text-[10px] text-muted-foreground">High Potential · High Crowding</div>
            </div>
          </div>
          <span className="text-base font-bold text-purple-400">{quadrantStats.redOcean}</span>
        </div>

        <div className="p-2.5 rounded-lg border border-blue-800/40 bg-blue-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-blue-400" />
            <div>
              <div className="font-medium text-blue-300">Niche / Specialist</div>
              <div className="text-[10px] text-muted-foreground">Modest TAM · Low Crowding</div>
            </div>
          </div>
          <span className="text-base font-bold text-blue-400">{quadrantStats.niche}</span>
        </div>

        <div className="p-2.5 rounded-lg border border-rose-800/40 bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-rose-400" />
            <div>
              <div className="font-medium text-rose-300">Commoditized Trap</div>
              <div className="text-[10px] text-muted-foreground">Low Potential · Saturated</div>
            </div>
          </div>
          <span className="text-base font-bold text-rose-400">{quadrantStats.trap}</span>
        </div>
      </div>

      {/* 2D Interactive Scatter Matrix Container */}
      <div className="relative border border-border/80 rounded-2xl bg-card/40 p-6 overflow-hidden select-none">
        {/* Axis Labels */}
        <div className="absolute top-2 left-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <span>▲ Business Potential (Research Score 0–100)</span>
        </div>
        <div className="absolute bottom-2 right-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <span>Market Crowdedness (Low → Saturated) ▶</span>
        </div>

        {/* 4 Quadrants Background Grid */}
        <div className="relative w-full h-[520px] rounded-xl border border-border/50 overflow-hidden bg-background/60">
          {/* Top-Left: Blue Ocean */}
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-emerald-950/10 hover:bg-emerald-950/20 transition-colors border-r border-b border-border/60 p-4">
            <span className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="size-3.5 text-emerald-400" />
              Blue Ocean Wedge
            </span>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              High reward, unaddressed gaps. Best for novel AI workflows.
            </p>
          </div>

          {/* Top-Right: Red Ocean */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-950/10 hover:bg-purple-950/20 transition-colors border-b border-border/60 p-4 text-right">
            <span className="text-xs font-bold text-purple-400/70 uppercase tracking-wider inline-flex items-center gap-1">
              <Flame className="size-3.5 text-purple-400" />
              Red Ocean Battleground
            </span>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Proven massive TAM, but established incumbents. Needs sharp 10x differentiation wedge.
            </p>
          </div>

          {/* Bottom-Left: Niche */}
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-950/10 hover:bg-blue-950/20 transition-colors border-r border-border/60 p-4 flex flex-col justify-end">
            <span className="text-xs font-bold text-blue-400/70 uppercase tracking-wider flex items-center gap-1">
              <Layers className="size-3.5 text-blue-400" />
              Niche Specialist
            </span>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Low competition, smaller economic loss. Ideal for bootstrap micro-SaaS.
            </p>
          </div>

          {/* Bottom-Right: Commoditized Trap */}
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-rose-950/10 hover:bg-rose-950/20 transition-colors p-4 flex flex-col justify-end text-right">
            <span className="text-xs font-bold text-rose-400/70 uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldAlert className="size-3.5 text-rose-400" />
              Commoditized Trap
            </span>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Crowded market with marginal value add or high wrapper risk. High churn danger.
            </p>
          </div>

          {/* Crosshair Center Point Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="size-6 rounded-full border border-dashed border-primary/30 flex items-center justify-center">
              <Crosshair className="size-3 text-muted-foreground/50" />
            </div>
          </div>

          {/* Plotted Opportunity Bubbles */}
          {plotPoints.map(({ opp, x, y }) => {
            const isHovered = hoveredOpp?.id === opp.id;
            // Bubble color based on score & crowdedness
            let bubbleColor = "bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/30";
            if (y >= 75 && x <= 45) {
              bubbleColor = "bg-emerald-500 border-emerald-300 text-white shadow-emerald-500/40";
            } else if (y >= 70 && x > 50) {
              bubbleColor = "bg-purple-500 border-purple-300 text-white shadow-purple-500/40";
            } else if (y < 45 && x > 55) {
              bubbleColor = "bg-rose-500 border-rose-300 text-white shadow-rose-500/40";
            }

            // Size proportional to evidence strength
            const sizePx =
              opp.evidenceStrength === "HIGH" ? 34 : opp.evidenceStrength === "MEDIUM" ? 28 : 22;

            return (
              <button
                key={opp.id}
                type="button"
                onClick={() => onSelectOpportunity(opp)}
                onMouseEnter={() => setHoveredOpp(opp)}
                onMouseLeave={() => setHoveredOpp(null)}
                style={{
                  left: `${x}%`,
                  bottom: `${y}%`,
                  width: `${sizePx}px`,
                  height: `${sizePx}px`,
                }}
                className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shadow-lg transition-all duration-200 cursor-pointer focus:outline-none ${bubbleColor} ${
                  isHovered
                    ? "scale-125 ring-4 ring-primary/40 z-30"
                    : "hover:scale-110 z-10 opacity-90 hover:opacity-100"
                }`}
                title={opp.title}
              >
                {opp.researchScore}
              </button>
            );
          })}
        </div>

        {/* Hover Opportunity Inspector Drawer / Card */}
        {hoveredOpp && (
          <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                  {hoveredOpp.industry}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {hoveredOpp.status}
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground">
                  Score: <strong className="text-foreground">{hoveredOpp.researchScore}/100</strong>
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Crowdedness:{" "}
                  <strong className="text-foreground">
                    {hoveredOpp.marketCrowdedness || "MEDIUM"} ({hoveredOpp.marketCrowdednessScore ?? 50}/100)
                  </strong>
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                {hoveredOpp.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {hoveredOpp.problem}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectOpportunity(hoveredOpp)}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow"
              >
                <span>Inspect Intelligence</span>
                <ExternalLink className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
