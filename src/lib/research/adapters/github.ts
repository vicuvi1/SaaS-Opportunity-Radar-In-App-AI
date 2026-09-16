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

export class GitHubAdapter implements SourceAdapter {
  id = "github";
  name = "GitHub API";
  sourceType = "github" as const;
  description = "Scans real-world developer issues, feature requests, and open-source integration bottlenecks.";

  async isConfigured(): Promise<boolean> {
    const creds = await getIntegrationCredentials(undefined, "github");
    if (creds && (creds.token || creds.accessToken)) return true;
    if (process.env.GITHUB_TOKEN) return true;
    // GitHub public search works with standard rate limits (10 req/min)
    return true;
  }

  private async getAuthToken(): Promise<string | null> {
    const creds = await getIntegrationCredentials(undefined, "github");
    return creds?.token || creds?.accessToken || process.env.GITHUB_TOKEN || null;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    const limit = options.limit || 15;
    const token = await this.getAuthToken();
    const signals: ResearchSignal[] = [];

    // Search for issues/PRs containing pain keywords
    const searchQuery = `${query} is:issue state:open comments:>2`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(
      searchQuery,
    )}&sort=comments&order=desc&per_page=${limit}`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SaaSOpportunityRadar/2.0",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(searchUrl, { headers });
      if (!res.ok) {
        console.warn(`[GitHubAdapter] HTTP ${res.status} from GitHub API.`);
        return [];
      }

      const data = await res.json();
      const items = data.items || [];

      for (const item of items) {
        const title = item.title || "";
        const body = item.body || "";
        const combined = `${title}\n\n${body}`;
        const url = item.html_url || "";
        const cleanContent = cleanText(combined);

        const pain = extractPainSignals(cleanContent);
        const commercial = extractCommercialSignals(cleanContent);
        const competitors = extractCompetitorSignals(cleanContent);

        let relevance = 0.5;
        if (pain.length > 0) relevance += 0.25;
        if (item.comments > 5) relevance += 0.15;
        if (item.reactions?.total_count > 5) relevance += 0.1;
        relevance = Math.min(1.0, relevance);

        const repoName = item.repository_url ? item.repository_url.replace("https://api.github.com/repos/", "") : "github";
        const hash = computeSignalHash(this.sourceType, url, cleanContent);

        signals.push({
          id: `gh-${item.id}`,
          sourceType: "github",
          sourceName: `github:${repoName}`,
          url,
          title,
          author: item.user?.login,
          publishedAt: item.created_at,
          collectedAt: new Date().toISOString(),
          content: cleanContent,
          engagement: {
            upvotes: item.reactions?.total_count || 0,
            commentsCount: item.comments || 0,
            score: (item.reactions?.total_count || 0) + (item.comments || 0),
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
      console.error("[GitHubAdapter] Search error:", err);
    }

    return signals;
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    try {
      const token = await this.getAuthToken();
      // Match github.com/:owner/:repo/issues/:number
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
      if (!match) return null;

      const [, owner, repo, issueNumber] = match;
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SaaSOpportunityRadar/2.0",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
        headers,
      });
      if (!res.ok) return null;

      const issue = await res.json();
      const combined = `${issue.title}\n\n${issue.body || ""}`;
      const clean = cleanText(combined);

      return {
        id: `gh-${issue.id}`,
        sourceType: "github",
        sourceName: `github:${owner}/${repo}`,
        url: issue.html_url,
        title: issue.title,
        author: issue.user?.login,
        publishedAt: issue.created_at,
        collectedAt: new Date().toISOString(),
        content: clean,
        engagement: {
          upvotes: issue.reactions?.total_count || 0,
          commentsCount: issue.comments || 0,
          score: issue.reactions?.total_count || 0,
        },
        topic: `${owner}/${repo}`,
        entities: extractCompetitorSignals(clean),
        painSignals: extractPainSignals(clean),
        commercialSignals: extractCommercialSignals(clean),
        competitorSignals: extractCompetitorSignals(clean),
        relevance: 0.8,
        hash: computeSignalHash("github", issue.html_url, clean),
      };
    } catch (err) {
      console.error("[GitHubAdapter] Fetch error:", err);
      return null;
    }
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const start = Date.now();
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = { "User-Agent": "SaaSOpportunityRadar/2.0" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("https://api.github.com/rate_limit", { headers });
      const configured = !!token;
      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "GitHub API operational" : `HTTP ${res.status}`,
        isConfigured: configured,
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err.message || "Failed to reach GitHub API",
        isConfigured: false,
      };
    }
  }
}
