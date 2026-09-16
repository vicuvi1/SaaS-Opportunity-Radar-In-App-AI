import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrationsTable } from "@/lib/db/schema";
import { encryptSecret, decryptSecret, maskSecret } from "./crypto";
import type {
  ConnectionStatus,
  IntegrationCategory,
  IntegrationConnectionRecord,
  IntegrationProviderId,
} from "./types";

function safeParseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function rowToRecord(
  row: typeof integrationsTable.$inferSelect,
  userId: string = "default_local_user",
): IntegrationConnectionRecord {
  return {
    id: row.id,
    userId,
    provider: row.provider as IntegrationProviderId,
    status: row.status as ConnectionStatus,
    category: row.category as IntegrationCategory,
    accountName: row.accountName,
    accountMetadata: safeParseJson<Record<string, unknown> | null>(
      row.accountMetadata,
      null,
    ),
    encryptedCredentials: row.encryptedCredentials,
    lastTestedAt: row.lastTestedAt,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getIntegrationConnection(
  userId: string | undefined,
  provider: IntegrationProviderId,
): Promise<IntegrationConnectionRecord | null> {
  const targetUser = userId || "default_local_user";
  try {
    const row = db
      .select()
      .from(integrationsTable)
      .where(eq(integrationsTable.provider, provider))
      .get();

    if (!row) return null;
    return rowToRecord(row, targetUser);
  } catch (err) {
    console.error(`[vault] Error fetching connection for ${provider}:`, err);
    return null;
  }
}

export async function listIntegrationConnections(
  userId?: string,
): Promise<IntegrationConnectionRecord[]> {
  const targetUser = userId || "default_local_user";
  try {
    const rows = db.select().from(integrationsTable).all();
    return rows.map((r) => rowToRecord(r, targetUser));
  } catch (err) {
    console.error("[vault] Error listing connections:", err);
    return [];
  }
}

export async function saveIntegrationConnection({
  userId,
  provider,
  status,
  category,
  accountName,
  accountMetadata,
  credentials,
  errorMessage,
  markTested,
}: {
  userId?: string;
  provider: IntegrationProviderId;
  status: ConnectionStatus;
  category: IntegrationCategory;
  accountName?: string | null;
  accountMetadata?: Record<string, unknown> | null;
  credentials?: Record<string, unknown> | null;
  errorMessage?: string | null;
  markTested?: boolean;
}): Promise<IntegrationConnectionRecord> {
  const targetUser = userId || "default_local_user";
  const now = new Date().toISOString();

  let encryptedPayload: string | null = null;
  if (credentials) {
    encryptedPayload = encryptSecret(JSON.stringify(credentials));
  } else {
    // Keep existing encrypted payload if credentials not explicitly overwritten
    const existing = await getIntegrationConnection(targetUser, provider);
    if (existing?.encryptedCredentials) {
      encryptedPayload = existing.encryptedCredentials;
    }
  }

  const existing = await getIntegrationConnection(targetUser, provider);
  const id = existing?.id || `conn_${provider}_${Date.now()}`;
  const lastTested = markTested ? now : (existing?.lastTestedAt ?? null);

  const metaStr =
    accountMetadata !== undefined
      ? JSON.stringify(accountMetadata)
      : existing?.accountMetadata
        ? JSON.stringify(existing.accountMetadata)
        : "{}";

  const accName =
    accountName !== undefined ? accountName : (existing?.accountName ?? null);

  const errMsg =
    errorMessage !== undefined ? errorMessage : null;

  if (existing) {
    db.update(integrationsTable)
      .set({
        status,
        category,
        accountName: accName,
        accountMetadata: metaStr,
        encryptedCredentials: encryptedPayload,
        lastTestedAt: lastTested,
        errorMessage: errMsg,
        updatedAt: now,
      })
      .where(eq(integrationsTable.provider, provider))
      .run();
  } else {
    db.insert(integrationsTable)
      .values({
        id,
        provider,
        status,
        category,
        accountName: accName,
        accountMetadata: metaStr,
        encryptedCredentials: encryptedPayload,
        lastTestedAt: lastTested,
        errorMessage: errMsg,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return (await getIntegrationConnection(targetUser, provider))!;
}

export async function deleteIntegrationConnection(
  userId: string | undefined,
  provider: IntegrationProviderId,
): Promise<boolean> {
  try {
    const res = db
      .delete(integrationsTable)
      .where(eq(integrationsTable.provider, provider))
      .run();
    return res.changes > 0;
  } catch (err) {
    console.error(`[vault] Error deleting connection for ${provider}:`, err);
    return false;
  }
}

/**
 * Primary decrypted credentials accessor.
 * Decrypts vault record if found in SQLite.
 * If not found in vault, checks environment variables so existing configuration is never broken.
 */
export async function getIntegrationCredentials<T = Record<string, any>>(
  userId: string | undefined,
  provider: IntegrationProviderId,
): Promise<T | null> {
  const conn = await getIntegrationConnection(userId, provider);

  if (conn?.encryptedCredentials) {
    try {
      const decrypted = decryptSecret(conn.encryptedCredentials);
      const parsed = JSON.parse(decrypted);
      return parsed as T;
    } catch (err) {
      console.error(`[vault] Decryption failed for provider ${provider}:`, err);
    }
  }

  // Fallback to environment variables
  switch (provider) {
    case "openrouter": {
      if (process.env.OPENROUTER_API_KEY) {
        return { apiKey: process.env.OPENROUTER_API_KEY } as unknown as T;
      }
      break;
    }
    case "reddit": {
      if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
        return {
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
        } as unknown as T;
      }
      break;
    }
    case "github": {
      if (process.env.GITHUB_TOKEN) {
        return { token: process.env.GITHUB_TOKEN } as unknown as T;
      }
      break;
    }
    case "producthunt": {
      if (process.env.PRODUCT_HUNT_CLIENT_ID && process.env.PRODUCT_HUNT_CLIENT_SECRET) {
        return {
          clientId: process.env.PRODUCT_HUNT_CLIENT_ID,
          clientSecret: process.env.PRODUCT_HUNT_CLIENT_SECRET,
        } as unknown as T;
      }
      break;
    }
    case "telegram": {
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        return {
          botToken: process.env.TELEGRAM_BOT_TOKEN,
          chatId: process.env.TELEGRAM_CHAT_ID,
        } as unknown as T;
      }
      break;
    }
    case "hackernews": {
      return {} as unknown as T; // Hacker News requires no credentials
    }
  }

  return null;
}

/**
 * Builds masked version of credentials for client-safe inspection.
 */
export function buildMaskedCredentials(
  creds: Record<string, any> | null | undefined,
): Record<string, string> {
  if (!creds) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(creds)) {
    if (typeof val === "string" && val.length > 0) {
      out[key] = maskSecret(val);
    }
  }
  return out;
}
