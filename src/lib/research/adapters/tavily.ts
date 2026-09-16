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

export class TavilySearchAdapter implements SourceAdapter {
  id = "tavily";
  name = "Tavily AI Search";
  sourceType = "web" as const;
  description = "AI-optimized web search extracting deep content from competitor homepages, forums, and market analyses.";

  async isConfigured(): Promise<boolean> {
    const creds = await getIntegrationCredentials(undefined, "tavily");
    if (creds && creds.apiKey) return true;
    if (process.env.TAVILY_API_KEY) return true;
    return false;
  }

  private async getApiKey(): Promise<string | null> {
    const creds = await getIntegrationCredentials(undefined, "tavily");
    return creds?.apiKey || process.env.TAVILY_API_KEY || null;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    const apiKey = await this.getApiKey();
    if (!apiKey) return [];

    const limit = options.limit || 10;
    const signals: ResearchSignal[] = [];

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: options.searchType === "pain_focused" ? "advanced" : "basic",
          max_results: limit,
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (!res.ok) {
        console.warn(`[TavilySearchAdapter] HTTP ${res.status} from Tavily API.`);
        return [];
      }

      const data = await res.json();
      const results = data.results || [];

      for (const item of results) {
        const title = item.title || "";
        const content = item.content || "";
        const cleanContent = cleanText(content);
        const url = item.url || "";

        const pain = extractPainSignals(cleanContent);
        const commercial = extractCommercialSignals(cleanContent);
        const competitors = extractCompetitorSignals(cleanContent);

        const hash = computeSignalHash(this.sourceType, url, cleanContent);

        signals.push({
          id: `tv-${hash.slice(0, 12)}`,
          sourceType: "web",
          sourceName: "Tavily Web Search",
          url,
          title,
          publishedAt: item.published_date,
          collectedAt: new Date().toISOString(),
          content: cleanContent,
          engagement: {
            score: Math.round((item.score || 0.5) * 100),
          },
          topic: query,
          entities: competitors,
          painSignals: pain,
          commercialSignals: commercial,
          competitorSignals: competitors,
          relevance: item.score || 0.7,
          hash,
        });
      }
    } catch (err) {
      console.error("[TavilySearchAdapter] Search error:", err);
    }

    return signals;
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    const apiKey = await this.getApiKey();
    if (!apiKey) return null;

    try {
      const res = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          urls: [url],
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const result = data.results?.[0];
      if (!result) return null;

      const clean = cleanText(result.raw_content || "");

      return {
        id: `tv-${Date.now()}`,
        sourceType: "web",
        sourceName: "Tavily Extractor",
        url,
        title: url,
        collectedAt: new Date().toISOString(),
        content: clean,
        engagement: {},
        topic: "web_extract",
        entities: extractCompetitorSignals(clean),
        painSignals: extractPainSignals(clean),
        commercialSignals: extractCommercialSignals(clean),
        competitorSignals: extractCompetitorSignals(clean),
        relevance: 0.85,
        hash: computeSignalHash("web", url, clean),
      };
    } catch (err) {
      console.error("[TavilySearchAdapter] Fetch error:", err);
      return null;
    }
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const start = Date.now();
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        ok: false,
        latencyMs: 0,
        message: "Tavily API key not configured in Integrations Vault (optional).",
        isConfigured: false,
      };
    }

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: "test",
          max_results: 1,
        }),
      });

      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "Tavily API operational" : `HTTP ${res.status}`,
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err.message || "Failed to reach Tavily API",
        isConfigured: true,
      };
    }
  }
}
