"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import type { FounderProfile } from "@/lib/profile/founder-profile";
import {
  ROLE_OPTIONS,
  SKILL_OPTIONS,
  COMMUNITY_OPTIONS,
  TECH_OPTIONS,
  GOAL_OPTIONS,
  MONETIZATION_OPTIONS,
  BUILD_TYPE_OPTIONS,
} from "@/lib/profile/options";
import { ArrowRight, Rocket } from "lucide-react";

const STEPS = [
  {
    id: "goals",
    heading: "What are you trying to build?",
    sub: "This shapes everything - it changes what a 'good idea' means for you.",
  },
  {
    id: "skills",
    heading: "What are you actually good at?",
    sub: "Pick everything that applies. This determines what you can realistically build.",
  },
  {
    id: "communities",
    heading: "What communities are you already part of?",
    sub: "Groups you're genuinely embedded in - not just interested in. This is your real distribution advantage.",
  },
  {
    id: "details",
    heading: "A few quick details",
    sub: "All optional. Helps narrow the search.",
  },
] as const;

export function FounderProfileOnboarding({
  onComplete,
  onSkip,
}: {
  onComplete: (profile: FounderProfile) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string[]>([]);
  const [buildType, setBuildType] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [technicalLevel, setTechnicalLevel] = useState("");
  const [communities, setCommunities] = useState<string[]>([]);
  const [monetizationPref, setMonetizationPref] = useState<string[]>([]);

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];

  function canAdvance() {
    if (step === 0) return goal.length > 0;
    if (step === 1) return skills.length > 0 && !!technicalLevel;
    if (step === 2) return communities.length > 0;
    return true;
  }

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete({
        role,
        skills,
        technicalLevel,
        communities,
        goal,
        monetizationPref,
        buildType,
        completedAt: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card shadow-2xl">

        {/* Header */}
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="size-4 text-primary" />
            <p className="text-sm font-bold text-primary uppercase tracking-wide">
              Build your Founder Profile
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            4 quick questions to unlock personalized opportunity mapping.
          </p>
          <div className="flex gap-1.5 mt-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-primary w-6" : "bg-muted/60 w-3"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-5 space-y-4 min-h-[300px]">
          <div>
            <p className="text-base font-semibold text-foreground">{currentStep.heading}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currentStep.sub}</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <ChipGroup
                options={GOAL_OPTIONS}
                selected={goal}
                multi
                allowCustom
                customPlaceholder="Add your own goal..."
                onChange={(v) => setGoal(v as string[])}
              />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">What type of business? <span className="font-normal text-muted-foreground/50">(optional)</span></p>
                <ChipGroup
                  options={BUILD_TYPE_OPTIONS}
                  selected={buildType}
                  multi
                  onChange={(v) => setBuildType(v as string[])}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <ChipGroup
                options={SKILL_OPTIONS}
                selected={skills}
                multi
                allowCustom
                searchable
                searchPlaceholder="Search skills (e.g. marketing, data analysis)..."
                customPlaceholder="Add a skill..."
                onChange={(v) => setSkills(v as string[])}
              />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Technical ability</p>
                <ChipGroup
                  options={TECH_OPTIONS}
                  selected={technicalLevel}
                  onChange={(v) => setTechnicalLevel(v as string)}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Role <span className="font-normal text-muted-foreground/50">(optional)</span></p>
                <ChipGroup
                  options={ROLE_OPTIONS}
                  selected={role}
                  multi
                  allowCustom
                  customPlaceholder="Add your own role..."
                  onChange={(v) => setRole(v as string[])}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <ChipGroup
              options={COMMUNITY_OPTIONS}
              selected={communities}
              multi
              allowCustom
              searchable
              searchPlaceholder="Search communities (e.g. poker players, gym owners)..."
              customPlaceholder="Add a community..."
              onChange={(v) => setCommunities(v as string[])}
            />
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">How do you want to make money? <span className="font-normal text-muted-foreground/60">(optional)</span></p>
                <ChipGroup
                  options={MONETIZATION_OPTIONS}
                  selected={monetizationPref}
                  multi
                  allowCustom
                  customPlaceholder="Add a monetization model..."
                  onChange={(v) => setMonetizationPref(v as string[])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/70 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={onSkip}
          >
            Skip for now
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={!canAdvance()}
              onClick={handleNext}
              className="gap-1.5"
            >
              {step === totalSteps - 1 ? "Finish" : "Continue"}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
