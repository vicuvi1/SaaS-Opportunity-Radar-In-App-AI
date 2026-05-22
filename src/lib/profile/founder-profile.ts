import type { SupabaseClient } from "@supabase/supabase-js";

export type FounderProfile = {
  role: string[];
  skills: string[];
  technicalLevel: string;
  communities: string[];
  goal: string[];
  monetizationPref: string[];
  buildType: string[];
  additionalContext?: string;
  completedAt: string;
};

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return (val as unknown[]).filter((s): s is string => typeof s === "string");
  if (typeof val === "string" && val) return [val];
  return [];
}

function toFirstString(val: unknown): string {
  if (Array.isArray(val)) return typeof val[0] === "string" ? val[0] : "";
  if (typeof val === "string") return val;
  return "";
}

function normalizeProfile(raw: unknown): FounderProfile {
  const p = raw as Record<string, unknown>;
  return {
    role: toStringArray(p.role),
    skills: toStringArray(p.skills),
    technicalLevel: toFirstString(p.technicalLevel),
    communities: Array.isArray(p.communities) ? (p.communities as string[]) :
                 Array.isArray(p.interests) ? (p.interests as string[]) : [],
    goal: toStringArray(p.goal),
    monetizationPref: toStringArray(p.monetizationPref),
    buildType: toStringArray(p.buildType),
    additionalContext: typeof p.additionalContext === "string" ? p.additionalContext : undefined,
    completedAt: typeof p.completedAt === "string" ? p.completedAt : new Date().toISOString(),
  };
}

export async function loadFounderProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<FounderProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("founder_profile")
    .eq("id", userId)
    .single();

  if (error || !data?.founder_profile) return null;
  return normalizeProfile(data.founder_profile);
}

export async function saveFounderProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: FounderProfile,
): Promise<void> {
  await supabase
    .from("profiles")
    .upsert({ id: userId, founder_profile: profile, updated_at: new Date().toISOString() });
}

export function founderProfileToText(profile: FounderProfile): string {
  const parts: string[] = [];
  if (profile.role?.length) parts.push(`Role: ${profile.role.join(", ")}`);
  if (profile.skills?.length) parts.push(`Skills / expertise: ${profile.skills.join(", ")}`);
  if (profile.technicalLevel) parts.push(`Technical level: ${profile.technicalLevel}`);
  if (profile.communities?.length) parts.push(`Communities / networks I have access to: ${profile.communities.join(", ")}`);
  if (profile.goal?.length) parts.push(`Goal: ${profile.goal.join(", ")}`);
  if (profile.monetizationPref?.length) parts.push(`Monetization preference: ${profile.monetizationPref.join(", ")}`);
  if (profile.buildType?.length) parts.push(`Preferred business type: ${profile.buildType.join(", ")}`);
  if (profile.additionalContext?.trim()) parts.push(`Workflow frustrations / context: ${profile.additionalContext.trim()}`);
  return parts.join("\n");
}
