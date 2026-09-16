import fs from "fs";
import path from "path";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { createClient } from "@/lib/supabase/server";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "call" | "result";
    result?: unknown;
  }>;
}

export interface CopilotConversation {
  id: string;
  title: string;
  opportunityId?: string;
  modelUsed: string;
  contextType: string;
  messages: CopilotMessage[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONV_FILE = path.join(DATA_DIR, "copilot_conversations.json");

function ensureConvFile(): CopilotConversation[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONV_FILE)) {
      fs.writeFileSync(CONV_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const raw = fs.readFileSync(CONV_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[conversation-store] Error reading conversations:", err);
    return [];
  }
}

function writeConvFile(items: CopilotConversation[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONV_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("[conversation-store] Error writing conversations:", err);
  }
}

export const conversationStore = {
  async list(opportunityId?: string): Promise<CopilotConversation[]> {
    const all = ensureConvFile();
    if (opportunityId) {
      return all
        .filter((c) => c.opportunityId === opportunityId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async get(id: string): Promise<CopilotConversation | null> {
    const all = ensureConvFile();
    return all.find((c) => c.id === id) ?? null;
  },

  async save(conversation: CopilotConversation): Promise<CopilotConversation> {
    const all = ensureConvFile();
    const idx = all.findIndex((c) => c.id === conversation.id);
    const updated = { ...conversation, updatedAt: new Date().toISOString() };

    if (idx >= 0) {
      all[idx] = updated;
    } else {
      all.unshift(updated);
    }
    writeConvFile(all);
    return updated;
  },

  async create(data: {
    title?: string;
    opportunityId?: string;
    modelUsed?: string;
    contextType?: string;
    initialMessages?: CopilotMessage[];
  }): Promise<CopilotConversation> {
    const now = new Date().toISOString();
    const id = `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newConv: CopilotConversation = {
      id,
      title: data.title || "New Research Chat",
      opportunityId: data.opportunityId,
      modelUsed: data.modelUsed || "auto",
      contextType: data.contextType || "ALL_OPPORTUNITIES",
      messages: data.initialMessages || [],
      createdAt: now,
      updatedAt: now,
    };
    return this.save(newConv);
  },

  async delete(id: string): Promise<boolean> {
    const all = ensureConvFile();
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length === all.length) return false;
    writeConvFile(filtered);
    return true;
  },
};
