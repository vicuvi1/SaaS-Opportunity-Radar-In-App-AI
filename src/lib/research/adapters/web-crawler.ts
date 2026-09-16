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

export class WebCrawlerAdapter implements SourceAdapter {
  id = "web-crawler";
  name = "Web Crawler & Extractor";
  sourceType = "web" as const;
  description = "HTTP-first crawler with HTML-to-markdown extraction and optional Firecrawl engine integration.";

  async isConfigured(): Promise<boolean> {
    // Always configured for HTTP extraction
    return true;
  }

  private async getFirecrawlKey(): Promise<string | null> {
    const creds = await getIntegrationCredentials(undefined, "firecrawl");
    return creds?.apiKey || process.env.FIRECRAWL_API_KEY || null;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    // WebCrawler primarily fetches and extracts specific URLs; search delegates to search engines
    return [];
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    const firecrawlKey = await this.getFirecrawlKey();

    // 1. If Firecrawl is configured, use its advanced markdown extractor
    if (firecrawlKey) {
      try {
        const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (fcRes.ok) {
          const fcData = await fcRes.json();
          const markdown = fcData?.data?.markdown || "";
          if (markdown) {
            const clean = cleanText(markdown);
            return {
              id: `fc-${Date.now()}`,
              sourceType: "web",
              sourceName: "Firecrawl Extractor",
              url,
              title: fcData?.data?.metadata?.title || url,
              collectedAt: new Date().toISOString(),
              content: clean,
              engagement: {},
              topic: "web_page",
              entities: extractCompetitorSignals(clean),
              painSignals: extractPainSignals(clean),
              commercialSignals: extractCommercialSignals(clean),
              competitorSignals: extractCompetitorSignals(clean),
              relevance: 0.85,
              hash: computeSignalHash("web", url, clean),
            };
          }
        }
      } catch (err) {
        console.warn("[WebCrawlerAdapter] Firecrawl scrape failed, falling back to HTTP:", err);
      }
    }

    // 2. HTTP-first native extractor
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return null;
      const html = await res.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;

      // Extract body text, removing script/style tags
      const bodyCleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");

      const clean = cleanText(bodyCleaned);

      return {
        id: `web-${Date.now()}`,
        sourceType: "web",
        sourceName: "HTTP Extractor",
        url,
        title,
        collectedAt: new Date().toISOString(),
        content: clean,
        engagement: {},
        topic: "web_page",
        entities: extractCompetitorSignals(clean),
        painSignals: extractPainSignals(clean),
        commercialSignals: extractCommercialSignals(clean),
        competitorSignals: extractCompetitorSignals(clean),
        relevance: 0.7,
        hash: computeSignalHash("web", url, clean),
      };
    } catch (err) {
      console.error(`[WebCrawlerAdapter] Failed to crawl ${url}:`, err);
      return null;
    }
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const firecrawlKey = await this.getFirecrawlKey();
    return {
      ok: true,
      latencyMs: 1,
      message: firecrawlKey
        ? "Web Crawler operational (Firecrawl API active)"
        : "Web Crawler operational (Native HTTP active)",
      isConfigured: true,
    };
  }
}
