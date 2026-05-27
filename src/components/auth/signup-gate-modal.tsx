"use client";

import { SignInCard } from "@/components/auth/sign-in-sheet";
import { X, Zap } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignupGateModal({ open, onOpenChange }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm px-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-0 z-10 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/8 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className="size-4 text-primary" />
            <p className="text-sm font-semibold">You used your free trial</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Create a free account and get <span className="font-semibold text-foreground">10 credits instantly</span> - enough for 3 full validations.
          </p>
        </div>

        <SignInCard onClose={() => onOpenChange(false)} defaultMode="signup" />
      </div>
    </div>
  );
}
