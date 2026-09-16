"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Check,
  Cpu,
  DollarSign,
  Layers,
  Loader2,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import type {
  OpenRouterCatalogModel,
  OpenRouterModelRoleConfig,
} from "@/lib/integrations/types";

export function OpenRouterModelManager() {
  const [models, setModels] = useState<OpenRouterCatalogModel[]>([]);
  const [presets, setPresets] = useState<Record<string, OpenRouterModelRoleConfig>>({});
  const [activeConfig, setActiveConfig] = useState<OpenRouterModelRoleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadModelsAndConfig();
  }, []);

  async function loadModelsAndConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/openrouter/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        setPresets(data.presets || {});
        setActiveConfig(data.activeConfig || null);
      }
    } catch (err) {
      console.error("Failed to load model configs:", err);
    } finally {
      setLoading(false);
    }
  }

  function handlePresetSelect(presetKey: "FREE_ONLY" | "FREE_FIRST" | "BALANCED" | "CUSTOM") {
    if (presets[presetKey]) {
      setActiveConfig(presets[presetKey]);
    } else if (presetKey === "CUSTOM" && activeConfig) {
      setActiveConfig({ ...activeConfig, preset: "CUSTOM" });
    }
  }

  function handleRoleChange(roleKey: keyof OpenRouterModelRoleConfig["roles"], modelId: string) {
    if (!activeConfig) return;
    setActiveConfig({
      preset: "CUSTOM",
      roles: {
        ...activeConfig.roles,
        [roleKey]: modelId,
      },
    });
  }

  async function handleSaveConfig() {
    if (!activeConfig) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/integrations/openrouter/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save model roles:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border/70 bg-card/40 p-6">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const roleDefinitions: Array<{
    key: keyof OpenRouterModelRoleConfig["roles"];
    label: string;
    desc: string;
  }> = [
    {
      key: "discovery",
      label: "Discovery Model",
      desc: "Fast, high-throughput extraction of candidate opportunities from signals",
    },
    {
      key: "analysis",
      label: "Deep Analysis Model",
      desc: "Deep reasoning for market dynamics, willingness to pay, and customer personas",
    },
    {
      key: "scoring",
      label: "Scoring Model",
      desc: "Multi-factor objective grading (0-10) and AI Priority classification",
    },
    {
      key: "chat",
      label: "Copilot Chat Model",
      desc: "Conversational pairing partner for refining and interrogating opportunities",
    },
    {
      key: "fallback",
      label: "Resilience Fallback",
      desc: "Automatic failover model invoked when upstream rate limits or outages occur",
    },
  ];

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Cpu className="size-4 text-primary" />
            OpenRouter Multi-Model Routing Engine
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign specialized AI models per workload or choose an optimized preset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadModelsAndConfig}
            className="text-xs gap-1.5 border-border/80"
          >
            <RefreshCw className="size-3" />
            Refresh Catalog
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={handleSaveConfig}
            className="text-xs gap-1.5 bg-primary text-primary-foreground"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : savedSuccess ? (
              <Check className="size-3.5 text-emerald-300" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {savedSuccess ? "Saved!" : "Save Routing Preferences"}
          </Button>
        </div>
      </div>

      {/* Presets Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Architecture Presets
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handlePresetSelect("FREE_ONLY")}
            className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
              activeConfig?.preset === "FREE_ONLY"
                ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/50"
                : "border-border/70 bg-background/60 hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs text-emerald-400">FREE ONLY</span>
              <Zap className="size-3 text-emerald-400" />
            </div>
            <span className="text-[11px] leading-tight text-foreground/80">Zero API cost. 100% free models.</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("FREE_FIRST")}
            className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
              activeConfig?.preset === "FREE_FIRST"
                ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/50"
                : "border-border/70 bg-background/60 hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs text-primary">FREE FIRST</span>
              <DollarSign className="size-3 text-primary" />
            </div>
            <span className="text-[11px] leading-tight text-foreground/80">Free discovery, Claude 3.7 for deep tasks.</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("BALANCED")}
            className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
              activeConfig?.preset === "BALANCED"
                ? "border-purple-500 bg-purple-500/10 text-foreground ring-1 ring-purple-500/50"
                : "border-border/70 bg-background/60 hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs text-purple-400">BALANCED</span>
              <Sparkles className="size-3 text-purple-400" />
            </div>
            <span className="text-[11px] leading-tight text-foreground/80">Gemini 2.0 Flash + Claude 3.7 + GPT-4o.</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("CUSTOM")}
            className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
              activeConfig?.preset === "CUSTOM"
                ? "border-cyan-500 bg-cyan-500/10 text-foreground ring-1 ring-cyan-500/50"
                : "border-border/70 bg-background/60 hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs text-cyan-400">CUSTOM</span>
              <Sliders className="size-3 text-cyan-400" />
            </div>
            <span className="text-[11px] leading-tight text-foreground/80">Fully customized per role assignment.</span>
          </button>
        </div>
      </div>

      {/* Role Model Selectors */}
      <div className="space-y-3 pt-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workload Role Assignments
        </Label>
        <div className="space-y-3">
          {roleDefinitions.map((def) => {
            const currentModelId = activeConfig?.roles[def.key] || "";
            const currentModel = models.find((m) => m.id === currentModelId);

            return (
              <div
                key={def.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/70 bg-background/50 p-3"
              >
                <div className="min-w-0 sm:w-1/2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">{def.label}</span>
                    {currentModel?.isFree && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        FREE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{def.desc}</p>
                </div>

                <div className="sm:w-1/2 min-w-0">
                  <select
                    value={currentModelId}
                    onChange={(e) => handleRoleChange(def.key, e.target.value)}
                    className="w-full rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.isFree ? "(Free)" : `(\$${m.pricing.prompt.toFixed(2)}/1M in)`}
                      </option>
                    ))}
                    {!models.some((m) => m.id === currentModelId) && currentModelId && (
                      <option value={currentModelId}>{currentModelId}</option>
                    )}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
