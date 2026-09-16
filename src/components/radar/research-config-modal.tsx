"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  Copy,
  Terminal,
  AlertCircle,
} from "lucide-react";

interface ResearchConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunStarted?: () => void;
  onRunCompleted?: () => void;
}

const DOMAIN_PRESETS = [
  "B2B SaaS",
  "DevOps & Cloud Infrastructure",
  "Developer Tools & APIs",
  "AI Workflow Automation",
  "Internal Operations & Backoffice",
  "Sales & CRM Tools",
  "Custom",
];

export function ResearchConfigModal({
  open,
  onOpenChange,
  onRunStarted,
  onRunCompleted,
}: ResearchConfigModalProps) {
  // Discovery parameters
  const [selectedPreset, setSelectedPreset] = useState("B2B SaaS");
  const [customField, setCustomField] = useState("");
  const [depth, setDepth] = useState<"quick" | "deep">("quick");
  const [targetIdeaCount, setTargetIdeaCount] = useState(10);
  const [qualityThreshold, setQualityThreshold] = useState(60);
  const [runningNow, setRunningNow] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);

  // Schedule parameters
  const [scheduleTime, setScheduleTime] = useState("18:00");
  const [timezone, setTimezone] = useState("Europe/Chisinau");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Auto-detect local timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      // Fallback
    }
  }, []);

  const handleRunDiscoveryNow = async () => {
    setRunningNow(true);
    setRunResult(null);
    if (onRunStarted) onRunStarted();

    try {
      const field = selectedPreset === "Custom" ? customField : selectedPreset;
      const res = await fetch("/api/research/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          customField: selectedPreset === "Custom" ? customField : undefined,
          depth,
          targetIdeaCount,
          minQualityThreshold: qualityThreshold,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Run failed");
      }

      setRunResult(data);
      if (onRunCompleted) onRunCompleted();
    } catch (err) {
      console.error("Discovery run failed:", err);
      alert(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunningNow(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const field = selectedPreset === "Custom" ? customField : selectedPreset;
      const res = await fetch("/api/research/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Daily ${field} Discovery`,
          field,
          customField: selectedPreset === "Custom" ? customField : undefined,
          depth,
          targetIdeaCount,
          minQualityThreshold: qualityThreshold,
          scheduleTime,
          timezone,
          frequency,
          enabled: scheduleEnabled,
        }),
      });

      if (res.ok) {
        setScheduleSaved(true);
        setTimeout(() => setScheduleSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setSavingSchedule(false);
    }
  };

  const windowsCmd = `schtasks /create /tn "SaaSOpportunityRadarDaily" /tr "npm --prefix \\"${process.cwd()}\\" run launch" /sc daily /st ${scheduleTime}`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(windowsCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-xl">Discovery & Scheduler Configuration</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
                Configure your opportunity search parameters, depth, quality thresholds, and daily automated scan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="run-now" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-muted/20">
            <TabsList className="bg-transparent h-12 gap-4">
              <TabsTrigger value="run-now" className="data-[state=active]:bg-muted gap-2">
                <Zap className="w-3.5 h-3.5" />
                Run Discovery Now
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-muted gap-2">
                <Clock className="w-3.5 h-3.5" />
                Daily Recurring Schedule
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <TabsContent value="run-now" className="m-0 space-y-5">
              {/* Field / Domain */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Domain / Niche
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {DOMAIN_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={selectedPreset === preset ? "default" : "outline"}
                      size="sm"
                      className="justify-start text-xs h-9"
                      onClick={() => setSelectedPreset(preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
                {selectedPreset === "Custom" && (
                  <Input
                    placeholder="e.g. Legal document workflows, Shopify inventory sync"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    className="mt-2 text-sm"
                  />
                )}
              </div>

              {/* Depth & Target Count */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Research Depth
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={depth === "quick" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setDepth("quick")}
                    >
                      Quick (Fast)
                    </Button>
                    <Button
                      type="button"
                      variant={depth === "deep" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setDepth("deep")}
                    >
                      Deep (Thorough)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Target Idea Count
                    </Label>
                    <span className="text-xs font-bold text-violet-400">{targetIdeaCount} ideas</span>
                  </div>
                  <input
                    type="range"
                    value={targetIdeaCount}
                    min={3}
                    max={20}
                    step={1}
                    onChange={(e) => setTargetIdeaCount(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Quality Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Minimum Quality Threshold
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {qualityThreshold} / 100
                  </Badge>
                </div>
                <input
                  type="range"
                  value={qualityThreshold}
                  min={40}
                  max={85}
                  step={5}
                  onChange={(e) => setQualityThreshold(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Strict quality gate: if {targetIdeaCount} ideas are requested but only 7 qualify above {qualityThreshold}, exactly 7 are returned. Zero filler ideas.
                </p>
              </div>

              {runResult && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Discovery Run Complete!
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Found {runResult.stats.qualifiedCount} qualified opportunities (checked {runResult.stats.signalsFound} signals) and staged them into your <strong>Daily Research Inbox</strong>.
                  </p>
                </div>
              )}

              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 mt-4"
                disabled={runningNow}
                onClick={handleRunDiscoveryNow}
              >
                <Sparkles className="w-4 h-4" />
                {runningNow ? "Scanning Signals & Synthesizing..." : "Start Discovery Run Now"}
              </Button>
            </TabsContent>

            <TabsContent value="schedule" className="m-0 space-y-5">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <div className="font-medium text-sm">Automated Scan Active</div>
                  <div className="text-xs text-muted-foreground">
                    Run recurring opportunity discovery in the background
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="size-4 rounded border-border accent-primary cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Run Time
                  </Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Timezone
                  </Label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="e.g. Europe/Chisinau"
                  />
                </div>
              </div>

              {/* PC Off Behavior Explanation */}
              <div className="p-4 border rounded-xl bg-muted/20 space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                  PC-Off Behavior & Standby Catch-up
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  If your computer is off at {scheduleTime}, the built-in scheduler will immediately detect the missed scan and run a catch-up execution the moment you open the app.
                </p>
                <div className="pt-2">
                  <div className="text-[11px] text-muted-foreground mb-1">
                    Optional: Register with Windows Task Scheduler to wake PC:
                  </div>
                  <div className="flex items-center gap-2">
                    <pre className="flex-1 p-2 bg-background border rounded font-mono text-[10px] overflow-x-auto">
                      {windowsCmd}
                    </pre>
                    <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs" onClick={handleCopyCmd}>
                      <Copy className="w-3 h-3" />
                      {copiedCmd ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                disabled={savingSchedule}
                onClick={handleSaveSchedule}
              >
                <Clock className="w-4 h-4" />
                {scheduleSaved ? "Schedule Saved!" : savingSchedule ? "Saving..." : "Save Daily Schedule"}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
