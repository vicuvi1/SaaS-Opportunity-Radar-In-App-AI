import fs from "fs";
import path from "path";
import { encryptSecret, decryptSecret, maskSecret } from "./crypto";
import type {
  ConnectionStatus,
  IntegrationCategory,
  IntegrationConnectionRecord,
  IntegrationProviderId,
} from "./types";
import { createServerClient } from "@/lib/supabase/server";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "integration_connections.json");

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]), "utf-8");
  }
}

function readLocalConnections(): IntegrationConnectionRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[vault] Failed reading local connections JSON:", err);
    return [];
  }
}

function writeLocalConnections(list: IntegrationConnectionRecord[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
}

export async function getIntegrationConnection(
  userId: string | undefined,
  provider: IntegrationProviderId,
): Promise<IntegrationConnectionRecord | null> {
  const targetUser = userId || "default_local_user";

  // Try Supabase first if available
  try {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("integration_connections")
        .select("*")
        .eq("user_id", targetUser)
        .eq("provider", provider)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          provider: data.provider,
          status: data.status,
          category: data.category,
          accountName: data.account_name,
          accountMetadata: data.account_metadata,
          encryptedCredentials: data.encrypted_credentials,
          lastTestedAt: data.last_tested_at,
          errorMessage: data.error_message,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
  } catch {
    // Supabase unavailable or table doesn't exist yet, fall through to local
  }

  // Local JSON fallback
  const local = readLocalConnections();
  return (
    local.find(
      (c) => (c.userId === targetUser || c.userId === "default_local_user") && c.provider === provider,
    ) || null
  );
}

export async function listIntegrationConnections(
  userId?: string,
): Promise<IntegrationConnectionRecord[]> {
  const targetUser = userId || "default_local_user";

  try {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("integration_connections")
        .select("*")
        .eq("user_id", targetUser);

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          provider: d.provider,
          status: d.status,
          category: d.category,
          accountName: d.account_name,
          accountMetadata: d.account_metadata,
          encryptedCredentials: d.encrypted_credentials,
          lastTestedAt: d.last_tested_at,
          errorMessage: d.error_message,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
  } catch {
    // Fall back to local file
  }

  const local = readLocalConnections();
  return local.filter(
    (c) => c.userId === targetUser || c.userId === "default_local_user",
  );
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
  const lastTested = markTested ? now : existing?.lastTestedAt ?? null;

  const record: IntegrationConnectionRecord = {
    id,
    userId: targetUser,
    provider,
    status,
    category,
    accountName: accountName !== undefined ? accountName : (existing?.accountName ?? null),
    accountMetadata:
      accountMetadata !== undefined
        ? accountMetadata
        : (existing?.accountMetadata ?? null),
    encryptedCredentials: encryptedPayload,
    lastTestedAt: lastTested,
    errorMessage: errorMessage !== undefined ? errorMessage : null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  // Attempt Supabase upsert
  let savedToSupabase = false;
  try {
    const supabase = await createServerClient();
    if (supabase) {
      const { error } = await supabase.from("integration_connections").upsert({
        id: record.id,
        user_id: record.userId,
        provider: record.provider,
        status: record.status,
        category: record.category,
        account_name: record.accountName,
        account_metadata: record.accountMetadata,
        encrypted_credentials: record.encryptedCredentials,
        last_tested_at: record.lastTestedAt,
        error_message: record.errorMessage,
        updated_at: record.updatedAt,
      });
      if (!error) savedToSupabase = true;
    }
  } catch {
    // Fall back to local
  }

  // Always mirror/persist to local JSON as well
  const local = readLocalConnections();
  const index = local.findIndex(
    (c) => c.userId === targetUser && c.provider === provider,
  );
  if (index >= 0) {
    local[index] = record;
  } else {
    local.push(record);
  }
  writeLocalConnections(local);

  return record;
}

export async function deleteIntegrationConnection(
  userId: string | undefined,
  provider: IntegrationProviderId,
): Promise<boolean> {
  const targetUser = userId || "default_local_user";

  try {
    const supabase = await createServerClient();
    if (supabase) {
      await supabase
        .from("integration_connections")
        .delete()
        .eq("user_id", targetUser)
        .eq("provider", provider);
    }
  } catch {
    // Ignore error
  }

  const local = readLocalConnections();
  const filtered = local.filter(
    (c) => !(c.userId === targetUser && c.provider === provider),
  );
  writeLocalConnections(filtered);
  return true;
}

/**
 * Primary decrypted credentials accessor.
 * Decrypts vault record if found.
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
