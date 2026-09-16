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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, CheckCircle2, AlertTriangle, MessageSquare, ExternalLink } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities/types";

interface TelegramDispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOpportunities: Opportunity[];
  onOpenIntegrations?: () => void;
}

export function TelegramDispatchModal({
  open,
  onOpenChange,
  selectedOpportunities,
  onOpenIntegrations,
}: TelegramDispatchModalProps) {
  const [previewText, setPreviewText] = useState("");
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && selectedOpportunities.length > 0) {
      setError(null);
      setSuccessMessage(null);
      fetch("/api/telegram/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityIds: selectedOpportunities.map((o) => o.id),
          previewOnly: true,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.previewText) {
            setPreviewText(data.previewText);
          }
        })
        .catch((err) => {
          console.error("Failed to generate Telegram preview:", err);
        });
    }
  }, [open, selectedOpportunities]);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/telegram/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityIds: selectedOpportunities.map((o) => o.id),
          previewOnly: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send dispatch");
      }

      setSuccessMessage(`Successfully dispatched ${selectedOpportunities.length} opportunities to Telegram!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <DialogTitle className="text-xl">Dispatch to Telegram</DialogTitle>
            </div>
            <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 font-semibold">
              {selectedOpportunities.length} Selected
            </Badge>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            Send a formatted, high-density opportunity digest directly to your connected Telegram bot channel.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {successMessage ? (
            <div className="py-12 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-emerald-400">{successMessage}</h3>
              <p className="text-sm text-muted-foreground">
                Check your Telegram app to review your digest.
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Telegram Message Preview
                </label>
                <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed">
                    {previewText || "Generating message preview..."}
                  </pre>
                </ScrollArea>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {onOpenIntegrations && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 text-blue-400 hover:text-blue-300 p-1 gap-1"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenIntegrations();
                      }}
                    >
                      Connect in Integrations <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Credentials managed in <strong>Settings → Integrations</strong>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    disabled={sending || selectedOpportunities.length === 0}
                    onClick={handleSend}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending..." : `Dispatch (${selectedOpportunities.length})`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
