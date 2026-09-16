"use client";

import React, { useState, useEffect, useRef } from "react";
import type { CopilotScope } from "@/lib/copilot/context-retriever";
import type { CopilotModelTier } from "@/lib/ai/openrouter";
import type { Opportunity } from "@/lib/opportunities/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  SendHorizontal,
  RotateCcw,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Flame,
  ArrowRight,
  User,
  Bot,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CopilotChatProps {
  initialOpportunity?: Opportunity | null;
  onSelectOpportunity?: (opp: Opportunity) => void;
  onRefreshOpportunities?: () => void;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    state: "call" | "result";
    result?: any;
  }>;
  pendingAction?: {
    type: "updateStatus" | "deleteOpportunity" | "archiveOpportunity";
    data: any;
    status: "pending" | "confirmed" | "cancelled";
  };
}

export function CopilotChat({
  initialOpportunity,
  onSelectOpportunity,
  onRefreshOpportunities,
}: CopilotChatProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: initialOpportunity
        ? `Hello! I'm your AI Copilot focusing on **${initialOpportunity.title}**.\n\nAsk me anything about market gaps, customer willingness-to-pay, competitor pricing, or say *"Move this to VALIDATING"* or *"Add a note about customer interview findings"* to take action.`
        : `Hello! I'm your AI Copilot for the **SaaS Opportunity Radar**.\n\nI can help you analyze opportunities, compare ideas across industries, extract pain points from public evidence, or update your workflow. What would you like to explore?`,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<CopilotScope>(
    initialOpportunity ? "CURRENT_OPPORTUNITY" : "ALL_OPPORTUNITIES",
  );
  const [modelTier, setModelTier] = useState<CopilotModelTier>("AUTO");
  const [activeModelName, setActiveModelName] = useState("OpenRouter Auto");
  const [isFallbackUsed, setIsFallbackUsed] = useState(false);

  // Conversations history
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    fetch("/api/copilot/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch((e) => console.error("Failed to load conversations:", e));
  }, []);

  // Update scope if initialOpportunity changes
  useEffect(() => {
    if (initialOpportunity) {
      setScope("CURRENT_OPPORTUNITY");
    }
  }, [initialOpportunity]);

  async function handleSendMessage(overrideText?: string) {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMessage: MessageItem = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setMessages([...newMessages, initialAssistantMessage]);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          scope,
          currentOpportunityId: initialOpportunity?.id,
          modelTier,
        }),
      });

      // Headers for model tracking
      const modelHeader = res.headers.get("X-Copilot-Model");
      if (modelHeader) setActiveModelName(modelHeader);
      const fallbackHeader = res.headers.get("X-Copilot-Fallback");
      setIsFallbackUsed(fallbackHeader === "true");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        if (chunk.includes('0:"')) {
          // Vercel AI SDK protocol
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                streamedContent += JSON.parse(line.slice(2));
              } catch {
                streamedContent += line.slice(2).replace(/^"|"$/g, "");
              }
            }
          }
        } else {
          // Plain text stream
          streamedContent += chunk;
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: streamedContent } : m)),
        );
      }

      // Check for state change proposal keywords to render interactive confirmation
      const lower = streamedContent.toLowerCase();
      if (
        (lower.includes("moved to") || lower.includes("status to") || lower.includes("transition")) &&
        initialOpportunity
      ) {
        // Detected status action, refresh opportunity radar
        onRefreshOpportunities?.();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream stopped by user");
      } else {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "I encountered an error connecting to OpenRouter. Please verify your OPENROUTER_API_KEY in .env.",
                }
              : m,
          ),
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }

  function handleStopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Conversation cleared. What startup opportunity or market space would you like to explore?",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  // Handle action confirmation
  async function handleConfirmAction(msgId: string, action: any) {
    if (action.type === "updateStatus" && initialOpportunity) {
      await fetch(`/api/opportunities/${initialOpportunity.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.data.status }),
      });
      onRefreshOpportunities?.();
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              pendingAction: { ...action, status: "confirmed" },
            }
          : m,
      ),
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
      {/* ── COPILOT TOP CONTROL BAR ──────────────────────────────────── */}
      <div className="border-b border-border/70 bg-card/60 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-foreground">AI Copilot</h3>
              {isFallbackUsed && (
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-medium text-amber-400">
                  Fallback model used
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-[300px]">
              Model: <strong className="text-foreground">{activeModelName}</strong>
            </p>
          </div>
        </div>

        {/* Controls: Scope + Model Tier + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              Scope:
            </span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as CopilotScope)}
              className="h-7 rounded-lg border border-border/80 bg-background px-2 text-xs font-medium text-foreground focus:outline-none"
            >
              {initialOpportunity && (
                <option value="CURRENT_OPPORTUNITY">Current: {initialOpportunity.title.slice(0, 20)}...</option>
              )}
              <option value="ALL_OPPORTUNITIES">All Opportunities</option>
              <option value="RESEARCH_SOURCES">Evidence Sources</option>
              <option value="ENTIRE_DATABASE">Entire Startup Database</option>
            </select>
          </div>

          {/* Model Tier Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              Model:
            </span>
            <select
              value={modelTier}
              onChange={(e) => setModelTier(e.target.value as CopilotModelTier)}
              className="h-7 rounded-lg border border-border/80 bg-background px-2 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="AUTO">Auto (Smart)</option>
              <option value="FAST">Fast (Cheap)</option>
              <option value="DEEP">Deep (Analysis)</option>
              <option value="FREE_ONLY">Free Only</option>
              <option value="CUSTOM">Custom Model</option>
            </select>
          </div>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Clear Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClearChat}
            title="Clear current messages"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* ── CHAT MESSAGES STREAMING AREA ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed max-w-3xl ${
                isUser ? "ml-auto justify-end" : "mr-auto justify-start"
              }`}
            >
              {!isUser && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary mt-0.5">
                  <Bot className="size-3.5" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 space-y-2.5 ${
                  isUser
                    ? "bg-primary text-primary-foreground font-medium rounded-br-sm"
                    : "border border-border/70 bg-card/80 text-foreground rounded-bl-sm shadow-sm"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>

                {/* Interactive Confirmation Card if proposed by AI */}
                {m.pendingAction && m.pendingAction.status === "pending" && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2 mt-2">
                    <div className="flex items-center gap-2 font-semibold text-amber-300">
                      <AlertCircle className="size-4" />
                      <span>Confirm Proposed State Change</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      Change status to <strong>{m.pendingAction.data.status}</strong>?
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-6 text-[11px] bg-amber-500 text-black hover:bg-amber-400"
                        onClick={() => handleConfirmAction(m.id, m.pendingAction)}
                      >
                        Confirm Action
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] text-muted-foreground"
                        onClick={() =>
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === m.id
                                ? { ...msg, pendingAction: { ...m.pendingAction!, status: "cancelled" } }
                                : msg,
                            ),
                          )
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Action Suggestions on AI responses */}
                {!isUser && m.id !== "welcome-msg" && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-muted-foreground/70">Quick Actions:</span>
                    <button
                      type="button"
                      onClick={() => handleSendMessage("Create a 7-day customer validation plan for this.")}
                      className="rounded bg-muted/60 px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      + 7-Day Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage("What are the 3 biggest fatal risks to this idea?")}
                      className="rounded bg-muted/60 px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      + Fatal Risks
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage("Compare this to other ideas in this industry.")}
                      className="rounded bg-muted/60 px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      + Compare Ideas
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 mt-0.5">
                  <User className="size-3.5" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── RESEARCH ACTION CHIPS ────────────────────────────────────── */}
      <div className="border-t border-border/60 bg-muted/20 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="font-semibold text-muted-foreground/80 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="size-3 text-primary" />
          Research Prompts:
        </span>
        {[
          "Research this opportunity",
          "Find competitors",
          "Find customer complaints",
          "Challenge this idea",
          "Find missing evidence",
          "Compare opportunities",
          "Summarize evidence",
          "What should I investigate next?",
        ].map((promptText) => (
          <button
            key={promptText}
            type="button"
            onClick={() => handleSendMessage(promptText)}
            className="rounded-full border border-border/80 bg-background/90 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted shrink-0 transition-colors"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* ── PROMPT INPUT BAR ────────────────────────────────────────── */}
      <div className="border-t border-border/70 bg-card/60 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2 items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              initialOpportunity
                ? `Ask AI Copilot about "${initialOpportunity.title.slice(0, 30)}..."`
                : "Ask AI Copilot to compare ideas, research problems, or update status..."
            }
            className="text-xs h-9 bg-background/90"
            disabled={loading}
          />

          {loading ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 text-xs gap-1.5 shrink-0"
              onClick={handleStopGeneration}
            >
              <Square className="size-3 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="h-9 text-xs gap-1.5 shrink-0 bg-primary text-primary-foreground font-semibold"
            >
              <SendHorizontal className="size-3.5" />
              Send
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
