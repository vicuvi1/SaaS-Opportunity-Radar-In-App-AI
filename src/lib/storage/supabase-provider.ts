import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlueprintResult, ForgeThread } from "@/lib/workspace/types";
import type { StorageProvider, StoredMessage } from "./types";

/** Maximum messages stored per thread. Oldest are dropped when exceeded. */
const MESSAGE_CAP = 60;

export function createSupabaseProvider(
  supabase: SupabaseClient,
  userId: string,
): StorageProvider {
  return {
    async loadThreads() {
      const { data, error } = await supabase
        .from("threads")
        .select("*, idea_reports(payload, updated_at), discovery_results(payload, updated_at), blueprint_results(payload, updated_at)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error || !data) return [];

      return data.map((row) => {
        const reportRow = Array.isArray(row.idea_reports)
          ? row.idea_reports[0]
          : row.idea_reports;
        const discoveryRow = Array.isArray(row.discovery_results)
          ? row.discovery_results[0]
          : row.discovery_results;
        const blueprintRow = Array.isArray(row.blueprint_results)
          ? row.blueprint_results[0]
          : row.blueprint_results;
        return {
          id: row.id as string,
          title: row.title as string,
          topic: row.topic as string,
          founderProfile: row.founder_profile as string,
          pastedSignals: row.pasted_signals as string,
          favorite: row.favorite as boolean,
          updatedAt: new Date(row.updated_at as string).getTime(),
          report: reportRow?.payload ?? null,
          discoveryResult: discoveryRow?.payload ?? null,
          blueprintResult: (blueprintRow?.payload as BlueprintResult) ?? null,
        } satisfies ForgeThread;
      });
    },

    async upsertThread(thread) {
      const { error: threadError } = await supabase.from("threads").upsert(
        {
          id: thread.id,
          user_id: userId,
          title: thread.title,
          topic: thread.topic,
          founder_profile: thread.founderProfile,
          pasted_signals: thread.pastedSignals,
          favorite: thread.favorite ?? false,
          updated_at: new Date(thread.updatedAt).toISOString(),
        },
        { onConflict: "id" },
      );
      if (threadError) {
        // Log but do NOT return - the thread may already exist in Supabase from
        // a previous call that timed out on the client side. Always attempt to
        // save the report even if this upsert reports an error.
        console.error("[storage] thread upsert error (continuing):", threadError.message, threadError.code);
      }

      if (thread.report) {
        const { error: reportError } = await supabase
          .from("idea_reports")
          .upsert(
            {
              thread_id: thread.id,
              user_id: userId,
              payload: thread.report,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "thread_id" },
          );
        if (reportError) {
          console.error("[storage] report upsert error:", reportError.message, reportError.code, "| thread:", thread.id);
        }
      }

      if (thread.discoveryResult) {
        const { error: discoveryError } = await supabase
          .from("discovery_results")
          .upsert(
            {
              thread_id: thread.id,
              user_id: userId,
              payload: thread.discoveryResult,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "thread_id" },
          );
        if (discoveryError) {
          console.error("[storage] discovery upsert error:", discoveryError.message, discoveryError.code, "| thread:", thread.id);
        }
      }

      if (thread.blueprintResult) {
        const { error: blueprintError } = await supabase
          .from("blueprint_results")
          .upsert(
            {
              thread_id: thread.id,
              user_id: userId,
              payload: thread.blueprintResult,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "thread_id" },
          );
        if (blueprintError) {
          console.error("[storage] blueprint upsert error:", blueprintError.message, blueprintError.code, "| thread:", thread.id);
        }
      }
    },

    async deleteThread(id) {
      const { error } = await supabase
        .from("threads")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) console.error("[storage] deleteThread:", error.message);
    },

    async loadMessages(threadId) {
      const { data, error } = await supabase
        .from("thread_messages")
        .select("messages")
        .eq("thread_id", threadId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) return [];

      type MsgRow = { id: string; role: string; content: string; created_at: string };
      const rows = (data.messages ?? []) as MsgRow[];
      return rows.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: new Date(m.created_at).getTime(),
      }));
    },

    async saveMessages(threadId, messages) {
      const trimmed = messages.slice(-MESSAGE_CAP);
      // Upsert a single row - one row per thread, whole conversation in jsonb.
      const { error } = await supabase
        .from("thread_messages")
        .upsert(
          {
            thread_id: threadId,
            user_id: userId,
            messages: trimmed.map((m) => ({
              id: m.id,          // stored in json, not a DB uuid column - fine
              role: m.role,
              content: m.content,
              created_at: new Date(m.createdAt).toISOString(),
            })),
          },
          { onConflict: "thread_id" },
        );
      if (error) console.error("[storage] saveMessages:", error.message);
    },
  };
}
