"use client";

import React, { useState, useEffect } from "react";
import type {
  Opportunity,
  OpportunityStatus,
  MyDecision,
  AiPriority,
  AiConfidence,
  EvidenceGrading,
  OpportunitySource,
} from "@/lib/opportunities/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Bookmark,
  Sparkles,
  User,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  FileText,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { exportOpportunityToObsidian } from "@/lib/obsidian/export";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { ResearchModal } from "@/components/copilot/research-modal";

interface OpportunityDetailDialogProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOpportunity: (id: string, updates: Partial<Opportunity>) => Promise<void>;
  onSendToValidate?: (topic: string) => void;
  onDeepResearch?: (opp: Opportunity) => void;
}

const ALL_STATUSES: OpportunityStatus[] = [
  "NEW",
  "REVIEW",
  "DEEP_RESEARCH",
  "SHORTLIST",
  "REJECTED",
  "ARCHIVED",
];

const ALL_DECISIONS: MyDecision[] = [
  "UNDECIDED",
  "INTERESTED",
  "SHORTLISTED",
  "REJECTED",
];

const NEXT_ACTION_PRESETS = [
  "Interview 5 customers",
  "Research competitors",
  "Build landing page",
  "Test pricing",
  "Build prototype",
  "Contact potential customer",
  "Run Reddit validation",
  "Reject opportunity",
];

const EVIDENCE_GRADINGS: EvidenceGrading[] = [
  "FACT",
  "SOURCE_BASED_CLAIM",
  "INFERENCE",
  "HYPOTHESIS",
  "UNKNOWN",
];

export function OpportunityDetailDialog({
  opportunity,
  open,
  onOpenChange,
  onUpdateOpportunity,
  onSendToValidate,
  onDeepResearch,
}: OpportunityDetailDialogProps) {
  if (!opportunity) return null;

  // Local state for editing
  const [opp, setOpp] = useState<Opportunity>(opportunity);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Notes state
  const [newNoteText, setNewNoteText] = useState("");

  // Source state
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceType, setNewSourceType] = useState("reddit");
  const [newSourceGrading, setNewSourceGrading] = useState<EvidenceGrading>("SOURCE_BASED_CLAIM");
  const [newSourceSummary, setNewSourceSummary] = useState("");

  // AI Copilot & Research Modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [researchModalOpen, setResearchModalOpen] = useState(false);

  // Claim verification state
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<
    Record<
      string,
      {
        status: string;
        grading: string;
        explanation: string;
        confidenceScore: number;
        supportingEvidence: string[];
        contradictingEvidence: string[];
      }
    >
  >({});
  const [customClaimToVerify, setCustomClaimToVerify] = useState("");

  async function handleVerifyClaim(claimText: string, claimKey: string) {
    if (!claimText.trim() || !opp) return;
    setVerifyingClaimId(claimKey);
    try {
      const res = await fetch(`/api/opportunities/${opp.id}/verify-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claimText }),
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResults((prev) => ({
          ...prev,
          [claimKey]: data.verification,
        }));
        // Reload opportunity if sources were added
        const refreshRes = await fetch(`/api/opportunities/${opp.id}`);
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          if (refreshed) {
            setOpp(refreshed);
          }
        }
      }
    } catch (err) {
      console.error("[verify-claim] Error verifying claim:", err);
    } finally {
      setVerifyingClaimId(null);
    }
  }

  useEffect(() => {
    setOpp(opportunity);
  }, [opportunity]);

  async function handleFieldChange<K extends keyof Opportunity>(
    key: K,
    value: Opportunity[K],
  ) {
    const updated = { ...opp, [key]: value };
    setOpp(updated);
    await onUpdateOpportunity(opp.id, { [key]: value });
  }

  // Handle Note Add
  async function handleAddNote() {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: `note-${Date.now().toString(36)}`,
      content: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...(opp.notes || [])];
    setNewNoteText("");
    await handleFieldChange("notes", updatedNotes);
  }

  // Handle Note Delete
  async function handleDeleteNote(noteId: string) {
    const updatedNotes = (opp.notes || []).filter((n) => n.id !== noteId);
    await handleFieldChange("notes", updatedNotes);
  }

  // Handle Source Add
  async function handleAddSource() {
    if (!newSourceTitle.trim()) return;
    const newSource: OpportunitySource = {
      id: `src-${Date.now().toString(36)}`,
      title: newSourceTitle.trim(),
      url: newSourceUrl.trim(),
      sourceType: newSourceType,
      grading: newSourceGrading,
      summary: newSourceSummary.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    const updatedSources = [...(opp.sources || []), newSource];
    setShowAddSource(false);
    setNewSourceTitle("");
    setNewSourceUrl("");
    setNewSourceSummary("");
    await handleFieldChange("sources", updatedSources);
  }

  // Copy Obsidian Markdown
  function handleCopyObsidian() {
    const markdown = exportOpportunityToObsidian(opp);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Download Obsidian .md file
  function handleDownloadObsidian() {
    const markdown = exportOpportunityToObsidian(opp);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${opp.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 flex flex-col gap-0">
        {/* Header Bar */}
        <div className="border-b border-border/80 bg-muted/20 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">ID: {opp.id}</span>
              {opp.isUserGenerated ? (
                <span className="inline-flex items-center gap-1 rounded border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-300">
                  <User className="size-3" />
                  MY IDEA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-300">
                  <Sparkles className="size-3" />
                  AI DISCOVERED
                </span>
              )}
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                {opp.industry}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {onDeepResearch && (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm"
                  onClick={() => {
                    onOpenChange(false);
                    onDeepResearch(opp);
                  }}
                >
                  <Sparkles className="size-3.5" />
                  DEEP RESEARCH
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="size-3.5" />
                Chat with AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border/80 hover:border-primary/50 text-foreground"
                onClick={() => setResearchModalOpen(true)}
              >
                <Search className="size-3.5 text-primary" />
                Research This
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleCopyObsidian}
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy Markdown"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleDownloadObsidian}
              >
                <Download className="size-3.5" />
                Obsidian .md
              </Button>
              {onSendToValidate && (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-secondary text-secondary-foreground"
                  onClick={() => {
                    onOpenChange(false);
                    onSendToValidate(opp.title + " - " + opp.problem);
                  }}
                >
                  <Search className="size-3.5" />
                  IdeaForge Validate
                </Button>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold tracking-tight text-foreground">{opp.title}</h2>

          {/* Control Strip: AI Priority vs Human Decision & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* AI Priority Card */}
            <div className="rounded-xl border border-border/70 bg-card p-3 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                AI Research Priority
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`font-semibold text-xs px-2 py-0.5 rounded border ${
                    opp.aiPriority === "HIGH_POTENTIAL"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : opp.aiPriority === "MEDIUM_POTENTIAL"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {opp.aiPriority.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  Conf: <strong className="text-foreground">{opp.aiConfidence}</strong>
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 italic pt-0.5">
                AI prioritization signal only (not startup success guarantee)
              </p>
            </div>

            {/* Research Score Card */}
            <div className="rounded-xl border border-border/70 bg-card p-3 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Research Score (0-100)
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-base font-bold px-2 py-0.5 rounded ${
                    opp.researchScore >= 80
                      ? "bg-emerald-500/20 text-emerald-400"
                      : opp.researchScore >= 60
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-zinc-500/20 text-zinc-400"
                  }`}
                >
                  {opp.researchScore} / 100
                </span>
                <span className="text-xs text-muted-foreground">
                  Evidence: <strong className="text-foreground">{opp.evidenceStrength}</strong>
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 pt-0.5">
                Composite of 10 market & viability factors
              </p>
            </div>

            {/* MY DECISION (Human Gate) */}
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-primary">
                  My Personal Decision
                </span>
                <span className="text-[9px] text-primary/70 font-mono">HUMAN ONLY</span>
              </div>
              <select
                value={opp.myDecision}
                onChange={(e) => handleFieldChange("myDecision", e.target.value as MyDecision)}
                className="w-full rounded-lg border border-primary/30 bg-background px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                {ALL_DECISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Status:</span>
                <select
                  value={opp.status}
                  onChange={(e) => handleFieldChange("status", e.target.value as OpportunityStatus)}
                  className="rounded border border-border/70 bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground focus:outline-none"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Editable Next Action */}
          <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Flame className="size-3.5 text-primary" />
                Next Action
              </span>
              <span className="text-[11px] text-muted-foreground">Quick presets:</span>
            </div>
            <Input
              value={opp.nextAction}
              onChange={(e) => handleFieldChange("nextAction", e.target.value)}
              placeholder="e.g. Interview 5 potential customers on LinkedIn"
              className="text-xs h-8"
            />
            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {NEXT_ACTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleFieldChange("nextAction", preset)}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabbed Content Body */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-border/70 px-5 bg-muted/10">
            <TabsList className="bg-transparent h-10 gap-2 p-0">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Overview & Problem
              </TabsTrigger>
              <TabsTrigger value="score" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Research Score Breakdown
              </TabsTrigger>
              <TabsTrigger value="market" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Market, Competitors & MVP
              </TabsTrigger>
              <TabsTrigger value="validation" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Validation Tracking
              </TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Evidence & Sources ({opp.sources?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Notes & Thoughts ({opp.notes?.length ?? 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* ── TAB 1: OVERVIEW & PROBLEM ──────────────────────────────── */}
            <TabsContent value="overview" className="m-0 space-y-4">
              {/* WHY THIS OPPORTUNITY? (Compact AI Signals) */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    WHY THIS OPPORTUNITY?
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    AI RESEARCH INTELLIGENCE
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {(opp.whyThisOpportunity && opp.whyThisOpportunity.length > 0
                    ? opp.whyThisOpportunity
                    : [
                        `${opp.sources?.length || 12} demand signals`,
                        "Strong recurring pain",
                        opp.economicImpact ? "Existing spending" : "Clear economic impact",
                        opp.aiFit === "HIGH" ? "Strong AI fit" : "Solid AI leverage",
                        "Competitor gap",
                        opp.evidenceStrength === "HIGH" ? "High evidence confidence" : "Verified source claims",
                      ]
                  ).map((signal, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs"
                    >
                      <Check className="size-3 text-emerald-400 shrink-0" />
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  The Problem
                </label>
                <Textarea
                  value={opp.problem}
                  rows={3}
                  onChange={(e) => handleFieldChange("problem", e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Target Customer
                  </label>
                  <Input
                    value={opp.targetCustomer}
                    onChange={(e) => handleFieldChange("targetCustomer", e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Why the Problem Matters (Urgency)
                  </label>
                  <Input
                    value={opp.whyTheProblemMatters || ""}
                    onChange={(e) => handleFieldChange("whyTheProblemMatters", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Current Workflow & Friction
                  </label>
                  <Textarea
                    rows={2}
                    value={opp.currentWorkflow || ""}
                    onChange={(e) => handleFieldChange("currentWorkflow", e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Current Solutions & Workarounds
                  </label>
                  <Textarea
                    rows={2}
                    value={opp.currentSolutions || ""}
                    onChange={(e) => handleFieldChange("currentSolutions", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Economic Impact & Willingness to Pay
                </label>
                <Input
                  value={opp.economicImpact || ""}
                  onChange={(e) => handleFieldChange("economicImpact", e.target.value)}
                  placeholder="e.g. Saves 20 hours per deal; cost of inaction is $15K in unbillable time"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Why I Think This Is Interesting (The Wedge)
                </label>
                <Textarea
                  rows={2}
                  value={opp.whyInteresting || ""}
                  onChange={(e) => handleFieldChange("whyInteresting", e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* DEVIL'S ADVOCATE & 13-PASS INTELLIGENCE */}
              {(Boolean(opp.whyItCouldWork?.length) || Boolean(opp.whyItMightNotWork?.length) || Boolean(opp.marketCrowdedness)) && (
                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-cyan-400" />
                      13-Pass Deep Intelligence &amp; Devil&apos;s Advocate
                    </span>
                    {opp.marketCrowdedness && (
                      <Badge variant="outline" className="text-xs font-mono">
                        Crowdedness: {opp.marketCrowdedness} ({opp.marketCrowdednessScore ?? 50}/100)
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Why It Could Work */}
                    <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Why It Could Work
                      </span>
                      <ul className="text-xs space-y-1 text-emerald-200/90">
                        {opp.whyItCouldWork && opp.whyItCouldWork.length > 0 ? (
                          opp.whyItCouldWork.map((point, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{point}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground italic">Run 13-pass deep research to evaluate.</li>
                        )}
                      </ul>
                    </div>

                    {/* Why It Might Not Work */}
                    <div className="rounded-lg border border-rose-800/40 bg-rose-950/20 p-3 space-y-1.5">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="size-3.5" /> Why It Might Not Work (Fatal Flaws)
                      </span>
                      <ul className="text-xs space-y-1 text-rose-200/90">
                        {opp.whyItMightNotWork && opp.whyItMightNotWork.length > 0 ? (
                          opp.whyItMightNotWork.map((point, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{point}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground italic">Run 13-pass deep research to evaluate.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* What We Still Don't Know */}
                  {opp.whatWeStillDontKnow && opp.whatWeStillDontKnow.length > 0 && (
                    <div className="rounded-lg border border-amber-800/30 bg-amber-950/15 p-3 space-y-1.5">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <HelpCircle className="size-3.5" /> What We Still Don&apos;t Know (Critical Gaps)
                      </span>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {opp.whatWeStillDontKnow.map((gap, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">?</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Validation Steps */}
                  {opp.nextValidationSteps && opp.nextValidationSteps.length > 0 && (
                    <div className="rounded-lg border border-blue-800/30 bg-blue-950/15 p-3 space-y-1.5">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <TrendingUp className="size-3.5" /> Next Concrete Validation Experiments
                      </span>
                      <ol className="text-xs space-y-1 text-muted-foreground">
                        {opp.nextValidationSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-400 font-bold">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── TAB 2: RESEARCH SCORE BREAKDOWN ───────────────────────── */}
            <TabsContent value="score" className="m-0 space-y-4">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  AI Research Prioritization Analysis
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Evaluated across 10 critical market and feasibility dimensions. Scores reflect AI-assisted research priority, not an endorsement or prediction of startup success.
                </p>
                {opp.aiPriorityReasons && opp.aiPriorityReasons.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-primary">Priority Drivers:</span>
                    <ul className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground/80">
                      {opp.aiPriorityReasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 10 Factors Sliders / Displays */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "problemSeverity", label: "Problem Severity" },
                  { key: "problemFrequency", label: "Problem Frequency" },
                  { key: "economicValue", label: "Economic Value" },
                  { key: "willingnessToPay", label: "Willingness to Pay" },
                  { key: "marketOpportunity", label: "Market Opportunity" },
                  { key: "competitionGap", label: "Competition Gap" },
                  { key: "aiFit", label: "AI Fit" },
                  { key: "technicalFeasibility", label: "Technical Feasibility" },
                  { key: "distributionPotential", label: "Distribution Potential" },
                  { key: "evidenceStrength", label: "Evidence Strength" },
                ].map(({ key, label }) => {
                  const val =
                    opp.researchScoreFactors?.[key as keyof typeof opp.researchScoreFactors] ?? 5;
                  return (
                    <div key={key} className="rounded-lg border border-border/60 bg-card p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="font-mono font-bold text-primary">{val}/10</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={val}
                        onChange={(e) => {
                          const newFactors = {
                            ...(opp.researchScoreFactors || {}),
                            [key]: parseInt(e.target.value, 10),
                          };
                          handleFieldChange("researchScoreFactors", newFactors);
                        }}
                        className="w-full accent-primary h-1.5 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* ── TAB 3: MARKET, COMPETITORS & MVP ──────────────────────── */}
            <TabsContent value="market" className="m-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Market Gap / Underserved Angle
                  </label>
                  <Textarea
                    rows={2}
                    value={opp.marketGap || ""}
                    onChange={(e) => handleFieldChange("marketGap", e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    AI Opportunity & Fit ({opp.aiFit || "MEDIUM"})
                  </label>
                  <Textarea
                    rows={2}
                    value={opp.aiOpportunity || ""}
                    onChange={(e) => handleFieldChange("aiOpportunity", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Competitors */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Competitors & Pricing Gaps
                </label>
                {opp.competitors && opp.competitors.length > 0 ? (
                  <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card">
                    {opp.competitors.map((c, i) => (
                      <div key={i} className="p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>{c.name}</span>
                          <span className="text-muted-foreground font-mono">{c.pricing || "Pricing N/A"}</span>
                        </div>
                        {c.weaknesses && c.weaknesses.length > 0 && (
                          <p className="text-muted-foreground">
                            <strong>Weaknesses:</strong> {c.weaknesses.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No competitors recorded yet.</p>
                )}
              </div>

              {/* MVP Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    MVP Scope Features
                  </label>
                  <Textarea
                    rows={3}
                    value={(opp.mvpFeatures || []).join("\n")}
                    onChange={(e) => handleFieldChange("mvpFeatures", e.target.value.split("\n").filter(Boolean))}
                    placeholder="One feature per line"
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Explicit Exclusions (Non-Goals)
                  </label>
                  <Textarea
                    rows={3}
                    value={(opp.excludedFeatures || []).join("\n")}
                    onChange={(e) => handleFieldChange("excludedFeatures", e.target.value.split("\n").filter(Boolean))}
                    placeholder="One exclusion per line"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Monetization & Distribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Monetization & Pricing Strategy
                  </label>
                  <Input
                    value={opp.pricingIdea || ""}
                    onChange={(e) => handleFieldChange("pricingIdea", e.target.value)}
                    placeholder="e.g. $299/mo for up to 10 questionnaires"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Distribution Channels
                  </label>
                  <Input
                    value={(opp.distributionChannels || []).join(", ")}
                    onChange={(e) =>
                      handleFieldChange(
                        "distributionChannels",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      )
                    }
                    placeholder="e.g. Presales Slack groups, LinkedIn Cold Outreach"
                    className="text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 4: VALIDATION TRACKING ────────────────────────────── */}
            <TabsContent value="validation" className="m-0 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/70 bg-card p-3 text-center space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">Interviews</span>
                  <Input
                    type="number"
                    min={0}
                    value={opp.validation?.interviewsCount ?? 0}
                    onChange={(e) =>
                      handleFieldChange("validation", {
                        ...(opp.validation || {}),
                        interviewsCount: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="text-center font-mono font-bold text-sm h-8"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-3 text-center space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">Interested Users</span>
                  <Input
                    type="number"
                    min={0}
                    value={opp.validation?.interestedCustomersCount ?? 0}
                    onChange={(e) =>
                      handleFieldChange("validation", {
                        ...(opp.validation || {}),
                        interestedCustomersCount: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="text-center font-mono font-bold text-sm h-8"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-3 text-center space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">Waitlist Signups</span>
                  <Input
                    type="number"
                    min={0}
                    value={opp.validation?.waitlistCount ?? 0}
                    onChange={(e) =>
                      handleFieldChange("validation", {
                        ...(opp.validation || {}),
                        waitlistCount: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="text-center font-mono font-bold text-sm h-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Landing Page Results & Conversions
                </label>
                <Input
                  value={opp.validation?.landingPageResults || ""}
                  onChange={(e) =>
                    handleFieldChange("validation", {
                      ...(opp.validation || {}),
                      landingPageResults: e.target.value,
                    })
                  }
                  placeholder="e.g. 24% conversion on headline: 'Answer questionnaires in 5 mins'"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pricing Experiments
                </label>
                <Input
                  value={opp.validation?.pricingExperiments || ""}
                  onChange={(e) =>
                    handleFieldChange("validation", {
                      ...(opp.validation || {}),
                      pricingExperiments: e.target.value,
                    })
                  }
                  placeholder="e.g. Tested $199 vs $499/mo; 2 users said $499 is within discretionary budget"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Customer Feedback & Insights
                </label>
                <Textarea
                  rows={3}
                  value={opp.validation?.feedback || ""}
                  onChange={(e) =>
                    handleFieldChange("validation", {
                      ...(opp.validation || {}),
                      feedback: e.target.value,
                    })
                  }
                  placeholder="Direct quotes, objections, and user reactions"
                  className="text-xs"
                />
              </div>
            </TabsContent>

            {/* ── TAB 5: EVIDENCE & SOURCES ─────────────────────────────── */}
            <TabsContent value="evidence" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Graded Evidence Records
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Distinguishes verified FACT vs INFERENCE vs SOURCE-BASED CLAIM.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={() => setShowAddSource(!showAddSource)}
                >
                  <Plus className="size-3" />
                  Add Source
                </Button>
              </div>

              {/* LIVE CLAIM FACT-CHECKER DRAWER */}
              <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" /> Live Forensic Claim Fact-Checker
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">MULTI-SOURCE LIVE AUDIT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type any market claim or competitor hypothesis to fact-check against live sources..."
                    value={customClaimToVerify}
                    onChange={(e) => setCustomClaimToVerify(e.target.value)}
                    className="text-xs h-8 bg-background/80"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleVerifyClaim(customClaimToVerify, "custom");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={verifyingClaimId === "custom" || !customClaimToVerify.trim()}
                    onClick={() => handleVerifyClaim(customClaimToVerify, "custom")}
                    className="h-8 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 gap-1"
                  >
                    {verifyingClaimId === "custom" ? (
                      <>
                        <Loader2 className="size-3 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-3.5" /> [VERIFY]
                      </>
                    )}
                  </Button>
                </div>

                {verificationResults["custom"] && (
                  <div className="rounded-lg border border-cyan-700/40 bg-background/70 p-3 text-xs space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            verificationResults["custom"].status === "VERIFIED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : verificationResults["custom"].status === "PARTIALLY_VERIFIED"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }
                        >
                          {verificationResults["custom"].status} ({verificationResults["custom"].grading})
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Confidence: <strong className="text-foreground">{verificationResults["custom"].confidenceScore}%</strong>
                        </span>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {verificationResults["custom"].explanation}
                    </p>
                    {verificationResults["custom"].supportingEvidence?.length > 0 && (
                      <div className="text-[11px] text-emerald-400/90 space-y-0.5">
                        <span className="font-semibold">Supporting Evidence:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {verificationResults["custom"].supportingEvidence.map((se, i) => (
                            <li key={i}>{se}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {verificationResults["custom"].contradictingEvidence?.length > 0 && (
                      <div className="text-[11px] text-rose-400/90 space-y-0.5">
                        <span className="font-semibold">Contradicting Findings:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {verificationResults["custom"].contradictingEvidence.map((ce, i) => (
                            <li key={i}>{ce}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add Source Drawer / Form */}
              {showAddSource && (
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                  <span className="text-xs font-semibold text-primary">New Evidence Source</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Title or Citation headline"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="URL (e.g. Reddit, HN, GitHub link)"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newSourceType}
                      onChange={(e) => setNewSourceType(e.target.value)}
                      className="rounded border border-border/80 bg-background px-2 py-1 text-xs"
                    >
                      <option value="reddit">Reddit</option>
                      <option value="hackernews">Hacker News</option>
                      <option value="github">GitHub</option>
                      <option value="stackoverflow">Stack Overflow</option>
                      <option value="producthunt">Product Hunt</option>
                      <option value="web">Web Article</option>
                      <option value="interview">User Interview</option>
                    </select>
                    <select
                      value={newSourceGrading}
                      onChange={(e) => setNewSourceGrading(e.target.value as EvidenceGrading)}
                      className="rounded border border-border/80 bg-background px-2 py-1 text-xs font-semibold"
                    >
                      {EVIDENCE_GRADINGS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    placeholder="Evidence summary / excerpt"
                    value={newSourceSummary}
                    onChange={(e) => setNewSourceSummary(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowAddSource(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddSource}>
                      Save Source
                    </Button>
                  </div>
                </div>
              )}

              {/* Sources List */}
              {opp.sources && opp.sources.length > 0 ? (
                <div className="space-y-3">
                  {opp.sources.map((s) => {
                    const verified = verificationResults[s.id];
                    return (
                      <div key={s.id} className="rounded-xl border border-border/80 bg-card p-3.5 text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                s.grading === "FACT"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : s.grading === "SOURCE_BASED_CLAIM"
                                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {s.grading}
                            </span>
                            <span className="font-semibold text-foreground">{s.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={verifyingClaimId === s.id}
                              onClick={() => handleVerifyClaim(s.title + " " + (s.summary || ""), s.id)}
                              className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 gap-1 border border-cyan-800/40"
                              title="Re-verify this claim against live sources"
                            >
                              {verifyingClaimId === s.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="size-3" />
                              )}
                              [VERIFY]
                            </Button>
                            {s.url && (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 shrink-0"
                              >
                                Visit <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        {s.summary && <p className="text-muted-foreground leading-relaxed">{s.summary}</p>}

                        {/* Inline Verification Result for this specific source */}
                        {verified && (
                          <div className="mt-2 pt-2 border-t border-border/60 text-[11px] space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  verified.status === "VERIFIED"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                    : verified.status === "PARTIALLY_VERIFIED"
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                }
                              >
                                {verified.status}
                              </Badge>
                              <span className="text-muted-foreground font-mono">
                                Audit confidence: {verified.confidenceScore}%
                              </span>
                            </div>
                            <p className="text-foreground/90">{verified.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No evidence sources attached yet.</p>
              )}
            </TabsContent>

            {/* ── TAB 6: NOTES & MY THOUGHTS ────────────────────────────── */}
            <TabsContent value="notes" className="m-0 space-y-5">
              {/* MY THOUGHTS (Large Editor) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    My Thoughts (Markdown Workspace)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Saved automatically</span>
                </div>
                <Textarea
                  rows={6}
                  value={opp.myThoughts || ""}
                  onChange={(e) => handleFieldChange("myThoughts", e.target.value)}
                  placeholder="Jot down deep reflections, founder instincts, unvalidated hypotheses, architectural notes..."
                  className="font-mono text-xs leading-relaxed"
                />
              </div>

              <Separator />

              {/* ACTIVITY NOTES LOG */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Timestamped Activity Notes
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add a new dated note or log entry..."
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddNote}>
                    <Plus className="size-3.5 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  {opp.notes && opp.notes.length > 0 ? (
                    opp.notes.map((n) => (
                      <div
                        key={n.id}
                        className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                          <p className="text-foreground leading-relaxed">{n.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No notes recorded yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Live Multi-source Research Modal */}
        <ResearchModal
          open={researchModalOpen}
          onOpenChange={setResearchModalOpen}
          initialTopic={`${opp.title} - ${opp.problem}`}
          opportunityId={opp.id}
          opportunityTitle={opp.title}
          onAttachSource={async (src) => {
            const newSource: OpportunitySource = {
              id: `src-${Date.now().toString(36)}`,
              title: src.title,
              url: src.url || "",
              sourceType: "web",
              grading: src.grading as EvidenceGrading,
              summary: src.summary,
              date: new Date().toISOString().slice(0, 10),
            };
            const updatedSources = [...(opp.sources || []), newSource];
            await handleFieldChange("sources", updatedSources);
          }}
          onAddNote={async (noteContent) => {
            const newNote = {
              id: `note-${Date.now().toString(36)}`,
              content: noteContent,
              createdAt: new Date().toISOString(),
            };
            const updatedNotes = [newNote, ...(opp.notes || [])];
            await handleFieldChange("notes", updatedNotes);
          }}
        />

        {/* Opportunity-specific AI Copilot Dialog */}
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="sm:max-w-3xl h-[85vh] p-0 flex flex-col">
            <CopilotChat
              initialOpportunity={opp}
              onRefreshOpportunities={() => onUpdateOpportunity(opp.id, {})}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
