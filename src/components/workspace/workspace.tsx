"use client";

import type { DeepPartial } from "ai";
import type { User } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import type { IdeaReport } from "@/lib/schemas/idea-report";
import type { ForgeThread } from "@/lib/workspace/types";
import { createClient } from "@/lib/supabase/client";
import {
  localProvider,
  createSupabaseProvider,
  type StorageProvider,
} from "@/lib/storage";
import Image from "next/image";
import { SignInDialog } from "@/components/auth/sign-in-sheet";
import { IdeaStudio } from "@/components/workspace/idea-studio";
import { ReportPanel } from "@/components/workspace/report-panel";
import { FounderProfileOnboarding } from "@/components/onboarding/founder-profile-onboarding";
import { SettingsPanel } from "@/components/workspace/settings-panel";
import {
  loadFounderProfile,
  saveFounderProfile,
  type FounderProfile,
} from "@/lib/profile/founder-profile";
import {
  loadSavedIdeas,
  saveIdea,
  unsaveIdea,
  type SavedIdea,
} from "@/lib/saved-ideas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  List,
  Loader2,
  MessageSquare,
  Plus,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  KeyRound,
  Inbox,
  Bookmark,
  CheckSquare,
  History,
  Cpu,
  Sliders,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OpportunityRadar } from "@/components/radar/opportunity-radar";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { IntegrationsHub } from "@/components/integrations/integrations-hub";
import { ResearchConfigModal } from "@/components/radar/research-config-modal";
import { CreditsBadge } from "@/components/credits/credits-badge";
import { BuyCreditsModal } from "@/components/credits/buy-credits-modal";
import { useCredits } from "@/components/credits/use-credits";
import { SignupGateModal } from "@/components/auth/signup-gate-modal";
import { useFingerprint } from "@/hooks/use-fingerprint";
import { useAnonCredits } from "@/hooks/use-anon-credits";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function newBlankThread(): ForgeThread {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  return {
    id,
    title: "Untitled session",
    updatedAt: Date.now(),
    topic: "",
    founderProfile: "",
    pastedSignals: "",
    favorite: false,
    report: null,
  };
}


export function Workspace() {
  const [activeAppTab, setActiveAppTab] = useState<"radar" | "copilot" | "studio" | "integrations">("radar");
  const [radarNavTab, setRadarNavTab] = useState<string>("radar");
  const [aiModelsOpen, setAiModelsOpen] = useState(false);
  const [threads, setThreads] = useState<ForgeThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [liveReport, setLiveReport] = useState<DeepPartial<IdeaReport> | undefined>();
  const [analyzing, setAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeMessages, setActiveMessages] = useState<UIMessage[]>([]);
  const [messagesReady, setMessagesReady] = useState(false);
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [signupGateOpen, setSignupGateOpen] = useState(false);
  const { credits: authCredits, loading: authCreditsLoading, refresh: refreshAuthCredits } = useCredits();
  const fingerprint = useFingerprint();
  const { credits: anonCredits, loading: anonCreditsLoading, refresh: refreshAnonCredits } = useAnonCredits(
    authChecked && !user ? fingerprint : null,
  );
  const credits = user ? authCredits : anonCredits;
  const creditsLoading = user ? authCreditsLoading : anonCreditsLoading;
  const refreshCredits = user ? refreshAuthCredits : refreshAnonCredits;
  // Stable ref to supabase client for use inside saved-idea callbacks.
  const supabaseRef = useRef<ReturnType<typeof createClient>>(null);

  // providerRef for stable use inside callbacks; provider state for reactive prop passing
  const providerRef = useRef<StorageProvider>(localProvider);
  const [provider, setProvider] = useState<StorageProvider>(localProvider);
  // Track which user ID we've already wired up so INITIAL_SESSION + SIGNED_IN
  // don't both trigger a full provider switch and thread reload.
  const authedUserIdRef = useRef<string | null>(null);
  // When non-null, the messages effect skips its Supabase load and immediately
  // marks ready - used when messages are pre-loaded before an activeId change.
  const preloadedForRef = useRef<string | null>(null);
  // Mirror of threads state accessible inside callbacks without adding it to deps.
  const threadsRef = useRef<ForgeThread[]>([]);
  useEffect(() => { threadsRef.current = threads; }, [threads]);

  function switchProvider(p: StorageProvider) {
    providerRef.current = p;
    setProvider(p);
  }

  // ── Auth: single source of truth, no localStorage fallback ──────────────────
  // We wait for auth to resolve before showing anything. Once confirmed, all
  // reads/writes go exclusively to Supabase - localStorage is never used.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setAuthChecked(true); return; }
    supabaseRef.current = supabase;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const nextUser = session?.user ?? null;

        if (!nextUser) {
          setUser(null);
          setAuthChecked(true);
          authedUserIdRef.current = null;
          return;
        }

        setUser(nextUser);
        setAuthChecked(true);

        // INITIAL_SESSION + SIGNED_IN both fire on mount - only wire up once.
        if (authedUserIdRef.current === nextUser.id) return;
        authedUserIdRef.current = nextUser.id;

        const sbProvider = createSupabaseProvider(supabase, nextUser.id);
        switchProvider(sbProvider);

        // Load founder profile - show onboarding if not set yet.
        loadFounderProfile(supabase, nextUser.id)
          .then((p) => {
            if (p) { setFounderProfile(p); }
            else { setShowOnboarding(true); }
          })
          .catch(() => { /* DB unreachable - skip onboarding silently */ });

        // Load saved ideas in the background.
        loadSavedIdeas(supabase, nextUser.id)
          .then(setSavedIdeas)
          .catch(() => { /* non-fatal */ });

        // Show a blank thread immediately so the UI is never blocked waiting
        // for a Supabase round-trip. We'll replace it once threads load.
        const placeholder = newBlankThread();
        preloadedForRef.current = placeholder.id;
        setActiveMessages([]);
        setThreads([placeholder]);
        setActiveId(placeholder.id);

        // Load real threads from Supabase in the background.
        sbProvider.loadThreads()
          .then((loaded) => {
            if (loaded.length > 0) {
              const sorted = [...loaded].sort((a, b) => b.updatedAt - a.updatedAt);
              setThreads(sorted);
              setActiveId(sorted[0].id);
              setLiveReport(sorted[0].report ?? undefined);
            } else {
              // No existing threads - persist the placeholder we already showed.
              void sbProvider.upsertThread(placeholder);
            }
          })
          .catch(() => {
            // Supabase unreachable - keep the placeholder; it will be saved
            // to Supabase on the user's first patchThread call.
            void sbProvider.upsertThread(placeholder);
          });
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Initialize local threads for anonymous visitors ────────────────────────
  const anonInitRef = useRef(false);
  useEffect(() => {
    if (!authChecked || user || anonInitRef.current) return;
    anonInitRef.current = true;

    localProvider.loadThreads().then((loaded) => {
      if (loaded.length > 0) {
        const sorted = [...loaded].sort((a, b) => b.updatedAt - a.updatedAt);
        setThreads(sorted);
        setActiveId(sorted[0].id);
        setLiveReport(sorted[0].report ?? undefined);
      } else {
        const blank = newBlankThread();
        void localProvider.upsertThread(blank);
        preloadedForRef.current = blank.id;
        setActiveMessages([]);
        setThreads([blank]);
        setActiveId(blank.id);
      }
    });
  }, [authChecked, user]);

  // ── Load messages when active thread or provider changes ──────────────────
  useEffect(() => {
    if (!activeId) return;

    // Messages were pre-loaded by a thread switch (delete / select / create).
    // Skip the Supabase round-trip and mark ready immediately.
    if (preloadedForRef.current === activeId) {
      preloadedForRef.current = null;
      setMessagesReady(true);
      return;
    }

    let cancelled = false;
    setMessagesReady(false);

    // Safety valve: unblock after 4 s if Supabase stalls.
    const timeout = setTimeout(() => {
      if (!cancelled) { setActiveMessages([]); setMessagesReady(true); }
    }, 4000);

    providerRef.current.loadMessages(activeId)
      .then((stored) => {
        clearTimeout(timeout);
        if (cancelled) return;
        setActiveMessages(
          stored.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
          })),
        );
        setMessagesReady(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        if (!cancelled) { setActiveMessages([]); setMessagesReady(true); }
      });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [activeId, provider]); // provider dep ensures reload when auth resolves

  // ── Persist patch to storage ───────────────────────────────────────────────
  const patchThread = useCallback((id: string, patch: Partial<ForgeThread>) => {
    let toSave: ForgeThread | undefined;
    setThreads((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...patch, updatedAt: Date.now() };
        toSave = updated;
        return updated;
      });
      return next;
    });
    if (toSave) void providerRef.current.upsertThread(toSave);
  }, []);

  const deleteThread = useCallback((id: string) => {
    void providerRef.current.deleteThread(id);

    if (activeId !== id) {
      setThreads((prev) => prev.filter((t) => t.id !== id));
      return;
    }

    // Deleting the active thread - identify the fallback now, then preload its
    // messages before switching so the UI never shows a spinner.
    const next = threadsRef.current.filter((t) => t.id !== id);
    const fallback = next[0] ?? null;

    if (!fallback) {
      const blank = newBlankThread();
      void providerRef.current.upsertThread(blank);
      preloadedForRef.current = blank.id;
      setActiveMessages([]);
      setActiveId(blank.id);
      setLiveReport(undefined);
      setThreads([blank]);
      return;
    }

    // Keep the current thread visible while we preload the fallback's messages.
    // Once loaded, update everything in a single batch → no spinner, instant switch.
    providerRef.current.loadMessages(fallback.id)
      .then((stored) => {
        preloadedForRef.current = fallback.id;
        setActiveMessages(stored.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        })));
        setLiveReport(fallback.report ?? undefined);
        setActiveId(fallback.id);
        setThreads(next);
      })
      .catch(() => {
        setActiveId(fallback.id);
        setLiveReport(fallback.report ?? undefined);
        setThreads(next);
      });
  }, [activeId]);

  const createThread = useCallback(() => {
    const t = newBlankThread();
    void providerRef.current.upsertThread(t);
    // New thread has no messages - preload empty so the effect skips Supabase.
    preloadedForRef.current = t.id;
    setActiveMessages([]);
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setLiveReport(undefined);
    setMobileSidebarOpen(false);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, favorite: !t.favorite, updatedAt: Date.now() } : t,
      );
      const updated = next.find((t) => t.id === id);
      if (updated) void providerRef.current.upsertThread(updated);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        e.preventDefault();
        createThread();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createThread]);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q),
    );
  }, [threads, query]);

  const selectThread = useCallback(
    (id: string) => {
      if (id === activeId) return;
      const t = threadsRef.current.find((x) => x.id === id);
      if (!t) return;
      setActiveId(id);
      setLiveReport(t.report ?? undefined);
    },
    [activeId],
  );

  const stableLiveReport = useCallback(
    (r: DeepPartial<IdeaReport> | undefined) => setLiveReport(r),
    [],
  );

  const stableAnalyzing = useCallback((v: boolean) => setAnalyzing(v), []);

  const handleSaveIdea = useCallback(async (idea: Omit<SavedIdea, "id" | "savedAt">) => {
    const supabase = supabaseRef.current;
    const uid = authedUserIdRef.current;
    if (!supabase || !uid) return;
    const saved = await saveIdea(supabase, uid, idea);
    if (saved) setSavedIdeas((prev) => [saved, ...prev]);
  }, []);

  const handleUnsaveIdea = useCallback(async (ideaId: string) => {
    const supabase = supabaseRef.current;
    const uid = authedUserIdRef.current;
    if (!supabase || !uid) return;
    await unsaveIdea(supabase, uid, ideaId);
    setSavedIdeas((prev) => prev.filter((s) => s.id !== ideaId));
  }, []);

  // Full-screen spinner while we wait for Supabase auth to resolve
  if (!authChecked) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="noise-overlay subtle-grid relative flex h-[100dvh] flex-col bg-background text-foreground">
      {showOnboarding && user && (
        <FounderProfileOnboarding
          onComplete={(profile) => {
            setFounderProfile(profile);
            setShowOnboarding(false);
            const supabase = createClient();
            if (supabase) void saveFounderProfile(supabase, user.id, profile);
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/brand/mark/mark-white.png" alt="FounderHQ" width={56} height={56} className="shrink-0" />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold tracking-tight">SaaS Opportunity Radar</p>
            <p className="truncate text-xs text-muted-foreground">FounderHQ Intelligence</p>
          </div>
        </div>

        {/* Global Navigation Switcher */}
        <nav className="flex items-center rounded-lg border border-border/70 bg-card/60 p-1 gap-0.5 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("radar");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "radar"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="size-3.5" />
            <span>Radar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("discover");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "discover"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox className="size-3.5" />
            <span>Discover</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("deep-research");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "deep-research"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Deep Research</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("copilot");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "copilot"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="size-3.5" />
            <span>AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("saved");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "saved"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="size-3.5" />
            <span>Saved</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("shortlist");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "shortlist"
                ? "bg-emerald-500 text-white shadow-sm font-bold"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <CheckSquare className="size-3.5" />
            <span>Shortlist</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAppTab("radar");
              setRadarNavTab("research-history");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeAppTab === "radar" && radarNavTab === "research-history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="size-3.5" />
            <span>Research History</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Local-First (SQLite)
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-border/80 bg-background/80 px-2.5 h-8 text-xs font-medium hover:bg-muted gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="size-4" />
              <span className="hidden md:inline">Settings</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem onClick={() => setActiveAppTab("integrations")}>
                <KeyRound className="size-3.5 mr-2 text-primary" />
                Integrations Hub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAiModelsOpen(true)}>
                <Cpu className="size-3.5 mr-2 text-purple-400" />
                AI Models & Engine
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Sliders className="size-3.5 mr-2 text-muted-foreground" />
                System Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && <SignInDialog user={user} />}
        </div>
      </header>

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user || ({ email: "local@saas-radar.internal" } as any)}
        founderProfile={founderProfile}
        onProfileUpdate={setFounderProfile}
        onOpenIntegrations={() => setActiveAppTab("integrations")}
      />

      {/* Mobile sessions sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="flex h-full w-72 flex-col gap-0 border-r p-0">
          <SheetHeader className="border-b border-border/70 px-4 py-3 text-left">
            <div className="flex items-center gap-2 pr-6">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => { createThread(); setMobileSidebarOpen(false); }}
                aria-label="New session"
              >
                <Plus className="size-4" />
              </Button>
              <SheetTitle className="text-sm font-semibold">Sessions</SheetTitle>
            </div>
          </SheetHeader>
          <div className="border-b border-border/70 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 border-border/70 bg-background/60 pl-8 text-xs"
              />
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-0.5 p-2">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { selectThread(t.id); setMobileSidebarOpen(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { selectThread(t.id); setMobileSidebarOpen(false); } }}
                  className={`group flex cursor-pointer items-start gap-1 rounded-lg border px-2 py-2 text-left transition-all duration-150 hover:bg-muted/55 ${
                    t.id === activeId ? "border-primary/40 bg-primary/10" : "border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <FileText className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs font-medium">{t.title}</span>
                    </div>
                    {t.topic ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.topic}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className={`opacity-30 hover:opacity-100 ${t.favorite ? "!opacity-100 text-amber-400" : ""}`}
                      aria-label={t.favorite ? "Unfavorite" : "Favorite"}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                    >
                      <Star className="size-3" fill={t.favorite ? "currentColor" : "none"} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-30 hover:opacity-100 hover:text-destructive"
                      aria-label="Delete session"
                      onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 flex-1">
        {activeAppTab === "radar" ? (
          <OpportunityRadar
            activeNavTab={radarNavTab}
            onOpenIntegrations={() => setActiveAppTab("integrations")}
            onSendToValidate={(topic) => {
              const newThread = newBlankThread();
              newThread.topic = topic;
              newThread.title = topic.slice(0, 40);
              setThreads((prev) => [newThread, ...prev]);
              setActiveId(newThread.id);
              setActiveAppTab("studio");
            }}
          />
        ) : activeAppTab === "copilot" ? (
          <div className="flex-1 overflow-hidden p-4">
            <CopilotChat />
          </div>
        ) : activeAppTab === "integrations" ? (
          <div className="flex-1 overflow-hidden">
            <IntegrationsHub />
          </div>
        ) : (
          <>
            {/* Sidebar - desktop only, authenticated users only */}
            {user && (
              <aside
                className={`hidden shrink-0 flex-col border-r border-border/70 bg-card transition-[width] duration-200 md:flex ${
                  sidebarOpen ? "w-[240px]" : "w-12"
                } overflow-hidden`}
              >
                <div
                  className={`flex shrink-0 border-b border-border/70 ${
                    sidebarOpen
                      ? "flex-row items-center gap-1 px-2 py-2"
                      : "flex-col items-center gap-1 py-2"
                  }`}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={createThread}
                    aria-label="New session"
                  >
                    <Plus className="size-4" />
                  </Button>
                  {sidebarOpen && (
                    <p className="ml-1 truncate text-xs font-semibold text-muted-foreground">
                      Sessions
                    </p>
                  )}
                </div>

                {!sidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="flex flex-1 cursor-pointer items-center justify-center"
                    aria-label="Open sessions sidebar"
                  >
                    <span className="select-none text-xs font-semibold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                      Sessions
                    </span>
                  </button>
                )}

                {sidebarOpen && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground leading-relaxed">
                      Your saved idea sessions. Each one stores the full report and chat history.
                    </p>
                    <div className="border-b border-border/70 p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search..."
                          className="h-8 border-border/70 bg-background/60 pl-8 text-xs"
                        />
                      </div>
                    </div>
                    <ScrollArea className="min-h-0 flex-1">
                      <div className="flex flex-col gap-0.5 p-2">
                        {filtered.map((t) => (
                          <div
                            key={t.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => selectThread(t.id)}
                            onKeyDown={(e) => e.key === "Enter" && selectThread(t.id)}
                            className={`group flex cursor-pointer items-start gap-1 rounded-lg border px-2 py-2 text-left transition-all duration-150 hover:bg-muted/55 ${
                              t.id === activeId
                                ? "border-primary/40 bg-primary/10"
                                : "border-transparent"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <FileText className="size-3 shrink-0 text-muted-foreground" />
                                <span className="truncate text-xs font-medium">{t.title}</span>
                              </div>
                              {t.topic ? (
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {t.topic}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className={`opacity-30 hover:opacity-100 ${
                                  t.favorite ? "!opacity-100 text-amber-400" : ""
                                }`}
                                aria-label={t.favorite ? "Unfavorite" : "Favorite"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(t.id);
                                }}
                              >
                                <Star
                                  className="size-3"
                                  fill={t.favorite ? "currentColor" : "none"}
                                />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="opacity-30 hover:opacity-100 hover:text-destructive"
                                aria-label="Delete session"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteThread(t.id);
                                }}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </aside>
            )}

            {/* Main content */}
            {active && messagesReady ? (
              <IdeaStudio
                key={active.id}
                thread={active}
                onPatch={(p) => patchThread(active.id, p)}
                onLiveReport={stableLiveReport}
                onAnalyzingChange={stableAnalyzing}
                storage={provider}
                initialMessages={activeMessages}
                onNewThread={createThread}
                founderProfile={founderProfile}
                onOpenSettings={() => setSettingsOpen(true)}
                onBuyCredits={user ? () => setBuyCreditsOpen(true) : undefined}
                onSignUp={() => setSignupGateOpen(true)}
                onRefreshCredits={refreshCredits}
                savedIdeas={savedIdeas}
                onSaveIdea={handleSaveIdea}
                onUnsaveIdea={handleUnsaveIdea}
                isAnonymous={!user}
                fingerprint={fingerprint}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
      <ResearchConfigModal
        open={aiModelsOpen}
        onOpenChange={setAiModelsOpen}
      />
    </div>
  );
}
