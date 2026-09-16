import type {
  ClientIntegrationCard,
  ConnectionStatus,
  IntegrationCategory,
  IntegrationProviderId,
  OpenRouterCatalogModel,
  TestResult,
} from "./types";
import {
  getIntegrationConnection,
  getIntegrationCredentials,
  saveIntegrationConnection,
  buildMaskedCredentials,
} from "./vault";

export interface BaseProvider {
  id: IntegrationProviderId;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  authType: "oauth" | "api_key" | "token_pair" | "none";
  requiresAuth: boolean;
  features: string[];

  test(credentials: Record<string, any>): Promise<TestResult>;
  getClientCard(userId?: string): Promise<ClientIntegrationCard>;
}

// ── OpenRouter Provider ───────────────────────────────────────────────────────
export class OpenRouterProvider implements BaseProvider {
  id = "openrouter";
  name = "OpenRouter";
  category: IntegrationCategory = "ai";
  description = "Unified AI model gateway providing Claude 3.7, GPT-4o, Llama 3.3, and free inference models.";
  icon = "Cpu";
  authType: "api_key" = "api_key";
  requiresAuth = true;
  features = ["Multi-model routing", "Free-tier models", "Cost optimization", "Copilot & scoring"];

  async test(credentials: { apiKey?: string }): Promise<TestResult> {
    const key = credentials.apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      return { success: false, message: "Missing OpenRouter API Key" };
    }

    try {
      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: {
          Authorization: `Bearer ${key.trim()}`,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          message: `OpenRouter authentication failed (HTTP ${res.status}): ${res.statusText}`,
        };
      }

      const json = await res.json();
      const label = json.data?.label || "OpenRouter Key";
      const limit = json.data?.limit;
      const usage = json.data?.usage;

      return {
        success: true,
        accountName: label,
        details: { limit, usage, isFreeTier: json.data?.is_free_tier },
        message: `Successfully authenticated key: ${label}`,
      };
    } catch (err: any) {
      return { success: false, message: `Connection error: ${err.message}` };
    }
  }

  async fetchCatalog(apiKey?: string): Promise<OpenRouterCatalogModel[]> {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    const headers: Record<string, string> = {};
    if (key) {
      headers.Authorization = `Bearer ${key.trim()}`;
    }

    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", { headers });
      if (!res.ok) return [];

      const json = await res.json();
      const models = json.data || [];

      return models.map((m: any) => {
        const promptPrice = parseFloat(m.pricing?.prompt || "0") * 1_000_000;
        const completionPrice = parseFloat(m.pricing?.completion || "0") * 1_000_000;
        const isFree = promptPrice === 0 && completionPrice === 0;

        return {
          id: m.id,
          name: m.name || m.id,
          description: m.description,
          contextLength: m.context_length || 4096,
          pricing: {
            prompt: Number(promptPrice.toFixed(4)),
            completion: Number(completionPrice.toFixed(4)),
          },
          isFree,
        };
      });
    } catch (err) {
      console.error("[openrouter] fetchCatalog failed:", err);
      return [];
    }
  }

  async getClientCard(userId?: string): Promise<ClientIntegrationCard> {
    const conn = await getIntegrationConnection(userId, this.id);
    const creds = await getIntegrationCredentials(userId, this.id);

    let status: ConnectionStatus = conn?.status || "NOT_CONNECTED";
    if (status === "NOT_CONNECTED" && creds?.apiKey) {
      status = "CONNECTED";
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      icon: this.icon,
      status,
      accountName: conn?.accountName || (creds?.apiKey ? "OpenRouter (Configured)" : null),
      accountMetadata: conn?.accountMetadata || null,
      maskedCredentials: buildMaskedCredentials(creds),
      lastTestedAt: conn?.lastTestedAt || null,
      errorMessage: conn?.errorMessage || null,
      requiresAuth: this.requiresAuth,
      authType: this.authType,
      features: this.features,
    };
  }
}

// ── Reddit Provider ───────────────────────────────────────────────────────────
export class RedditProvider implements BaseProvider {
  id = "reddit";
  name = "Reddit";
  category: IntegrationCategory = "signal";
  description = "Live consumer sentiment, complaints, and problem validation across subreddits.";
  icon = "MessageCircle";
  authType: "oauth" = "oauth";
  requiresAuth = true;
  features = ["Subreddit searching", "Comment mining", "Real OAuth code flow", "No passwords required"];

  getOAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      state,
      redirect_uri: redirectUri,
      duration: "permanent",
      scope: "identity read",
    });
    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  async exchangeCode({
    clientId,
    clientSecret,
    code,
    redirectUri,
  }: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
  }): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number; scope: string }> {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "FounderHQ/1.0",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`Reddit code exchange failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`Reddit OAuth error: ${data.error}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async test(credentials: {
    accessToken?: string;
    clientId?: string;
    clientSecret?: string;
  }): Promise<TestResult> {
    const token = credentials.accessToken;

    if (token) {
      try {
        const res = await fetch("https://oauth.reddit.com/api/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "FounderHQ/1.0",
          },
        });

        if (res.ok) {
          const user = await res.json();
          return {
            success: true,
            accountName: `u/${user.name}`,
            details: { totalKarma: user.total_karma, verified: user.has_verified_email },
            message: `Connected as u/${user.name}`,
          };
        }
      } catch (err: any) {
        console.warn("[reddit] OAuth token test error:", err);
      }
    }

    // If client credentials are provided, test app identity
    if (credentials.clientId && credentials.clientSecret) {
      try {
        const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
        const res = await fetch("https://www.reddit.com/api/v1/access_token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "FounderHQ/1.0",
          },
          body: "grant_type=client_credentials",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.access_token) {
            return {
              success: true,
              accountName: "Reddit App Client",
              details: { tokenType: json.token_type, scope: json.scope },
              message: "Connected via Reddit App credentials",
            };
          }
        }
      } catch (err: any) {
        return { success: false, message: `Reddit API error: ${err.message}` };
      }
    }

    // Public Reddit fallback test
    try {
      const publicRes = await fetch("https://www.reddit.com/r/startups/about.json", {
        headers: { "User-Agent": "FounderHQ/1.0" },
      });
      if (publicRes.ok) {
        return {
          success: true,
          accountName: "Public Read-Only",
          message: "Public Reddit access verified",
        };
      }
    } catch {
      // ignore
    }

    return { success: false, message: "Could not authenticate Reddit credentials" };
  }

  async getClientCard(userId?: string): Promise<ClientIntegrationCard> {
    const conn = await getIntegrationConnection(userId, this.id);
    const creds = await getIntegrationCredentials(userId, this.id);

    let status: ConnectionStatus = conn?.status || "NOT_CONNECTED";
    if (status === "NOT_CONNECTED" && (creds?.accessToken || (creds?.clientId && creds?.clientSecret))) {
      status = "CONNECTED";
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      icon: this.icon,
      status,
      accountName: conn?.accountName || (status === "CONNECTED" ? "Connected via Reddit" : null),
      accountMetadata: conn?.accountMetadata || null,
      maskedCredentials: buildMaskedCredentials(creds),
      lastTestedAt: conn?.lastTestedAt || null,
      errorMessage: conn?.errorMessage || null,
      requiresAuth: this.requiresAuth,
      authType: this.authType,
      features: this.features,
    };
  }
}

// ── GitHub Provider ───────────────────────────────────────────────────────────
export class GitHubProvider implements BaseProvider {
  id = "github";
  name = "GitHub";
  category: IntegrationCategory = "signal";
  description = "Search open GitHub issues, feature discussions, and developer pain points.";
  icon = "Github";
  authType: "api_key" = "api_key";
  requiresAuth = true;
  features = ["Issue search", "Developer friction signals", "Higher rate limits", "Public and private scope"];

  async test(credentials: { token?: string }): Promise<TestResult> {
    const token = credentials.token || process.env.GITHUB_TOKEN;
    if (!token) {
      return { success: false, message: "Missing GitHub Personal Access Token" };
    }

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "User-Agent": "FounderHQ/1.0",
          Accept: "application/vnd.github+json",
        },
      });

      if (!res.ok) {
        return {
          success: false,
          message: `GitHub authentication failed (HTTP ${res.status}): ${res.statusText}`,
        };
      }

      const user = await res.json();
      return {
        success: true,
        accountName: `@${user.login}`,
        details: { name: user.name, publicRepos: user.public_repos },
        message: `Successfully connected as @${user.login}`,
      };
    } catch (err: any) {
      return { success: false, message: `GitHub connection error: ${err.message}` };
    }
  }

  async getClientCard(userId?: string): Promise<ClientIntegrationCard> {
    const conn = await getIntegrationConnection(userId, this.id);
    const creds = await getIntegrationCredentials(userId, this.id);

    let status: ConnectionStatus = conn?.status || "NOT_CONNECTED";
    if (status === "NOT_CONNECTED" && creds?.token) {
      status = "CONNECTED";
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      icon: this.icon,
      status,
      accountName: conn?.accountName || (creds?.token ? "GitHub Connected" : null),
      accountMetadata: conn?.accountMetadata || null,
      maskedCredentials: buildMaskedCredentials(creds),
      lastTestedAt: conn?.lastTestedAt || null,
      errorMessage: conn?.errorMessage || null,
      requiresAuth: this.requiresAuth,
      authType: this.authType,
      features: this.features,
    };
  }
}

// ── Product Hunt Provider ─────────────────────────────────────────────────────
export class ProductHuntProvider implements BaseProvider {
  id = "producthunt";
  name = "Product Hunt";
  category: IntegrationCategory = "signal";
  description = "Search launches, upvoted competitors, and product launch discussions via GraphQL.";
  icon = "Flame";
  authType: "token_pair" = "token_pair";
  requiresAuth = true;
  features = ["GraphQL v2 API", "Competitor launch telemetry", "Category demand checks"];

  async test(credentials: {
    clientId?: string;
    clientSecret?: string;
    devToken?: string;
  }): Promise<TestResult> {
    const devToken = credentials.devToken;
    let token = devToken;

    if (!token && credentials.clientId && credentials.clientSecret) {
      try {
        const tokenRes = await fetch("https://api.producthunt.com/v2/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: credentials.clientId.trim(),
            client_secret: credentials.clientSecret.trim(),
            grant_type: "client_credentials",
          }),
        });

        if (!tokenRes.ok) {
          return {
            success: false,
            message: `Failed to exchange Product Hunt credentials (HTTP ${tokenRes.status})`,
          };
        }

        const tokenData = await tokenRes.json();
        token = tokenData.access_token;
      } catch (err: any) {
        return { success: false, message: `Product Hunt token request failed: ${err.message}` };
      }
    }

    if (!token) {
      return { success: false, message: "Missing Product Hunt Client ID/Secret or Developer Token" };
    }

    try {
      const gqlRes = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query { posts(first: 1) { edges { node { id name tagline } } } }`,
        }),
      });

      if (!gqlRes.ok) {
        return {
          success: false,
          message: `Product Hunt GraphQL failed (HTTP ${gqlRes.status})`,
        };
      }

      const json = await gqlRes.json();
      if (json.errors && json.errors.length > 0) {
        return {
          success: false,
          message: `GraphQL error: ${json.errors.map((e: any) => e.message).join(", ")}`,
        };
      }

      return {
        success: true,
        accountName: "Product Hunt API Client",
        details: { postsQueried: json.data?.posts?.edges?.length || 0 },
        message: "Successfully verified Product Hunt GraphQL v2 connection",
      };
    } catch (err: any) {
      return { success: false, message: `Product Hunt error: ${err.message}` };
    }
  }

  async getClientCard(userId?: string): Promise<ClientIntegrationCard> {
    const conn = await getIntegrationConnection(userId, this.id);
    const creds = await getIntegrationCredentials(userId, this.id);

    let status: ConnectionStatus = conn?.status || "NOT_CONNECTED";
    if (status === "NOT_CONNECTED" && ((creds?.clientId && creds?.clientSecret) || creds?.devToken)) {
      status = "CONNECTED";
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      icon: this.icon,
      status,
      accountName: conn?.accountName || (status === "CONNECTED" ? "Product Hunt Active" : null),
      accountMetadata: conn?.accountMetadata || null,
      maskedCredentials: buildMaskedCredentials(creds),
      lastTestedAt: conn?.lastTestedAt || null,
      errorMessage: conn?.errorMessage || null,
      requiresAuth: this.requiresAuth,
      authType: this.authType,
      features: this.features,
    };
  }
}

// ── Telegram Provider ─────────────────────────────────────────────────────────
export class TelegramProvider implements BaseProvider {
  id = "telegram";
  name = "Telegram";
  category: IntegrationCategory = "notification";
  description = "Instant notifications and daily opportunity digest delivery to your Telegram bot or channel.";
  icon = "Send";
  authType: "token_pair" = "token_pair";
  requiresAuth = true;
  features = ["Bot alert dispatch", "High-potential opportunity push", "Instant verification test"];

  async test(credentials: { botToken?: string; chatId?: string }): Promise<TestResult> {
    const botToken = credentials.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = credentials.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!botToken) {
      return { success: false, message: "Missing Telegram Bot Token" };
    }

    try {
      // Step 1: Verify Bot Identity
      const meRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
      if (!meRes.ok) {
        return {
          success: false,
          message: `Invalid Telegram Bot Token (HTTP ${meRes.status})`,
        };
      }

      const meData = await meRes.json();
      if (!meData.ok) {
        return {
          success: false,
          message: `Telegram API error: ${meData.description || "Unknown error"}`,
        };
      }

      const botUsername = meData.result?.username ? `@${meData.result.username}` : meData.result?.first_name;

      // Step 2: If chatId provided, send test ping
      if (chatId) {
        const msgRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text: `🛰️ *SaaS Opportunity Radar* connection verified!\nYour Telegram integration is active and ready for alert dispatches.`,
            parse_mode: "Markdown",
          }),
        });

        if (!msgRes.ok) {
          const msgData = await msgRes.json().catch(() => ({}));
          return {
            success: false,
            message: `Bot valid, but could not send to Chat ID: ${msgData.description || msgRes.statusText}`,
          };
        }
      }

      return {
        success: true,
        accountName: botUsername,
        details: { botId: meData.result?.id, chatIdConfigured: !!chatId },
        message: chatId
          ? `Verified ${botUsername} and delivered test ping to chat ${chatId}!`
          : `Verified bot ${botUsername}. Note: Add Chat ID to receive alerts.`,
      };
    } catch (err: any) {
      return { success: false, message: `Telegram connection error: ${err.message}` };
    }
  }

  async getClientCard(userId?: string): Promise<ClientIntegrationCard> {
    const conn = await getIntegrationConnection(userId, this.id);
    const creds = await getIntegrationCredentials(userId, this.id);

    let status: ConnectionStatus = conn?.status || "NOT_CONNECTED";
    if (status === "NOT_CONNECTED" && creds?.botToken) {
      status = "CONNECTED";
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      icon: this.icon,
      status,
      accountName: conn?.accountName || (creds?.botToken ? "Telegram Bot Configured" : null),
      accountMetadata: conn?.accountMetadata || null,
      maskedCredentials: buildMaskedCredentials(creds),
      lastTestedAt: conn?.lastTestedAt || null,
      errorMessage: conn?.errorMessage || null,
      requiresAuth: this.requiresAuth,
      authType: this.authType,
      features: this.features,
    };
  }
}

// ── Hacker News Provider ──────────────────────────────────────────────────────
export class HackerNewsProvider implements BaseProvider {
  id = "hackernews";
  name = "Hacker News";
  category: IntegrationCategory = "signal";
  description = "Real-time tech discussion comments and thread mining via Algolia HN Search API.";
  icon = "Terminal";
  authType: "none" = "none";
  requiresAuth = false;
  features = ["Algolia Search API", "Free & public", "Developer & tech trends", "Always available"];

  async test(): Promise<TestResult> {
    try {
      const res = await fetch("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=1");
      if (res.ok) {
        return {
          success: true,
          accountName: "HN Algolia API",
          message: "Hacker News search gateway operational",
        };
      }
      return { success: false, message: `HN API returned HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, message: `HN API connection error: ${err.message}` };
    }
  }

  async getClientCard(): Promise<ClientIntegrationCard> {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      icon: this.icon,
      status: "CONNECTED",
      accountName: "Public Read-Only",
      accountMetadata: null,
      maskedCredentials: {},
      lastTestedAt: new Date().toISOString(),
      errorMessage: null,
      requiresAuth: this.requiresAuth,
      authType: this.authType,
      features: this.features,
    };
  }
}

// ── Registry Class ────────────────────────────────────────────────────────────
export class IntegrationRegistry {
  private static providers: Map<IntegrationProviderId, BaseProvider> = new Map<IntegrationProviderId, BaseProvider>([
    ["openrouter", new OpenRouterProvider()],
    ["reddit", new RedditProvider()],
    ["github", new GitHubProvider()],
    ["producthunt", new ProductHuntProvider()],
    ["telegram", new TelegramProvider()],
    ["hackernews", new HackerNewsProvider()],
  ]);

  static getProvider(id: IntegrationProviderId): BaseProvider | undefined {
    return this.providers.get(id);
  }

  static getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  static async getCards(userId?: string): Promise<ClientIntegrationCard[]> {
    const list = this.getAllProviders();
    const cards = await Promise.all(list.map((p) => p.getClientCard(userId)));
    return cards;
  }
}
