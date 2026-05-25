"use client";

import { ChipGroup } from "@/components/ui/chip-group";
import {
  SKILL_OPTIONS,
  COMMUNITY_OPTIONS,
  GOAL_OPTIONS,
  MONETIZATION_OPTIONS,
  BUILD_TYPE_OPTIONS,
} from "@/lib/profile/options";

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="text-sm font-semibold text-foreground">
      {children}
      {optional && <span className="ml-1.5 text-xs font-normal text-muted-foreground/60">(optional)</span>}
    </p>
  );
}

function AddHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-primary/70 font-medium">
      + {children}
    </p>
  );
}

export function GoalFields({
  goal,
  buildType,
  onGoalChange,
  onBuildTypeChange,
}: {
  goal: string[];
  buildType: string[];
  onGoalChange: (v: string[]) => void;
  onBuildTypeChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <FieldLabel>Your goal</FieldLabel>
        <ChipGroup
          options={GOAL_OPTIONS}
          selected={goal}
          multi
          allowCustom
          customPlaceholder="Describe your goal..."
          onChange={(v) => onGoalChange(v as string[])}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel optional>Type of business</FieldLabel>
        <ChipGroup
          options={BUILD_TYPE_OPTIONS}
          selected={buildType}
          multi
          onChange={(v) => onBuildTypeChange(v as string[])}
        />
      </div>
    </div>
  );
}

export function SkillsFields({
  skills,
  onSkillsChange,
}: {
  skills: string[];
  onSkillsChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>Skills & expertise</FieldLabel>
      <AddHint>Don't see your skill? Type it and press Enter to add it.</AddHint>
      <ChipGroup
        options={SKILL_OPTIONS}
        selected={skills}
        multi
        allowCustom
        searchable
        searchPlaceholder="Search skills (e.g. marketing, data analysis)..."
        customPlaceholder="Type a skill and press Enter..."
        onChange={(v) => onSkillsChange(v as string[])}
      />
    </div>
  );
}

export function CommunitiesFields({
  communities,
  onCommunitiesChange,
}: {
  communities: string[];
  onCommunitiesChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>Communities you're actually in</FieldLabel>
      <AddHint>Don't see your community? Type it and press Enter to add it.</AddHint>
      <ChipGroup
        options={COMMUNITY_OPTIONS}
        selected={communities}
        multi
        allowCustom
        searchable
        searchPlaceholder="Search communities (e.g. poker players, gym owners)..."
        customPlaceholder="Type a community and press Enter..."
        onChange={(v) => onCommunitiesChange(v as string[])}
      />
    </div>
  );
}

export function MonetizationFields({
  monetizationPref,
  onMonetizationPrefChange,
}: {
  monetizationPref: string[];
  onMonetizationPrefChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel optional>How you want to make money</FieldLabel>
      <ChipGroup
        options={MONETIZATION_OPTIONS}
        selected={monetizationPref}
        multi
        allowCustom
        customPlaceholder="Describe your model..."
        onChange={(v) => onMonetizationPrefChange(v as string[])}
      />
    </div>
  );
}
