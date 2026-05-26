"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Tag, X, Zap } from "lucide-react";
import { CREDIT_PACKS, CREDIT_COSTS } from "@/lib/stripe-config";

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number | null;
  onPurchased?: () => void;
}

export function BuyCreditsModal({ open, onOpenChange, currentCredits, onPurchased }: BuyCreditsModalProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!open) return null;

  async function handleBuy(packId: string) {
    setPurchasing(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        setPurchasing(null);
      }
    } catch {
      setPurchasing(null);
    }
  }

  async function handlePromo() {
    const code = promoCode.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch("/api/credits/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { message?: string; credits?: number; error?: string };
      if (res.ok && data.message) {
        setPromoResult({ type: "success", message: data.message });
        setPromoCode("");
        onPurchased?.();
      } else {
        setPromoResult({ type: "error", message: data.error ?? "Something went wrong." });
      }
    } catch {
      setPromoResult({ type: "error", message: "Something went wrong." });
    } finally {
      setPromoLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-background shadow-xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="px-6 pb-2 pt-6">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <h2 className="text-base font-semibold">Get more credits</h2>
          </div>
          {currentCredits !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              You have <span className="font-medium text-foreground">{currentCredits}</span> credits remaining.
            </p>
          )}
        </div>

        {/* Credit cost reference */}
        <div className="mx-6 mt-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credit costs</p>
          <div className="space-y-1">
            {[
              { label: "Validate an idea", cost: CREDIT_COSTS.validate },
              { label: "Discover opportunities", cost: CREDIT_COSTS.discover },
              { label: "Generate Launch Plan", cost: CREDIT_COSTS.finish },
              { label: "Chat", cost: null },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                {item.cost !== null ? (
                  <span className="font-medium">{item.cost} credits</span>
                ) : (
                  <span className="font-medium text-primary">Free</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Packs */}
        <div className="space-y-2 px-6 py-4">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={!!purchasing}
              onClick={() => handleBuy(pack.id)}
              className={`relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all hover:bg-muted/40 disabled:opacity-60 ${
                "popular" in pack && pack.popular
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60"
              }`}
            >
              {"popular" in pack && pack.popular && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">{pack.label}</p>
                <p className="text-xs text-muted-foreground">{pack.sublabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  ${(pack.price / 100).toFixed(0)}
                </span>
                {purchasing === pack.id ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </button>
          ))}
        </div>

        {/* Promo code */}
        <div className="border-t border-border/60 px-6 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Tag className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">Have a promo code?</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoResult(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") void handlePromo(); }}
              placeholder="Enter code"
              maxLength={32}
              className="flex-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              disabled={promoLoading || !promoCode.trim()}
              onClick={() => void handlePromo()}
              className="rounded-lg border border-border/60 bg-muted/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              {promoLoading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
            </button>
          </div>
          {promoResult && (
            <div className={`mt-2 flex items-center gap-1.5 text-xs ${
              promoResult.type === "success" ? "text-green-500" : "text-destructive"
            }`}>
              {promoResult.type === "success" && <CheckCircle2 className="size-3.5 shrink-0" />}
              <span>{promoResult.message}</span>
            </div>
          )}
        </div>

        <p className="px-6 pb-5 text-center text-xs text-muted-foreground">
          Secure payment via Stripe. Credits never expire.
        </p>
      </div>
    </div>
  );
}
