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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  GitBranch as Github,
  Key,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Terminal,
  Trash2,
  XCircle,
  Cpu,
} from "lucide-react";
import type { ClientIntegrationCard } from "@/lib/integrations/types";

interface ConnectionWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: ClientIntegrationCard | null;
  onSaved: () => void;
}

export function ConnectionWizardDialog({
  open,
  onOpenChange,
  integration,
  onSaved,
}: ConnectionWizardDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    accountName?: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !integration) {
      setFormData({});
      setTestResult(null);
      return;
    }

    // Set initial values if masked credentials exist
    const initial: Record<string, string> = {};
    if (integration.maskedCredentials) {
      for (const [k, v] of Object.entries(integration.maskedCredentials)) {
        initial[k] = v;
      }
    }
    setFormData(initial);
    setTestResult(null);
  }, [open, integration]);

  if (!integration) return null;

  const isConnected = integration.status === "CONNECTED";

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleTest(credentialsToTest?: Record<string, string>) {
    if (!integration) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialsToTest || formData),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? "Connection verified" : "Test failed"),
        details: data.details,
        accountName: data.accountName,
      });
      if (data.success) {
        onSaved();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network error: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!integration) return;
    setSaving(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: integration.id,
          credentials: formData,
          testImmediate: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.testResult || { success: true, message: "Credentials saved securely" });
        onSaved();
      } else {
        setTestResult({ success: false, message: data.error || "Failed to save" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!integration) return;
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        onSaved();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setDisconnecting(false);
    }
  }

  function handleRedditOAuth() {
    const clientId = formData.clientId || "";
    const clientSecret = formData.clientSecret || "";
    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (clientSecret) params.set("clientSecret", clientSecret);

    const popup = window.open(
      `/api/integrations/reddit/oauth?${params.toString()}`,
      "reddit_oauth",
      "width=650,height=750,menubar=no,status=no",
    );

    const messageHandler = (e: MessageEvent) => {
      if (e.data?.type === "REDDIT_AUTH_SUCCESS") {
        window.removeEventListener("message", messageHandler);
        onSaved();
        setTestResult({ success: true, message: "Reddit OAuth connected successfully!" });
      } else if (e.data?.type === "REDDIT_AUTH_ERROR") {
        window.removeEventListener("message", messageHandler);
        setTestResult({ success: false, message: e.data.error || "Reddit authorization failed" });
      }
    };
    window.addEventListener("message", messageHandler);
  }

  const renderFormFields = () => {
    switch (integration.id) {
      case "openrouter":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey" className="text-xs font-semibold">
                  OpenRouter API Key
                </Label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Get API Key <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showSecrets.apiKey ? "text" : "password"}
                  placeholder="sk-or-v1-..."
                  value={formData.apiKey || ""}
                  onChange={(e) => handleInputChange("apiKey", e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("apiKey")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecrets.apiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Encrypted at rest using AES-256-GCM. Unlocks Claude 3.7, GPT-4o, Llama 3.3, and free inference models.
              </p>
            </div>
          </div>
        );

      case "reddit":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs space-y-2">
              <p className="font-medium text-foreground">Reddit App Credentials Setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">reddit.com/prefs/apps</a></li>
                <li>Click <strong>&quot;create app&quot;</strong> or <strong>&quot;create another app&quot;</strong></li>
                <li>Select <strong>&quot;web app&quot;</strong></li>
                <li>Set redirect uri to: <code className="bg-background px-1 py-0.5 rounded text-[10px] text-primary">{typeof window !== "undefined" ? `${window.location.origin}/api/integrations/reddit/callback` : "http://localhost:3000/api/integrations/reddit/callback"}</code></li>
                <li>Copy your <strong>Client ID</strong> (under app name) and <strong>Client Secret</strong></li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId" className="text-xs font-semibold">Reddit Client ID</Label>
              <Input
                id="clientId"
                placeholder="e.g. 14-char string"
                value={formData.clientId || ""}
                onChange={(e) => handleInputChange("clientId", e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret" className="text-xs font-semibold">Reddit Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecrets.clientSecret ? "text" : "password"}
                  placeholder="e.g. secret key"
                  value={formData.clientSecret || ""}
                  onChange={(e) => handleInputChange("clientSecret", e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("clientSecret")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecrets.clientSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRedditOAuth}
                className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10 text-xs"
              >
                <MessageCircle className="size-3.5" />
                Authorize via Reddit OAuth Popup
              </Button>
            </div>
          </div>
        );

      case "github":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="token" className="text-xs font-semibold">Personal Access Token (classic or fine-grained)</Label>
                <a
                  href="https://github.com/settings/tokens/new?description=SaaSOpportunityRadar&scopes=public_repo,read:user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Generate Token <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  id="token"
                  type={showSecrets.token ? "text" : "password"}
                  placeholder="ghp_... or github_pat_..."
                  value={formData.token || ""}
                  onChange={(e) => handleInputChange("token", e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("token")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecrets.token ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Requires minimal scope (public read). Increases GitHub Issues search rate limit to 5,000 requests/hr.
              </p>
            </div>
          </div>
        );

      case "producthunt":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Provide Developer Token OR Client ID & Secret:</p>
              <a
                href="https://www.producthunt.com/v2/oauth/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Product Hunt Apps <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="devToken" className="text-xs font-semibold">Developer Token (easiest)</Label>
              <div className="relative">
                <Input
                  id="devToken"
                  type={showSecrets.devToken ? "text" : "password"}
                  placeholder="Bearer token from Product Hunt API page"
                  value={formData.devToken || ""}
                  onChange={(e) => handleInputChange("devToken", e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("devToken")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecrets.devToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border/70"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-border/70"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="clientId" className="text-xs">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="App Client ID"
                  value={formData.clientId || ""}
                  onChange={(e) => handleInputChange("clientId", e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientSecret" className="text-xs">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Client Secret"
                  value={formData.clientSecret || ""}
                  onChange={(e) => handleInputChange("clientSecret", e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
        );

      case "telegram":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="botToken" className="text-xs font-semibold">Telegram Bot Token</Label>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Open @BotFather <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  id="botToken"
                  type={showSecrets.botToken ? "text" : "password"}
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  value={formData.botToken || ""}
                  onChange={(e) => handleInputChange("botToken", e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret("botToken")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecrets.botToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chatId" className="text-xs font-semibold">Chat ID / Channel ID</Label>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Find ID via @userinfobot <ExternalLink className="size-3" />
                </a>
              </div>
              <Input
                id="chatId"
                placeholder="e.g. 987654321 or @your_channel"
                value={formData.chatId || ""}
                onChange={(e) => handleInputChange("chatId", e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                When testing, the bot will send an instant confirmation ping directly to this chat.
              </p>
            </div>
          </div>
        );

      case "hackernews":
        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Hacker News uses the official Algolia public search API. No API key or authentication is required.
            </p>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              ✅ Hacker News feeds are globally active and continuously available for query searches.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/80 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Key className="size-4 text-primary" />
            {isConnected ? `Manage ${integration.name}` : `Connect ${integration.name}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {integration.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {renderFormFields()}

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`rounded-lg border p-3 text-xs flex items-start gap-2.5 transition-all ${
                testResult.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="size-4 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.accountName && (
                  <p className="text-[11px] opacity-90">Account: {testResult.accountName}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
          {isConnected ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disconnecting}
              onClick={handleDisconnect}
              className="text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
            >
              {disconnecting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Disconnect
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing || saving}
              onClick={() => handleTest()}
              className="text-xs gap-1.5 border-border/80"
            >
              {testing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Test Connection
            </Button>

            {integration.authType !== "none" && (
              <Button
                type="button"
                size="sm"
                disabled={saving || testing}
                onClick={handleSave}
                className="text-xs gap-1.5 bg-primary text-primary-foreground"
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                Save & Connect
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
