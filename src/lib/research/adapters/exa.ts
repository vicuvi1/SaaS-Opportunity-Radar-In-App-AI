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

export class ExaSearchAdapter implements SourceAdapter {
  id = "exa";
  name = "Exa Neural Search";
  sourceType = "web" as const;
  description = "Semantic AI search discovering competitor companies, pricing models, and market positioning.";

  async isConfigured(): Promise<boolean> {
    const creds = await getIntegrationCredentials(undefined, "exa");
    if (creds && creds.apiKey) return true;
    if (process.env.EXA_API_KEY) return true;
    return false;
  }

  private async getApiKey(): Promise<string | null> {
    const creds = await getIntegrationCredentials(undefined, "exa");
    return creds?.apiKey || process.env.EXA_API_KEY || null;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    const apiKey = await this.getApiKey();
    if (!apiKey) return [];

    const limit = options.limit || 10;
    const signals: ResearchSignal[] = [];

    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          query,
          numResults: limit,
          useAutoprompt: true,
          contents: {
            text: { maxCharacters: 2000 },
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[ExaSearchAdapter] HTTP ${res.status} from Exa API.`);
        return [];
      }

      const data = await res.json();
      const results = data.results || [];

      for (const item of results) {
        const title = item.title || "";
        const text = item.text || "";
        const cleanContent = cleanText(text);
        const url = item.url || "";

        const pain = extractPainSignals(cleanContent);
        const commercial = extractCommercialSignals(cleanContent);
        const competitors = extractCompetitorSignals(cleanContent);

        const hash = computeSignalHash(this.sourceType, url, cleanContent);

        signals.push({
          id: `ex-${hash.slice(0, 12)}`,
          sourceType: "web",
          sourceName: "Exa Neural Search",
          url,
          title,
          author: item.author,
          publishedAt: item.publishedDate,
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
          relevance: item.score || 0.75,
          hash,
        });
      }
    } catch (err) {
      console.error("[ExaSearchAdapter] Search error:", err);
    }

    return signals;
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    return null;
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const start = Date.now();
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        ok: false,
        latencyMs: 0,
        message: "Exa API key not configured in Integrations Vault (optional).",
        isConfigured: false,
      };
    }

    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          query: "saas",
          numResults: 1,
        }),
      });

      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "Exa API operational" : `HTTP ${res.status}`,
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err.message || "Failed to reach Exa API",
        isConfigured: true,
      };
    }
  }
}
