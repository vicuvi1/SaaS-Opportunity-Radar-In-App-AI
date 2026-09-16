"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Cpu,
  Flame,
  GitBranch as Github,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
  XCircle,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import type {
  ClientIntegrationCard,
  ConnectionStatus,
  IntegrationCategory,
} from "@/lib/integrations/types";
import { ConnectionWizardDialog } from "./connection-wizard-dialog";
import { OpenRouterModelManager } from "./openrouter-model-manager";

export function IntegrationsHub() {
  const [integrations, setIntegrations] = useState<ClientIntegrationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeIntegrationForWizard, setActiveIntegrationForWizard] =
    useState<ClientIntegrationCard | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const iconMap: Record<string, any> = {
    openrouter: Cpu,
    reddit: MessageCircle,
    github: Github,
    producthunt: Flame,
    telegram: Send,
    hackernews: Terminal,
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickTest(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/integrations/${id}/test`, { method: "POST" });
      if (res.ok) {
        await loadIntegrations();
      }
    } catch (err) {
      console.error("Quick test failed:", err);
    } finally {
      setTestingId(null);
    }
  }

  const filteredIntegrations =
    selectedCategory === "all"
      ? integrations
      : integrations.filter((i) => i.category === selectedCategory);

  const connectedCount = integrations.filter((i) => i.status === "CONNECTED").length;

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="size-3" />
            CONNECTED
          </span>
        );
      case "CONNECTING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400 animate-pulse">
            <Loader2 className="size-3 animate-spin" />
            CONNECTING
          </span>
        );
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[11px] font-semibold text-red-400">
            <XCircle className="size-3" />
            ERROR
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
            <AlertCircle className="size-3" />
            EXPIRED
          </span>
        );
      case "NOT_CONNECTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            NOT CONNECTED
          </span>
        );
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground overflow-y-auto p-6 space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Integrations & Credentials Hub
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="size-3" />
                  AES-256-GCM Vault
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Connect external signal sources, models, and notifications directly from the UI without touching .env.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Status:</span>
            <strong className="font-mono text-emerald-400">
              {connectedCount} of {integrations.length} Active
            </strong>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadIntegrations}
            disabled={loading}
            className="text-xs gap-1.5 border-border/80"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── FILTER TABS ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
        {[
          { id: "all", label: "All Integrations", count: integrations.length },
          { id: "ai", label: "AI Gateways", count: integrations.filter((i) => i.category === "ai").length },
          { id: "signal", label: "Signal Harvesters", count: integrations.filter((i) => i.category === "signal").length },
          { id: "notification", label: "Alert Dispatches", count: integrations.filter((i) => i.category === "notification").length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedCategory === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/60 bg-card/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono text-[10px] opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* ── INTEGRATION CARDS GRID ──────────────────────────────────── */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((item) => {
            const Icon = iconMap[item.id] || Layers;
            const isConnected = item.status === "CONNECTED";
            const isTesting = testingId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-4 transition-all hover:border-border hover:shadow-sm space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl border ${
                          isConnected
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-border/70 bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{item.name}</h3>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Connected details */}
                  <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Account:</span>
                      <span className="font-medium text-foreground truncate max-w-[170px]">
                        {item.accountName || "None"}
                      </span>
                    </div>

                    {item.maskedCredentials && Object.keys(item.maskedCredentials).length > 0 && (
                      <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                        <span>Key Preview:</span>
                        <span className="font-mono text-[10px] text-foreground/80 flex items-center gap-1">
                          <Lock className="size-2.5 text-muted-foreground" />
                          {Object.values(item.maskedCredentials)[0]}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Last Verified:</span>
                      <span className="text-[10px]">
                        {item.lastTestedAt
                          ? new Date(item.lastTestedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </span>
                    </div>

                    {item.errorMessage && (
                      <div className="rounded border border-red-500/30 bg-red-500/10 p-1.5 text-[10px] text-red-400">
                        {item.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Features badges */}
                  <div className="flex flex-wrap gap-1">
                    {item.features.map((feat) => (
                      <span
                        key={feat}
                        className="rounded bg-muted/40 border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isTesting}
                    onClick={() => handleQuickTest(item.id)}
                    className="text-xs gap-1 border-border/80 h-7"
                  >
                    {isTesting ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                    Test
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setActiveIntegrationForWizard(item);
                      setWizardOpen(true);
                    }}
                    className={`text-xs gap-1 h-7 ${
                      isConnected
                        ? "bg-secondary hover:bg-secondary/80 text-foreground border border-border/80"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <SlidersHorizontal className="size-3" />
                    {isConnected ? "Manage" : "Connect"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EMBEDDED OPENROUTER MODEL MANAGER ──────────────────────── */}
      <div className="pt-2">
        <OpenRouterModelManager />
      </div>

      {/* ── WIZARD DIALOG ───────────────────────────────────────────── */}
      <ConnectionWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        integration={activeIntegrationForWizard}
        onSaved={loadIntegrations}
      />
    </div>
  );
}
