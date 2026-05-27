"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type DeepPartial,
  type UIMessage,
} from "ai";
import { ideaReportSchema, type IdeaReport } from "@/lib/schemas/idea-report";
import { ideaDiscoverySchema, type DiscoveryIdea, type IdeaDiscovery } from "@/lib/schemas/idea-discovery";
import { z } from "zod";
import { founderProfileToText, type FounderProfile } from "@/lib/profile/founder-profile";
import type { BlueprintResult, ForgeThread } from "@/lib/workspace/types";
import { ReportPanel } from "@/components/workspace/report-panel";
import { FinisherBlueprint, GoalSelector } from "@/components/workspace/finisher-blueprint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Lightbulb,
  Loader2,
  MessageSquare,
  Rocket,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Square,
  Target,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { CREDIT_COSTS } from "@/lib/stripe-config";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { StorageProvider, StoredMessage } from "@/lib/storage";
import type { SavedIdea } from "@/lib/saved-ideas";

function isCreditError(e: Error | undefined | null): boolean {
  if (!e) return false;
  const msg = e.message?.toLowerCase() ?? "";
  return msg.includes("insufficient credits") || msg.includes("402") || msg.includes("not enough credits");
}

function isAnonLimitError(e: Error | undefined | null): boolean {
  if (!e) return false;
  return (e.message?.toLowerCase() ?? "").includes("sign up to continue");
}

function CreditCost({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
      <Zap className="size-3" />
      {cost} credits
    </span>
  );
}

function textFromMessage(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

type Mode = "create" | "validate" | "finish";

const MESSAGE_SAVE_CAP = 60;
const MESSAGE_CAP = 20;
const CREATE_CAP = 6;

const CHAT_META: Record<Mode, { title: string; description: string; placeholder: string; emptyState: string }> = {
  create: {
    title: "Brainstorm with FounderHQ",
    description: "Tell me about your skills, interests, or a market you want to explore. I'll help you find startup ideas worth pursuing.",
    placeholder: "e.g. I know poker and AI. What SaaS could I build? Or: I want problems worth solving in healthcare…",
    emptyState: "Tell me about your background, skills, or what markets excite you. I'll help surface startup ideas tailored to you.",
  },
  validate: {
    title: "Ask FounderHQ",
    description: "Ask questions about the report, challenge assumptions, or think through your first steps.",
    placeholder: "Ask about the report, validation steps, how to start…",
    emptyState: "Got a question about the report? Want to dig into a specific signal, challenge an assumption, or think through how to actually start? Ask anything.",
  },
  finish: {
    title: "Blueprint Chat",
    description: "Ask follow-up questions about the blueprint, request specific changes, or go deeper on any section.",
    placeholder: "e.g. Can you expand the wedge strategy? Or: Suggest a tighter MVP scope.",
    emptyState: "The blueprint is your starting point. Use the chat to adjust any section, go deeper on a specific decision, or explore alternatives.",
  },
};

const CHAT_DEFAULT_WIDTHS: Record<Mode, number> = {
  create: 360,
  validate: 360,
  finish: 340,
};

export function IdeaStudio({
  thread,
  onPatch,
  onLiveReport,
  onAnalyzingChange,
  storage,
  initialMessages,
  onNewThread,
  founderProfile,
  onOpenSettings,
  onBuyCredits,
  onSignUp,
  onRefreshCredits,
  savedIdeas = [],
  onSaveIdea,
  onUnsaveIdea,
  isAnonymous = false,
  fingerprint = null,
}: {
  thread: ForgeThread;
  onPatch: (patch: Partial<ForgeThread>) => void;
  onLiveReport: (r: DeepPartial<IdeaReport> | undefined) => void;
  onAnalyzingChange?: (busy: boolean) => void;
  storage: StorageProvider;
  initialMessages?: UIMessage[];
  onNewThread?: () => void;
  founderProfile?: FounderProfile | null;
  onOpenSettings?: (open?: boolean) => void;
  onBuyCredits?: () => void;
  onSignUp?: () => void;
  onRefreshCredits?: () => void;
  savedIdeas?: SavedIdea[];
  onSaveIdea?: (idea: Omit<SavedIdea, "id" | "savedAt">) => void;
  onUnsaveIdea?: (id: string) => void;
  isAnonymous?: boolean;
  fingerprint?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("create");
  const [mobileTab, setMobileTab] = useState<"main" | "chat">("main");
  const modeRef = useRef<Mode>("create");
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [viewingSavedIdea, setViewingSavedIdea] = useState<SavedIdea | null>(null);

  const [selectedDiscoveryIdea, setSelectedDiscoveryIdea] = useState<DiscoveryIdea | null>(null);

  const [topic, setTopic] = useState(thread.topic);
  const [founder, setFounder] = useState(thread.founderProfile);
  const [niche, setNiche] = useState("");
  const [planGoal, setPlanGoal] = useState<string>(thread.blueprintResult?.planGoal ?? "");
  const [refineInput, setRefineInput] = useState("");
  const [formCollapsed, setFormCollapsed] = useState(!!thread.report);
  const [finishDismissedValidated, setFinishDismissedValidated] = useState(false);
  const [finishCustomTopic, setFinishCustomTopic] = useState("");
  const [chatWidth, setChatWidth] = useState(360);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setChatWidth(CHAT_DEFAULT_WIDTHS[mode]);
    if (mode !== "create") setSelectedDiscoveryIdea(null);
    if (mode === "finish") {
      setFinishDismissedValidated(false);
      setFinishCustomTopic("");
    }
  }, [mode]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: chatWidth };
    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const delta = dragState.current.startX - ev.clientX;
      setChatWidth(Math.min(900, Math.max(160, dragState.current.startWidth + delta)));
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [chatWidth]);

  const reportSnapshotRef = useRef<{ value: unknown }>({
    value: thread.report ?? null,
  });

  const [transport] = useState(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages, body }) => ({
          body: {
            ...body,
            messages,
            get chatMode() { return modeRef.current; },
            get reportSnapshot() { return reportSnapshotRef.current.value; },
          },
        }),
      }),
  );

  const { messages, sendMessage, status, stop } = useChat<UIMessage>({
    id: thread.id,
    transport,
    messages: initialMessages ?? [],
  });

  const threadRef = useRef(thread);
  useEffect(() => { threadRef.current = thread; });

  const chatBusyRef = useRef(false);
  useEffect(() => {
    const busy = status === "streaming" || status === "submitted";
    if (chatBusyRef.current && !busy && messages.length > 0) {
      const toStore: StoredMessage[] = messages
        .slice(-MESSAGE_SAVE_CAP)
        .map((m, i) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: textFromMessage(m),
          createdAt: Date.now() + i,
        }));
      const t = threadRef.current;
      void storage.upsertThread(t).then(() =>
        storage.saveMessages(t.id, toStore)
      );
    }
    chatBusyRef.current = busy;
  }, [status, messages, storage, thread.id]);

  const {
    object: report,
    submit: submitAnalyze,
    isLoading: analyzing,
    error: analyzeError,
    clear: clearAnalyze,
    stop: stopAnalyze,
  } = useObject({
    api: "/api/analyze",
    schema: ideaReportSchema,
    initialValue: thread.report ?? undefined,
    onFinish: ({ object: finished }: { object: IdeaReport | undefined; error: unknown }) => {
      onRefreshCredits?.();
      if (finished) {
        onPatch({
          report: finished,
          title: finished.title.slice(0, 96),
          topic: topic.trim(),
          founderProfile: founder.trim(),
          updatedAt: Date.now(),
        });
      }
    },
    onError: (err: Error) => {
      if (isAnonLimitError(err)) onSignUp?.();
      else if (isCreditError(err)) onBuyCredits?.();
    },
  });

  const {
    object: discovery,
    submit: submitDiscover,
    isLoading: discovering,
    error: discoverError,
    clear: clearDiscover,
    stop: stopDiscover,
  } = useObject({
    api: "/api/discover",
    schema: ideaDiscoverySchema,
    initialValue: thread.discoveryResult ?? undefined,
    onFinish: ({ object: finished }: { object: IdeaDiscovery | undefined; error: unknown }) => {
      onRefreshCredits?.();
      if (finished) {
        onPatch({ discoveryResult: finished, updatedAt: Date.now() });
      }
    },
    onError: (err: Error) => {
      if (isAnonLimitError(err)) onSignUp?.();
      else if (isCreditError(err)) onBuyCredits?.();
    },
  });

  const {
    object: blueprint,
    submit: submitFinisher,
    isLoading: generating,
    clear: clearBlueprint,
  } = useObject({
    api: "/api/finish",
    schema: z.record(z.string(), z.unknown()),
    initialValue: thread.blueprintResult?.data ?? undefined,
    onFinish: ({ object: finished }: { object: Record<string, unknown> | undefined; error: unknown }) => {
      onRefreshCredits?.();
      if (finished) {
        onPatch({
          blueprintResult: { planGoal, data: finished } satisfies BlueprintResult,
          updatedAt: Date.now(),
        });
      }
    },
    onError: (err: Error) => {
      if (isAnonLimitError(err)) onSignUp?.();
      else if (isCreditError(err)) onBuyCredits?.();
    },
  });

  useEffect(() => {
    reportSnapshotRef.current.value = {
      topic: topic.trim(),
      founderProfile: founderProfile ? founderProfileToText(founderProfile) : founder.trim(),
      report: report ?? thread.report ?? null,
      blueprint: blueprint ?? null,
      selectedDiscoveryIdea: selectedDiscoveryIdea ?? null,
    };
  }, [report, thread.report, topic, founder, founderProfile, blueprint, selectedDiscoveryIdea]);

  useEffect(() => {
    onLiveReport(report);
  }, [report, onLiveReport]);

  useEffect(() => {
    onAnalyzingChange?.(analyzing);
  }, [analyzing, onAnalyzingChange]);

  useEffect(() => {
    if (report?.title) setFormCollapsed(true);
  }, [report?.title]);

  const runAnalyze = useCallback(() => {
    const t = topic.trim();
    if (!t) return;
    const profileText = founderProfile ? founderProfileToText(founderProfile) : founder.trim();
    onPatch({ topic: t, founderProfile: profileText, updatedAt: Date.now() });
    clearAnalyze();
    submitAnalyze({ topic: t, founderProfile: profileText, ...(fingerprint ? { anonFp: fingerprint } : {}) });
  }, [topic, founder, founderProfile, fingerprint, submitAnalyze, clearAnalyze, onPatch]);

  const runDiscover = useCallback(() => {
    clearDiscover();
    submitDiscover({
      niche: niche.trim(),
      founderProfileText: founderProfile ? founderProfileToText(founderProfile) : undefined,
      ...(fingerprint ? { anonFp: fingerprint } : {}),
    });
  }, [niche, founderProfile, fingerprint, submitDiscover, clearDiscover]);

  const activeReport = report ?? (thread.report ? thread.report : undefined);

  const runFinisher = useCallback(() => {
    if (isAnonymous) { onSignUp?.(); return; }
    if (!planGoal) return;
    const validatedReport = report ?? thread.report;
    const useValidated = !!validatedReport && !finishDismissedValidated;
    const t = useValidated
      ? (topic.trim() || thread.topic || (validatedReport as { title?: string })?.title || "").trim()
      : finishCustomTopic.trim();
    if (!t) return;
    const profileText = founderProfile ? founderProfileToText(founderProfile) : founder.trim();
    clearBlueprint();
    submitFinisher({
      topic: t,
      founderProfile: profileText || undefined,
      report: useValidated ? (thread.report ?? undefined) : undefined,
      planGoal: planGoal || undefined,
    });
  }, [isAnonymous, onSignUp, topic, founder, founderProfile, thread, report, finishDismissedValidated, finishCustomTopic, planGoal, submitFinisher, clearBlueprint]);

  const validateIdea = useCallback((idea: DiscoveryIdea) => {
    setMode("validate");
    setFormCollapsed(false);
    setTopic(`${idea.title}: ${idea.oneLiner}`);
  }, []);

  const resetSession = useCallback(() => {
    setTopic("");
    setFounder("");
    setNiche("");
    setFormCollapsed(false);
    clearAnalyze();
    onPatch({ report: null, title: "Untitled session", topic: "", founderProfile: "", updatedAt: Date.now() });
  }, [clearAnalyze, onPatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const target = e.target as HTMLElement | null;
        if (target?.closest("[data-founderhq-topic]")) {
          e.preventDefault();
          runAnalyze();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runAnalyze]);

  const chatBusy = status === "streaming" || status === "submitted";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const effectiveCap = mode === "create" ? CREATE_CAP : MESSAGE_CAP;
  const atCap = userMessageCount >= effectiveCap;
  const chatMeta = CHAT_META[mode];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Mobile tab bar */}
      <div className="flex shrink-0 border-b border-border/70 bg-background md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("main")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${mobileTab === "main" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
        >
          Workspace
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${mobileTab === "chat" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
        >
          Chat
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: form + results */}
        <div className={`min-h-0 flex-1 flex-col overflow-x-hidden ${mobileTab === "chat" ? "hidden md:flex" : "flex"}`}>

        {/* Top panel: mode toggle + mode-specific form */}
        <div className="glass-panel shrink-0 border-b border-border/70 px-3 py-3 sm:px-5">

          {/* Mode toggle - always visible */}
          <div className="mb-3 flex w-full gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-fit">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex flex-1 flex-col items-center justify-center gap-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                mode === "create"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" />Discover</span>
              <span className={`text-xs font-normal leading-none mt-0.5 ${mode === "create" ? "text-muted-foreground" : "text-muted-foreground/60"}`}>find ideas</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("validate")}
              className={`flex flex-1 flex-col items-center justify-center gap-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                mode === "validate"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5"><Target className="size-3.5" />Validate</span>
              <span className={`text-xs font-normal leading-none mt-0.5 ${mode === "validate" ? "text-muted-foreground" : "text-muted-foreground/60"}`}>check demand</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeReport) {
                  setMode("finish");
                } else {
                  setShowFinishConfirm(true);
                }
              }}
              className={`flex flex-1 flex-col items-center justify-center gap-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                mode === "finish"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5"><Rocket className="size-3.5" />Launch Plan</span>
              <span className={`text-xs font-normal leading-none mt-0.5 ${mode === "finish" ? "text-muted-foreground" : "text-muted-foreground/60"}`}>build blueprint</span>
            </button>
          </div>

          {/* Confirmation dialog - shown when entering Finisher without a validated idea */}
          <Dialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
            <DialogContent showCloseButton={false} className="max-w-sm">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <TriangleAlert className="size-4 text-amber-400 shrink-0" />
                  <DialogTitle>No validated idea yet</DialogTitle>
                </div>
                <DialogDescription>
                  Launch Plan builds your full startup blueprint. Without validation, it has no real market evidence to work from - the blueprint will be based on assumptions rather than real Reddit, HN, and GitHub signals.
                  <br /><br />
                  We strongly recommend running a validation first. It only takes a minute.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setShowFinishConfirm(false);
                    setMode("finish");
                  }}
                >
                  Continue anyway
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setShowFinishConfirm(false);
                    setMode("validate");
                  }}
                >
                  <Target className="size-3.5" />
                  Validate first
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CREATE mode form */}
          {mode === "create" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Brainstorm with the chat on the right, or generate a full idea grid below. Your saved founder profile is used automatically.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="niche">Anything to add? (optional)</Label>
                <Textarea
                  id="niche"
                  rows={2}
                  className="min-h-[64px] resize-none border-border/70 bg-background/65 text-sm"
                  placeholder="Overrides your profile if there's a conflict. e.g. focus on crypto even though it's not in my profile, solo-buildable only, under $500 to launch, ignore my profile and explore healthcare..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={runDiscover}
                  disabled={discovering}
                  className="gap-2 shadow-md shadow-primary/20"
                >
                  {discovering ? <Loader2 className="size-4 animate-spin" /> : <Lightbulb className="size-4" />}
                  {discovering ? "Finding ideas…" : "Generate ideas"}
                </Button>
                <CreditCost cost={CREDIT_COSTS.discover} />
                {discovering && (
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => stopDiscover()}>
                    <Square className="size-3.5" />
                    Stop
                  </Button>
                )}
              </div>
              {discoverError && !isCreditError(discoverError) && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{discoverError.message}</span>
                </div>
              )}

              {/* Saved ideas */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSavedOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="size-3 text-muted-foreground/70" />
                    <span className="text-xs text-muted-foreground">Saved ideas</span>
                    {savedIdeas.length > 0 && (
                      <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-xs text-muted-foreground">
                        {savedIdeas.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`size-3 text-muted-foreground/50 transition-transform ${savedOpen ? "rotate-180" : ""}`} />
                </button>
                {savedOpen && (
                  <div className="border-t border-border/50 max-h-44 overflow-y-auto divide-y divide-border/30">
                    {savedIdeas.length === 0 ? (
                      <p className="px-3 py-2.5 text-xs text-muted-foreground italic">No saved ideas yet. Bookmark cards below to save them here.</p>
                    ) : (
                      savedIdeas.map((idea) => (
                        <div key={idea.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/10 transition-colors">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setViewingSavedIdea(idea)}
                          >
                            <p className="truncate text-xs text-foreground/80 hover:text-foreground transition-colors">{idea.title}</p>
                          </button>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              type="button" size="sm" variant="ghost"
                              className="h-6 px-2 text-xs text-muted-foreground gap-1 hover:text-foreground"
                              onClick={() => validateIdea({ title: idea.title, oneLiner: idea.oneLiner ?? "", whyYou: idea.whyYou ?? "", whyNow: idea.whyNow ?? "", monetizationPath: idea.monetizationPath ?? "", targetAudience: "", coreWedge: "", firstValidationStep: "", founderFitScore: { skillMatch: 0, distributionAdvantage: 0, executionSpeed: 0, monetizationFit: 0 }, opportunityScore: 0, tags: idea.tags ?? [] })}
                            >
                              Validate
                              <ArrowRight className="size-3" />
                            </Button>
                            <button
                              type="button"
                              onClick={() => onUnsaveIdea?.(idea.id)}
                              className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                              aria-label="Remove"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved idea detail dialog */}
          <Dialog open={!!viewingSavedIdea} onOpenChange={(o) => { if (!o) setViewingSavedIdea(null); }}>
            <DialogContent className="max-w-sm" showCloseButton>
              {viewingSavedIdea && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-sm leading-snug">{viewingSavedIdea.title}</DialogTitle>
                    {viewingSavedIdea.oneLiner && (
                      <DialogDescription>{viewingSavedIdea.oneLiner}</DialogDescription>
                    )}
                  </DialogHeader>
                  <div className="space-y-3 text-xs">
                    {viewingSavedIdea.whyYou && (
                      <p className="text-foreground/75 leading-relaxed">
                        <span className="text-muted-foreground">Why you: </span>{viewingSavedIdea.whyYou}
                      </p>
                    )}
                    {viewingSavedIdea.whyNow && (
                      <p className="text-foreground/75 leading-relaxed">
                        <span className="text-muted-foreground">Why now: </span>{viewingSavedIdea.whyNow}
                      </p>
                    )}
                    {viewingSavedIdea.monetizationPath && (
                      <p className="rounded-md bg-muted/30 px-2 py-1.5 text-muted-foreground">
                        💰 {viewingSavedIdea.monetizationPath}
                      </p>
                    )}
                    {(viewingSavedIdea.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {viewingSavedIdea.tags!.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button" size="sm" variant="outline"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => {
                        onUnsaveIdea?.(viewingSavedIdea.id);
                        setViewingSavedIdea(null);
                      }}
                    >
                      <X className="size-3.5" />
                      Remove
                    </Button>
                    <Button
                      type="button" size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        validateIdea({ title: viewingSavedIdea.title, oneLiner: viewingSavedIdea.oneLiner ?? "", whyYou: viewingSavedIdea.whyYou ?? "", whyNow: viewingSavedIdea.whyNow ?? "", monetizationPath: viewingSavedIdea.monetizationPath ?? "", targetAudience: "", coreWedge: "", firstValidationStep: "", founderFitScore: { skillMatch: 0, distributionAdvantage: 0, executionSpeed: 0, monetizationFit: 0 }, opportunityScore: 0, tags: viewingSavedIdea.tags ?? [] });
                        setViewingSavedIdea(null);
                      }}
                    >
                      Validate
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* VALIDATE mode form */}
          {mode === "validate" && (
            formCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{topic || "Untitled"}</p>
                  {founderProfile?.goal?.length ? (
                    <p className="truncate text-xs text-muted-foreground">
                      Goal: {founderProfile.goal.join(", ")}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button" size="sm" variant="ghost"
                  className="shrink-0 gap-1.5 text-xs text-muted-foreground"
                  onClick={() => setFormCollapsed(false)}
                >
                  <ChevronDown className="size-3.5" />
                  Edit
                </Button>
                <Button
                  type="button" size="sm" variant="ghost"
                  className="shrink-0 gap-1.5 text-xs text-muted-foreground"
                  onClick={resetSession}
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button" size="sm"
                    disabled={analyzing || !topic.trim()}
                    onClick={runAnalyze}
                    className="gap-1.5"
                  >
                    {analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Re-run
                  </Button>
                  <CreditCost cost={CREDIT_COSTS.validate} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="topic">Problem space / idea</Label>
                  <Input
                    id="topic"
                    data-founderhq-topic
                    placeholder='e.g. "An app that helps small restaurant owners manage reservations without paying for expensive software"'
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                {founderProfile?.goal?.length ? (
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground leading-snug">
                        Score calibrated to your <span className="font-medium text-foreground">goal</span> and <span className="font-medium text-foreground">profile</span>.
                      </p>
                      <button
                        type="button"
                        className="shrink-0 text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        onClick={() => onOpenSettings?.(true)}
                      >
                        Change in settings
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {founderProfile.goal.map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs font-medium">{g}</Badge>
                      ))}
                      {founderProfile.role?.length > 0 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-border/60">{founderProfile.role.join(", ")}</Badge>
                      )}
                      {founderProfile.technicalLevel && (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-border/60">{founderProfile.technicalLevel}</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Score is based on general startup viability.{" "}
                      <button
                        type="button"
                        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        onClick={() => onOpenSettings?.(true)}
                      >
                        Set your goal and profile in settings
                      </button>{" "}
                      for a score tailored to what you are building.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={runAnalyze}
                    disabled={analyzing || !topic.trim()}
                    className="gap-2 shadow-md shadow-primary/20"
                  >
                    {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {analyzing ? "Analyzing…" : "Run analysis"}
                  </Button>
                  <CreditCost cost={CREDIT_COSTS.validate} />
                  {analyzing && (
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => stopAnalyze()}>
                      <Square className="size-3.5" />
                      Stop
                    </Button>
                  )}
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={resetSession}
                  >
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                </div>
                {analyzeError && !isCreditError(analyzeError) && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{analyzeError.message}</span>
                  </div>
                )}
                {(report?.title || thread.report) && (
                  <button
                    type="button"
                    onClick={() => setFormCollapsed(true)}
                    className="mt-1 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronUp className="size-3" />
                    Collapse to see report
                  </button>
                )}
              </div>
            )
          )}

          {/* FINISH mode bar */}
          {mode === "finish" && (
            activeReport && !finishDismissedValidated ? (
              /* Validated idea pre-selected as dismissible chip */
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground shrink-0">Generating plan for:</span>
                  <div className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/[0.08] pl-3 pr-1.5 py-1 min-w-0">
                    <span className="truncate text-xs font-medium text-foreground max-w-[280px]">
                      {activeReport.title || topic}
                    </span>
                    {typeof activeReport.validationQuality?.buildGateScore === "number" && (
                      <span className={`shrink-0 text-xs font-semibold ${
                        activeReport.validationQuality.buildGateScore >= 65 ? "text-emerald-400" :
                        activeReport.validationQuality.buildGateScore >= 40 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {activeReport.validationQuality.buildGateScore}/100
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Use a different idea"
                      onClick={() => setFinishDismissedValidated(true)}
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
                <GoalSelector value={planGoal} onChange={setPlanGoal} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button" size="sm"
                      disabled={generating || !planGoal}
                      onClick={runFinisher}
                      className="gap-1.5 shadow-md shadow-primary/20"
                    >
                      {generating
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Rocket className="size-3.5" />
                      }
                      {generating ? "Generating…" : blueprint ? "Regenerate" : "Generate Blueprint"}
                    </Button>
                    <CreditCost cost={CREDIT_COSTS.finish} />
                    <Button
                      type="button" size="sm" variant="ghost"
                      className="gap-1.5 text-xs text-muted-foreground"
                      onClick={resetSession}
                    >
                      <RotateCcw className="size-3.5" />
                      Reset
                    </Button>
                  </div>
                  {!planGoal && !generating && (
                    <p className="text-xs text-amber-400">Select a goal above to continue.</p>
                  )}
                </div>
              </div>
            ) : (
              /* No validated idea, or user dismissed chip - show manual input */
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="finish-topic">Your idea</Label>
                    {!activeReport && (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        No validation
                      </span>
                    )}
                  </div>
                  <Input
                    id="finish-topic"
                    placeholder='e.g. "A tool that helps restaurant owners manage reservations without expensive software"'
                    value={finishCustomTopic}
                    onChange={(e) => setFinishCustomTopic(e.target.value)}
                    autoFocus
                  />
                </div>
                <GoalSelector value={planGoal} onChange={setPlanGoal} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={generating || !finishCustomTopic.trim() || !planGoal}
                      onClick={runFinisher}
                      className="gap-2 shadow-md shadow-primary/20"
                    >
                      {generating
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Rocket className="size-3.5" />
                      }
                      {generating ? "Generating…" : "Generate Blueprint"}
                    </Button>
                    <CreditCost cost={CREDIT_COSTS.finish} />
                    {!activeReport && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={() => setMode("validate")}
                      >
                        <Target className="size-3.5" />
                        Validate instead
                      </Button>
                    )}
                    {activeReport && finishDismissedValidated && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => {
                          setFinishDismissedValidated(false);
                          setFinishCustomTopic("");
                        }}
                      >
                        <Target className="size-3.5" />
                        Use validated idea
                      </Button>
                    )}
                  </div>
                  {!planGoal && !generating && (
                    <p className="text-xs text-amber-400">Select a goal above to continue.</p>
                  )}
                </div>
              </div>
            )
          )}

        </div>

        {/* Results area */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {mode === "create" ? (
            <DiscoverResults
              data={discovery as DeepPartial<IdeaDiscovery> | undefined}
              streaming={discovering}
              onValidate={validateIdea}
              onSelect={(idea) => setSelectedDiscoveryIdea(idea)}
              selectedTitle={selectedDiscoveryIdea?.title}
              hasProfile={!!founderProfile}
              savedIdeas={savedIdeas}
              onSaveIdea={onSaveIdea}
              onUnsaveIdea={onUnsaveIdea}
            />
          ) : mode === "validate" ? (
            (analyzing && !report?.title) ? <AnalysisLoading /> : <ReportPanel partial={report} streaming={analyzing} onSwitchToFinisher={() => setMode("finish")} />
          ) : (
            <FinisherBlueprint
              blueprint={blueprint}
              generating={generating}
              onGenerate={runFinisher}
              onRegenerate={runFinisher}
              canGenerate={
                !!planGoal && (
                  activeReport && !finishDismissedValidated
                    ? !!(activeReport.title || topic.trim() || thread.topic)
                    : !!finishCustomTopic.trim()
                )
              }
              ideaTitle={
                activeReport && !finishDismissedValidated
                  ? (activeReport.title || topic || thread.topic)
                  : finishCustomTopic
              }
              planGoal={planGoal}
              onGoalChange={setPlanGoal}
            />
          )}
        </div>
      </div>

      {/* Resize handle - desktop only */}
      <div
        onMouseDown={onResizeStart}
        className="group relative hidden w-2 shrink-0 cursor-col-resize items-center justify-center bg-muted transition-colors hover:bg-primary/25 active:bg-primary/40 md:flex"
      >
        <GripVertical className="size-3 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
      </div>

      {/* Right: chat panel */}
      <div
        className={`flex-col min-h-0 glass-panel ${mobileTab === "main" ? "hidden md:flex" : "flex w-full md:w-auto"} md:flex-none md:shrink-0`}
        style={mobileTab !== "chat" ? { width: chatWidth } : undefined}
      >
        <div className="shrink-0 border-b border-border/70 px-4 py-3">
          <p className="text-base font-semibold">{chatMeta.title}</p>
          <p className="text-sm text-muted-foreground">{chatMeta.description}</p>
        </div>

        {/* Selected idea banner - create mode only */}
        {mode === "create" && selectedDiscoveryIdea && (
          <div className="shrink-0 border-b border-border/60 bg-primary/[0.06] px-3 py-2 flex items-start gap-2">
            <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-primary/70" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{selectedDiscoveryIdea.title}</p>
              <p className="text-xs text-muted-foreground">Discussing this idea</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDiscoveryIdea(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              aria-label="Clear selected idea"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mode === "create" && selectedDiscoveryIdea
                  ? `Let's talk about "${selectedDiscoveryIdea.title}". Ask me anything: target user, how to validate it cheaply, first steps, whether it's worth pursuing.`
                  : mode === "validate" && !activeReport
                  ? "Run an analysis above first. Once the demand report is ready, use this chat to dig into specific signals, challenge assumptions, or plan your first moves."
                  : chatMeta.emptyState}
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-6 bg-muted/60 text-foreground"
                    : "mr-6 bg-muted/30 text-foreground"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.role === "user" ? "You" : "FounderHQ"}
                </p>
                <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_p]:mb-2 [&_ul]:my-2 [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:pl-4 [&_li]:my-1 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_strong]:font-semibold">
                  <ReactMarkdown>{textFromMessage(m)}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <form
          className="shrink-0 border-t border-border/70 glass-panel p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const t = refineInput.trim();
            if (!t || chatBusy || atCap) return;
            setRefineInput("");
            await sendMessage({ text: t });
          }}
        >
          {atCap ? (
            mode === "create" ? (
              <div className="py-2 space-y-2 text-center">
                <p className="text-xs font-medium text-foreground">Brainstorm session complete.</p>
                <p className="text-xs text-muted-foreground">You've had enough ideas. Time to pick one and do something with it.</p>
                <div className="flex justify-center gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setMode("validate")}>
                    <Target className="size-3.5" />
                    Validate an idea
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={onNewThread}>
                    New session
                  </Button>
                </div>
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Message limit reached for this session. Start a new thread to continue.
              </p>
            )
          ) : (
            <div className="flex gap-2">
              <Textarea
                rows={4}
                className="min-h-[100px] flex-1 resize-y border-border/60 bg-background/50 text-sm"
                placeholder={
                  mode === "create" && selectedDiscoveryIdea
                    ? "Ask about this idea: target user, how to validate cheaply, first steps, whether to pursue it…"
                    : chatMeta.placeholder
                }
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  type="submit"
                  disabled={chatBusy || !refineInput.trim()}
                  size="icon"
                  className="size-10"
                >
                  {chatBusy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-4" />
                  )}
                </Button>
                {chatBusy && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10"
                    onClick={() => void stop()}
                  >
                    <Square className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
          {!atCap && (
            <p className="mt-1.5 text-right text-xs text-muted-foreground/70">
              {effectiveCap - userMessageCount} messages remaining
            </p>
          )}
        </form>
      </div>

      </div>
    </div>
  );
}

const ANALYSIS_STEPS = [
  "Fetching Reddit signals…",
  "Searching Hacker News…",
  "Scanning GitHub issues…",
  "Clustering pain points…",
  "Scoring market opportunity…",
  "Building your report…",
];

function AnalysisLoading() {
  const [progress, setProgress] = useState(2);
  const [stepIdx, setStepIdx] = useState(0);
  const steps = ANALYSIS_STEPS;

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + (92 - p) * 0.04;
      });
    }, 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8">
      <div className="w-full max-w-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{steps[stepIdx]}</span>
          <span className="tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Sourcing from Reddit · HN · GitHub · Stack Overflow
        </p>
      </div>
    </div>
  );
}

function FitDot({ score }: { score?: number }) {
  const v = score ?? 0;
  const color = v >= 8 ? "bg-emerald-500" : v >= 6 ? "bg-amber-500" : "bg-red-500/70";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-foreground font-medium">
      <span className={`inline-block size-2 rounded-full ${color}`} />
      {v}
    </span>
  );
}

function DiscoverResults({
  data,
  streaming,
  onValidate,
  onSelect,
  selectedTitle,
  hasProfile,
  savedIdeas = [],
  onSaveIdea,
  onUnsaveIdea,
}: {
  data: DeepPartial<IdeaDiscovery> | undefined;
  streaming: boolean;
  onValidate: (idea: DiscoveryIdea) => void;
  onSelect: (idea: DiscoveryIdea) => void;
  selectedTitle?: string;
  hasProfile: boolean;
  savedIdeas?: SavedIdea[];
  onSaveIdea?: (idea: Omit<SavedIdea, "id" | "savedAt">) => void;
  onUnsaveIdea?: (id: string) => void;
}) {
  const zones = data?.opportunityZones ?? [];
  const summary = data?.founderSummary;

  const savedById = useMemo(() => {
    const map = new Map<string, string>();
    savedIdeas.forEach((s) => map.set(s.title, s.id));
    return map;
  }, [savedIdeas]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pb-12 space-y-5">

        {/* Founder profile summary */}
        {summary && (summary.role || (summary.skills?.length ?? 0) > 0) && (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your profile
            </p>
            <div className="flex flex-wrap gap-1.5">
              {summary.role && (
                <span className="rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-xs text-foreground/80">
                  {summary.role}
                </span>
              )}
              {summary.skills?.map((s, i) => s && (
                <span key={i} className="rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-xs text-foreground/80">
                  {s}
                </span>
              ))}
              {summary.communities?.map((s, i) => s && (
                <span key={i} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary/80">
                  {s}
                </span>
              ))}
            </div>
            {summary.keyAdvantages && summary.keyAdvantages.length > 0 && (
              <ul className="space-y-0.5">
                {summary.keyAdvantages.map((a, i) => a && (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-primary/40" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Empty state */}
        {!streaming && zones.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <Sparkles className="size-14 opacity-50 text-primary" />
            <p className="text-2xl font-bold text-foreground">Your Opportunity Map</p>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              {hasProfile
                ? "Describe a niche or market above, then click Generate. We'll map the startup opportunities you're best positioned to execute."
                : "Describe a niche or problem above, or set your Founder Profile. The engine maps opportunities matched to your real distribution advantages."}
            </p>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground/70">
              <span className="rounded-full border border-border/60 px-3 py-1">1 Discover</span>
              <ArrowRight className="size-3.5" />
              <span className="rounded-full border border-border/60 px-3 py-1">2 Validate</span>
              <ArrowRight className="size-3.5" />
              <span className="rounded-full border border-border/60 px-3 py-1">3 Launch Plan</span>
            </div>
          </div>
        )}

        {/* Opportunity zones */}
        {streaming && zones.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Loader2 className="size-4 animate-spin" />
            Mapping your opportunity landscape…
          </div>
        )}

        {zones.map((zone, zi) => zone && (
          <div key={zi} className="space-y-2">
            {/* Zone header */}
            <div className="space-y-0.5 px-1">
              <p className="text-sm font-semibold text-foreground">{zone.zone ?? "…"}</p>
              {zone.zoneRationale && (
                <p className="text-xs text-muted-foreground leading-relaxed">{zone.zoneRationale}</p>
              )}
            </div>

            {/* Ideas in zone */}
            <div className="grid gap-2 sm:grid-cols-2">
              {zone.ideas?.map((idea, ii) => {
                if (!idea) return null;
                const isSelected = !!idea.title && idea.title === selectedTitle;
                const fit = idea.founderFitScore;
                return (
                  <div
                    key={ii}
                    className={`flex flex-col gap-2 rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary/[0.06]"
                        : "border-border/60 bg-background/50"
                    }`}
                  >
                    {/* Title + bookmark */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug flex-1">{idea.title ?? "…"}</p>
                      {idea.title && (
                        <button
                          type="button"
                          aria-label={savedById.has(idea.title) ? "Unsave idea" : "Save idea"}
                          onClick={() => {
                            const savedId = savedById.get(idea.title!);
                            if (savedId) {
                              onUnsaveIdea?.(savedId);
                            } else {
                              onSaveIdea?.({
                                title: idea.title!,
                                oneLiner: idea.oneLiner,
                                whyYou: idea.whyYou,
                                whyNow: idea.whyNow,
                                monetizationPath: idea.monetizationPath,
                                tags: (idea.tags?.filter(Boolean) as string[]) ?? [],
                              });
                            }
                          }}
                          className={`shrink-0 mt-0.5 transition-colors ${
                            savedById.has(idea.title!)
                              ? "text-foreground"
                              : "text-muted-foreground/70 hover:text-foreground"
                          }`}
                        >
                          <Bookmark
                            className="size-3.5"
                            fill={savedById.has(idea.title!) ? "currentColor" : "none"}
                            strokeWidth={savedById.has(idea.title!) ? 1 : 1.75}
                          />
                        </button>
                      )}
                    </div>

                    {idea.oneLiner && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{idea.oneLiner}</p>
                    )}

                    {/* Why you / why now */}
                    {idea.whyYou && (
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        <span className="text-muted-foreground">Why you: </span>{idea.whyYou}
                      </p>
                    )}
                    {idea.whyNow && (
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        <span className="text-muted-foreground">Why now: </span>{idea.whyNow}
                      </p>
                    )}

                    {/* Monetization */}
                    {idea.monetizationPath && (
                      <p className="rounded-md bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                        💰 {idea.monetizationPath}
                      </p>
                    )}

                    {/* Founder fit scores */}
                    {fit && (fit.skillMatch || fit.distributionAdvantage || fit.executionSpeed || fit.monetizationFit) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border/30 pt-2">
                        <span className="text-xs text-muted-foreground w-full font-medium">Founder fit</span>
                        <FitDot score={fit.skillMatch} />
                        <span className="text-xs text-muted-foreground/70">skill match</span>
                        <FitDot score={fit.distributionAdvantage} />
                        <span className="text-xs text-muted-foreground/70">distribution</span>
                        <FitDot score={fit.executionSpeed} />
                        <span className="text-xs text-muted-foreground/70">exec speed</span>
                        <FitDot score={fit.monetizationFit} />
                        <span className="text-xs text-muted-foreground/70">monetization</span>
                      </div>
                    )}

                    {/* Tags */}
                    {(idea.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {idea.tags!.map((tag, j) => tag && (
                          <Badge key={j} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {idea.title && idea.oneLiner && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <Button
                          type="button" size="sm"
                          variant={isSelected ? "default" : "ghost"}
                          className="gap-1.5 text-xs h-7"
                          onClick={() => onSelect(idea as DiscoveryIdea)}
                        >
                          <MessageSquare className="size-3" />
                          {isSelected ? "Discussing" : "Discuss"}
                        </Button>
                        <Button
                          type="button" size="sm" variant="outline"
                          className="gap-1.5 text-xs h-7"
                          onClick={() => onValidate(idea as DiscoveryIdea)}
                        >
                          Validate
                          <ArrowRight className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    </ScrollArea>
  );
}
