import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { researchConfigsTable } from "@/lib/db/schema";
import { runResearch } from "@/lib/research/runner";

export interface ResearchConfigInput {
  id?: string;
  name: string;
  field: string;
  customField?: string;
  targetIdeaCount?: number;
  scheduleTime?: string; // HH:mm format, e.g. "18:00"
  timezone?: string; // e.g. "Europe/Chisinau"
  frequency?: "daily" | "weekly" | "custom";
  depth?: "quick" | "deep";
  sources?: string[];
  aiMode?: "FREE_ONLY" | "FREE_FIRST" | "BALANCED" | "CUSTOM";
  minQualityThreshold?: number;
  enabled?: boolean;
}

let schedulerTimer: NodeJS.Timeout | null = null;
let isChecking = false;

/**
 * Checks if a config is due to run in the target timezone
 */
function isConfigDue(config: typeof researchConfigsTable.$inferSelect): boolean {
  if (!config.enabled) return false;

  const tz = config.timezone || "Europe/Chisinau";
  const now = new Date();

  // Format current time in config's timezone
  let currentTimeInTz: string;
  let currentDateInTz: string;
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    currentTimeInTz = formatter.format(now);

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    currentDateInTz = dateFormatter.format(now); // YYYY-MM-DD
  } catch {
    currentTimeInTz = now.toISOString().slice(11, 16);
    currentDateInTz = now.toISOString().slice(0, 10);
  }

  // Check if today already ran
  if (config.lastRunAt) {
    const lastRunDate = config.lastRunAt.slice(0, 10);
    if (lastRunDate === currentDateInTz) {
      return false; // Already ran today
    }
  }

  // Compare schedule time (e.g. "18:00" <= currentTimeInTz)
  const targetTime = config.scheduleTime || "18:00";
  return currentTimeInTz >= targetTime;
}

/**
 * Core tick function run periodically
 */
async function checkAndRunScheduledTasks(): Promise<void> {
  if (isChecking) return;
  isChecking = true;

  try {
    const configs = db.select().from(researchConfigsTable).all();

    for (const cfg of configs) {
      if (isConfigDue(cfg)) {
        console.log(`[local-scheduler] Triggering scheduled research for config "${cfg.name}" (${cfg.id})`);
        try {
          await runResearch({ configId: cfg.id });
        } catch (runErr) {
          console.error(`[local-scheduler] Failed executing config ${cfg.id}:`, runErr);
        }
      }
    }
  } catch (err) {
    console.error("[local-scheduler] Error during scheduler check:", err);
  } finally {
    isChecking = false;
  }
}

/**
 * Initializes the background scheduler (runs every 60 seconds)
 */
export function initLocalScheduler(): void {
  if (schedulerTimer) return;

  // Run initial check after 5 seconds to catch up if PC was off during schedule time
  setTimeout(() => {
    checkAndRunScheduledTasks();
  }, 5000);

  // Check every 60 seconds
  schedulerTimer = setInterval(() => {
    checkAndRunScheduledTasks();
  }, 60 * 1000);

  console.log("[local-scheduler] Local research scheduler initialized (1-minute poll cycle + startup catchup check).");
}

export const localScheduler = {
  async listConfigs(): Promise<Array<typeof researchConfigsTable.$inferSelect>> {
    try {
      return db.select().from(researchConfigsTable).all();
    } catch (err) {
      console.error("[local-scheduler] Error listing configs:", err);
      return [];
    }
  },

  async getConfig(id: string) {
    return db
      .select()
      .from(researchConfigsTable)
      .where(eq(researchConfigsTable.id, id))
      .get();
  },

  async saveConfig(input: ResearchConfigInput) {
    const now = new Date().toISOString();
    const id = input.id || `cfg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = db
      .select()
      .from(researchConfigsTable)
      .where(eq(researchConfigsTable.id, id))
      .get();

    const sourcesJson = JSON.stringify(
      input.sources || ["reddit", "hackernews", "github", "producthunt", "stackoverflow"],
    );

    if (existing) {
      db.update(researchConfigsTable)
        .set({
          name: input.name,
          field: input.field,
          customField: input.customField || "",
          targetIdeaCount: input.targetIdeaCount ?? 10,
          scheduleTime: input.scheduleTime || "18:00",
          timezone: input.timezone || "Europe/Chisinau",
          frequency: input.frequency || "daily",
          depth: input.depth || "quick",
          sources: sourcesJson,
          aiMode: input.aiMode || "FREE_ONLY",
          minQualityThreshold: input.minQualityThreshold ?? 60,
          enabled: input.enabled === false ? 0 : 1,
        })
        .where(eq(researchConfigsTable.id, id))
        .run();
    } else {
      db.insert(researchConfigsTable)
        .values({
          id,
          name: input.name,
          field: input.field,
          customField: input.customField || "",
          targetIdeaCount: input.targetIdeaCount ?? 10,
          scheduleTime: input.scheduleTime || "18:00",
          timezone: input.timezone || "Europe/Chisinau",
          frequency: input.frequency || "daily",
          depth: input.depth || "quick",
          sources: sourcesJson,
          aiMode: input.aiMode || "FREE_ONLY",
          minQualityThreshold: input.minQualityThreshold ?? 60,
          enabled: input.enabled === false ? 0 : 1,
          createdAt: now,
        })
        .run();
    }

    return this.getConfig(id);
  },

  async deleteConfig(id: string): Promise<boolean> {
    const res = db
      .delete(researchConfigsTable)
      .where(eq(researchConfigsTable.id, id))
      .run();
    return res.changes > 0;
  },

  async triggerNow(configId: string) {
    return runResearch({ configId });
  },
};

// Auto-start scheduler when imported on server
initLocalScheduler();
