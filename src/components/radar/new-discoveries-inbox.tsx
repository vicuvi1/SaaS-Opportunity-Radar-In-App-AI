"use client";

import { useState } from "react";
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
import {
  Inbox,
  Check,
  X,
  Sparkles,
  Star,
  Bookmark,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { Opportunity } from "@/lib/opportunities/types";

interface NewDiscoveriesInboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunities: Opportunity[];
  onKeep: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDeepResearch: (opp: Opportunity) => void;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  onToggleSaved?: (id: string, e: React.MouseEvent) => void;
}

export function NewDiscoveriesInbox({
  open,
  onOpenChange,
  opportunities,
  onKeep,
  onReject,
  onDeepResearch,
  onToggleFavorite,
  onToggleSaved,
}: NewDiscoveriesInboxProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const inboxItems = opportunities.filter((o) => o.isNewDiscovery);

  const handleAction = async (action: "keep" | "reject", id: string) => {
    setProcessingId(id);
    try {
      if (action === "keep") {
        await onKeep(id);
      } else {
        await onReject(id);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleKeepAll = async () => {
    for (const item of inboxItems) {
      await onKeep(item.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
              <DialogTitle className="text-xl">
                Daily Research Inbox
                <Badge variant="secondary" className="ml-2 bg-emerald-500/15 text-emerald-400">
                  {inboxItems.length} New
                </Badge>
              </DialogTitle>
            </div>
            {inboxItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleKeepAll} className="gap-1.5 text-xs">
                <Check className="w-3.5 h-3.5" />
                Keep All ({inboxItems.length})
              </Button>
            )}
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            New discoveries are staged here first so your main board stays clean. Review and accept candidates into your pipeline or reject noise.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {inboxItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base">Inbox is completely clear</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No pending discoveries waiting for review. Trigger a new Discovery run or wait for your daily scheduled scan to populate new ideas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inboxItems.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 border rounded-xl bg-card hover:border-muted-foreground/30 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">{opp.title}</span>
                        <Badge
                          variant="outline"
                          className={
                            opp.researchScore >= 75
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          }
                        >
                          Score: {opp.researchScore}/100
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {opp.industry}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>Target: <strong className="text-foreground">{opp.targetCustomer}</strong></span>
                        <span>•</span>
                        <span>Source: {opp.source}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onToggleFavorite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                          onClick={(e) => onToggleFavorite(opp.id, e)}
                        >
                          <Star className={`w-4 h-4 ${opp.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                        </Button>
                      )}
                      {onToggleSaved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                          onClick={(e) => onToggleSaved(opp.id, e)}
                        >
                          <Bookmark className={`w-4 h-4 ${opp.saved ? "fill-blue-400 text-blue-400" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 rounded-lg text-sm space-y-1.5">
                    <div>
                      <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Problem</span>
                      <p className="text-sm mt-0.5">{opp.problem}</p>
                    </div>
                    {opp.aiOpportunity && (
                      <div className="pt-1.5 border-t border-border/40">
                        <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider">AI Opportunity</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{opp.aiOpportunity}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-1.5 text-xs"
                      onClick={() => onDeepResearch(opp)}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      13-Dimension Deep Research
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 text-xs gap-1"
                        disabled={processingId === opp.id}
                        onClick={() => handleAction("reject", opp.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        disabled={processingId === opp.id}
                        onClick={() => handleAction("keep", opp.id)}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Keep to Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
