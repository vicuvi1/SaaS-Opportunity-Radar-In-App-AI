export type IntegrationProviderId =
  | "reddit"
  | "openrouter"
  | "github"
  | "producthunt"
  | "telegram"
  | "hackernews"
  | string;

export type ConnectionStatus =
  | "NOT_CONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR"
  | "EXPIRED";

export type IntegrationCategory =
  | "ai"
  | "signal"
  | "export"
  | "notification"
  | "community";

export interface IntegrationConnectionRecord {
  id: string;
  userId: string;
  provider: IntegrationProviderId;
  status: ConnectionStatus;
  category: IntegrationCategory;
  accountName?: string | null;
  accountMetadata?: Record<string, unknown> | null;
  encryptedCredentials?: string | null; // Encrypted JSON string
  lastTestedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientIntegrationCard {
  id: IntegrationProviderId;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  status: ConnectionStatus;
  accountName?: string | null;
  accountMetadata?: Record<string, unknown> | null;
  maskedCredentials?: Record<string, string>;
  lastTestedAt?: string | null;
  errorMessage?: string | null;
  requiresAuth: boolean;
  authType: "oauth" | "api_key" | "token_pair" | "none";
  features: string[];
}

export interface OpenRouterModelRoleConfig {
  preset: "FREE_ONLY" | "FREE_FIRST" | "BALANCED" | "CUSTOM";
  roles: {
    discovery: string;
    analysis: string;
    scoring: string;
    chat: string;
    fallback: string;
  };
}

export interface OpenRouterCatalogModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  pricing: {
    prompt: number; // USD per 1M tokens
    completion: number; // USD per 1M tokens
  };
  isFree: boolean;
}

export interface TestResult {
  success: boolean;
  accountName?: string;
  details?: Record<string, unknown>;
  message: string;
}
