import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedIdea = {
  id: string;
  title: string;
  oneLiner?: string;
  whyYou?: string;
  whyNow?: string;
  monetizationPath?: string;
  tags?: string[];
  savedAt: string;
};

export async function loadSavedIdeas(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedIdea[]> {
  const { data, error } = await supabase
    .from("saved_ideas")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    oneLiner: row.one_liner as string | undefined,
    whyYou: row.why_you as string | undefined,
    whyNow: row.why_now as string | undefined,
    monetizationPath: row.monetization_path as string | undefined,
    tags: row.tags as string[] | undefined,
    savedAt: row.saved_at as string,
  }));
}

export async function saveIdea(
  supabase: SupabaseClient,
  userId: string,
  idea: Omit<SavedIdea, "id" | "savedAt">,
): Promise<SavedIdea | null> {
  const { data, error } = await supabase
    .from("saved_ideas")
    .insert({
      user_id: userId,
      title: idea.title,
      one_liner: idea.oneLiner ?? null,
      why_you: idea.whyYou ?? null,
      why_now: idea.whyNow ?? null,
      monetization_path: idea.monetizationPath ?? null,
      tags: idea.tags ?? [],
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    title: data.title as string,
    oneLiner: data.one_liner as string | undefined,
    whyYou: data.why_you as string | undefined,
    whyNow: data.why_now as string | undefined,
    monetizationPath: data.monetization_path as string | undefined,
    tags: data.tags as string[] | undefined,
    savedAt: data.saved_at as string,
  };
}

export async function unsaveIdea(
  supabase: SupabaseClient,
  userId: string,
  ideaId: string,
): Promise<void> {
  await supabase
    .from("saved_ideas")
    .delete()
    .eq("id", ideaId)
    .eq("user_id", userId);
}
