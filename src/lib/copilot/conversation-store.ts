import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiConversationsTable, aiMessagesTable } from "@/lib/db/schema";

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

function safeParseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export const conversationStore = {
  async list(opportunityId?: string): Promise<CopilotConversation[]> {
    try {
      let convRows = db
        .select()
        .from(aiConversationsTable)
        .orderBy(desc(aiConversationsTable.updatedAt))
        .all();

      if (opportunityId) {
        convRows = convRows.filter((c) => c.targetOpportunityId === opportunityId);
      }

      // Fetch messages for all conversations
      const allMessages = db
        .select()
        .from(aiMessagesTable)
        .orderBy(asc(aiMessagesTable.createdAt))
        .all();

      const messagesByConv = new Map<string, CopilotMessage[]>();
      for (const m of allMessages) {
        const list = messagesByConv.get(m.conversationId) || [];
        const parsedContext = safeParseJson<any>(m.contextData, {});
        list.push({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          createdAt: m.createdAt,
          toolInvocations: parsedContext.toolInvocations,
        });
        messagesByConv.set(m.conversationId, list);
      }

      return convRows.map((c) => ({
        id: c.id,
        title: c.title,
        opportunityId: c.targetOpportunityId || undefined,
        modelUsed: c.modelUsed || "auto",
        contextType: c.scope || "GLOBAL",
        messages: messagesByConv.get(c.id) || [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    } catch (err) {
      console.error("[conversation-store] Error listing conversations:", err);
      return [];
    }
  },

  async get(id: string): Promise<CopilotConversation | null> {
    try {
      const conv = db
        .select()
        .from(aiConversationsTable)
        .where(eq(aiConversationsTable.id, id))
        .get();

      if (!conv) return null;

      const messages = db
        .select()
        .from(aiMessagesTable)
        .where(eq(aiMessagesTable.conversationId, id))
        .orderBy(asc(aiMessagesTable.createdAt))
        .all()
        .map((m) => {
          const parsed = safeParseJson<any>(m.contextData, {});
          return {
            id: m.id,
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            createdAt: m.createdAt,
            toolInvocations: parsed.toolInvocations,
          };
        });

      return {
        id: conv.id,
        title: conv.title,
        opportunityId: conv.targetOpportunityId || undefined,
        modelUsed: conv.modelUsed || "auto",
        contextType: conv.scope || "GLOBAL",
        messages,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    } catch (err) {
      console.error(`[conversation-store] Error getting conversation ${id}:`, err);
      return null;
    }
  },

  async save(conversation: CopilotConversation): Promise<CopilotConversation> {
    const now = new Date().toISOString();
    const existing = db
      .select()
      .from(aiConversationsTable)
      .where(eq(aiConversationsTable.id, conversation.id))
      .get();

    if (existing) {
      db.update(aiConversationsTable)
        .set({
          title: conversation.title,
          targetOpportunityId: conversation.opportunityId || null,
          modelUsed: conversation.modelUsed,
          scope: conversation.contextType,
          updatedAt: now,
        })
        .where(eq(aiConversationsTable.id, conversation.id))
        .run();
    } else {
      db.insert(aiConversationsTable)
        .values({
          id: conversation.id,
          title: conversation.title,
          targetOpportunityId: conversation.opportunityId || null,
          modelUsed: conversation.modelUsed,
          scope: conversation.contextType,
          createdAt: conversation.createdAt || now,
          updatedAt: now,
        })
        .run();
    }

    // Upsert messages
    if (conversation.messages && conversation.messages.length > 0) {
      for (const msg of conversation.messages) {
        const msgExisting = db
          .select()
          .from(aiMessagesTable)
          .where(eq(aiMessagesTable.id, msg.id))
          .get();

        const contextData = JSON.stringify({
          toolInvocations: msg.toolInvocations || [],
        });

        if (!msgExisting) {
          db.insert(aiMessagesTable)
            .values({
              id: msg.id,
              conversationId: conversation.id,
              role: msg.role,
              content: msg.content,
              modelUsed: conversation.modelUsed,
              contextData,
              createdAt: msg.createdAt || now,
            })
            .run();
        } else {
          db.update(aiMessagesTable)
            .set({
              content: msg.content,
              contextData,
            })
            .where(eq(aiMessagesTable.id, msg.id))
            .run();
        }
      }
    }

    return (await this.get(conversation.id))!;
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
    try {
      db.delete(aiMessagesTable)
        .where(eq(aiMessagesTable.conversationId, id))
        .run();
      const res = db
        .delete(aiConversationsTable)
        .where(eq(aiConversationsTable.id, id))
        .run();
      return res.changes > 0;
    } catch (err) {
      console.error(`[conversation-store] Error deleting conversation ${id}:`, err);
      return false;
    }
  },
};
