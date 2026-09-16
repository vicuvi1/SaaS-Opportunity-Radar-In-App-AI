"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  GitBranch as Github,
  Layers,
  Loader2,
  MessageCircle,
  Send,
  SlidersHorizontal,
  Terminal,
  XCircle,
} from "lucide-react";
import type { ClientIntegrationCard } from "@/lib/integrations/types";

interface ResearchPreflightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "quick" | "deep";
  onProceed: (mode: "quick" | "deep") => void;
  onOpenIntegrations: () => void;
}

export function ResearchPreflightDialog({
  open,
  onOpenChange,
  mode,
  onProceed,
  onOpenIntegrations,
}: ResearchPreflightDialogProps) {
  const [integrations, setIntegrations] = useState<ClientIntegrationCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => {
        setIntegrations(data.integrations || []);
      })
      .catch((err) => console.error("Failed to load integrations for preflight:", err))
      .finally(() => setLoading(false));
  }, [open]);

  const sourceIcons: Record<string, any> = {
    openrouter: Cpu,
    reddit: MessageCircle,
    hackernews: Terminal,
    github: Github,
    producthunt: Flame,
    telegram: Send,
  };

  const researchSources = integrations.filter((i) => i.category === "signal" || i.category === "ai");
  const connectedSourcesCount = researchSources.filter((i) => i.status === "CONNECTED").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/80 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="size-4 text-primary" />
            Research Engine Pre-Flight Check
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Verifying connected intelligence feeds for{" "}
            <span className="font-semibold text-foreground uppercase">{mode} research</span>. The
            pipeline will synthesize available live signals into validated SaaS opportunities.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Active Intelligence Feeds:</span>
              <span className="font-mono font-medium text-foreground">
                {connectedSourcesCount} of {researchSources.length} Connected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {researchSources.map((source) => {
                const Icon = sourceIcons[source.id] || Layers;
                const isConnected = source.status === "CONNECTED";

                return (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between rounded-lg border p-2.5 transition-all text-xs ${
                      isConnected
                        ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                        : "border-border/60 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
                          isConnected
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-foreground">{source.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {isConnected
                            ? source.accountName || "Connected"
                            : source.requiresAuth
                            ? "Unconfigured (skipped)"
                            : "Public API"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isConnected ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="size-4 shrink-0 text-amber-400/70" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {connectedSourcesCount === 0 && (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-400">
                ⚠️ No authenticated sources configured. Public fallbacks will be queried where possible.
                For deeper insights, connect OpenRouter, Reddit, or GitHub.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onOpenIntegrations();
            }}
            className="text-xs gap-1.5 border-border/80"
          >
            <SlidersHorizontal className="size-3.5" />
            Manage Integrations
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onProceed(mode);
            }}
            className="text-xs gap-1.5 bg-primary text-primary-foreground"
          >
            Continue with Available Sources
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
