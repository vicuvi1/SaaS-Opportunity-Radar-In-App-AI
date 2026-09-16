import type {
  SourceAdapter,
  ResearchSignal,
  AdapterSearchOptions,
  SourceAdapterHealth,
} from "./types";
import { getIntegrationCredentials } from "@/lib/integrations/vault";
import {
  computeSignalHash,
  extractPainSignals,
  extractCommercialSignals,
  extractCompetitorSignals,
  cleanText,
} from "./signal-utils";

const TARGET_SUBREDDITS = [
  "SaaS",
  "startups",
  "Entrepreneur",
  "smallbusiness",
  "salesengineering",
  "sysadmin",
  "devops",
  "webdev",
  "productmanagement",
  "recruitinghell",
  "accounting",
  "ecommerce",
];

export class RedditApiAdapter implements SourceAdapter {
  id = "reddit";
  name = "Reddit API";
  sourceType = "reddit" as const;
  description = "Discovers organic user complaints, manual workarounds, and tool requests across professional subreddits.";

  private cachedToken: { token: string; expiresAt: number } | null = null;

  async isConfigured(): Promise<boolean> {
    const creds = await getIntegrationCredentials(undefined, "reddit");
    if (creds && creds.clientId && creds.clientSecret) return true;
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) return true;
    // Reddit public JSON search endpoints work without OAuth as a read-only fallback
    return true;
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken.token;
    }

    const creds = await getIntegrationCredentials(undefined, "reddit");
    const clientId = creds?.clientId || process.env.REDDIT_CLIENT_ID;
    const clientSecret = creds?.clientSecret || process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    try {
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const res = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "SaaSOpportunityRadar/2.0 (by /u/FounderHQ)",
        },
        body: "grant_type=client_credentials",
      });

      if (res.ok) {
        const data = await res.json();
        this.cachedToken = {
          token: data.access_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
        return data.access_token;
      }
    } catch (err) {
      console.warn("[RedditApiAdapter] OAuth token fetch error:", err);
    }
    return null;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    const limit = options.limit || 15;
    const token = await this.getAccessToken();
    const signals: ResearchSignal[] = [];

    // Search across relevant subreddits or global
    const subredditList = TARGET_SUBREDDITS.slice(0, 4).join("+");
    const searchUrl = token
      ? `https://oauth.reddit.com/r/${subredditList}/search?q=${encodeURIComponent(query)}&sort=relevance&t=year&limit=${limit}&restrict_sr=1`
      : `https://www.reddit.com/r/${subredditList}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=year&limit=${limit}&restrict_sr=1`;

    const headers: Record<string, string> = {
      "User-Agent": "SaaSOpportunityRadar/2.0 (by /u/FounderHQ)",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(searchUrl, { headers });
      if (!res.ok) {
        console.warn(`[RedditApiAdapter] HTTP ${res.status} when searching Reddit.`);
        return [];
      }

      const json = await res.json();
      const posts = json?.data?.children || [];

      for (const item of posts) {
        const post = item.data;
        if (!post || post.over_18) continue;

        const title = post.title || "";
        const selftext = post.selftext || "";
        const combinedText = `${title}\n\n${selftext}`;
        const url = post.url && post.url.startsWith("http") ? post.url : `https://reddit.com${post.permalink}`;
        const cleanContent = cleanText(combinedText);

        const pain = extractPainSignals(cleanContent);
        const commercial = extractCommercialSignals(cleanContent);
        const competitors = extractCompetitorSignals(cleanContent);

        // Calculate relevance based on presence of pain and commercial keywords
        let relevance = 0.5;
        if (pain.length > 0) relevance += 0.25;
        if (commercial.length > 0) relevance += 0.15;
        if (post.num_comments > 10) relevance += 0.1;
        relevance = Math.min(1.0, relevance);

        const hash = computeSignalHash(this.sourceType, url, cleanContent);

        signals.push({
          id: `rd-${post.id}`,
          sourceType: "reddit",
          sourceName: `r/${post.subreddit}`,
          url,
          title,
          author: post.author,
          publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
          collectedAt: new Date().toISOString(),
          content: cleanContent,
          engagement: {
            upvotes: post.ups || 0,
            commentsCount: post.num_comments || 0,
            score: post.score || 0,
          },
          topic: query,
          entities: competitors,
          painSignals: pain,
          commercialSignals: commercial,
          competitorSignals: competitors,
          relevance,
          hash,
        });
      }
    } catch (err) {
      console.error("[RedditApiAdapter] Search error:", err);
    }

    return signals;
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    try {
      const jsonUrl = url.replace(/\/$/, "") + ".json";
      const res = await fetch(jsonUrl, {
        headers: { "User-Agent": "SaaSOpportunityRadar/2.0 (by /u/FounderHQ)" },
      });
      if (!res.ok) return null;

      const [postData, commentsData] = await res.json();
      const post = postData?.data?.children?.[0]?.data;
      if (!post) return null;

      const topComments = (commentsData?.data?.children || [])
        .slice(0, 5)
        .map((c: any) => c.data?.body || "")
        .filter(Boolean)
        .join("\n\n---\n\n");

      const combinedText = `${post.title}\n\n${post.selftext || ""}\n\nTop Comments:\n${topComments}`;
      const clean = cleanText(combinedText);

      return {
        id: `rd-${post.id}`,
        sourceType: "reddit",
        sourceName: `r/${post.subreddit}`,
        url,
        title: post.title,
        author: post.author,
        publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
        collectedAt: new Date().toISOString(),
        content: clean,
        engagement: {
          upvotes: post.ups || 0,
          commentsCount: post.num_comments || 0,
          score: post.score || 0,
        },
        topic: post.subreddit,
        entities: extractCompetitorSignals(clean),
        painSignals: extractPainSignals(clean),
        commercialSignals: extractCommercialSignals(clean),
        competitorSignals: extractCompetitorSignals(clean),
        relevance: 0.8,
        hash: computeSignalHash("reddit", url, clean),
      };
    } catch (err) {
      console.error("[RedditApiAdapter] Fetch error:", err);
      return null;
    }
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const start = Date.now();
    try {
      const res = await fetch("https://www.reddit.com/r/SaaS/hot.json?limit=1", {
        headers: { "User-Agent": "SaaSOpportunityRadar/2.0 (by /u/FounderHQ)" },
      });
      const configured = await this.isConfigured();
      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "Reddit API operational" : `HTTP ${res.status}`,
        isConfigured: configured,
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err.message || "Failed to reach Reddit API",
        isConfigured: false,
      };
    }
  }
}
