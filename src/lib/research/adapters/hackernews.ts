import type {
  SourceAdapter,
  ResearchSignal,
  AdapterSearchOptions,
  SourceAdapterHealth,
} from "./types";
import {
  computeSignalHash,
  extractPainSignals,
  extractCommercialSignals,
  extractCompetitorSignals,
  cleanText,
} from "./signal-utils";

export class HackerNewsAdapter implements SourceAdapter {
  id = "hackernews";
  name = "Hacker News API";
  sourceType = "hackernews" as const;
  description = "Searches developer discussions, Show HN, Ask HN, and tech trend debates via Algolia & Firebase HN API.";

  async isConfigured(): Promise<boolean> {
    // Public API, always available
    return true;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    const limit = options.limit || 15;
    const signals: ResearchSignal[] = [];

    // Query HN Algolia API for stories, Ask HN, Show HN
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
      query,
    )}&tags=(story,ask_hn,show_hn)&hitsPerPage=${limit}`;

    try {
      const res = await fetch(searchUrl);
      if (!res.ok) {
        console.warn(`[HackerNewsAdapter] HTTP ${res.status} from HN Algolia.`);
        return [];
      }

      const data = await res.json();
      const hits = data.hits || [];

      for (const hit of hits) {
        const title = hit.title || "";
        const storyText = hit.story_text || "";
        const combined = `${title}\n\n${storyText}`;
        const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const cleanContent = cleanText(combined);

        const pain = extractPainSignals(cleanContent);
        const commercial = extractCommercialSignals(cleanContent);
        const competitors = extractCompetitorSignals(cleanContent);

        let relevance = 0.5;
        if (pain.length > 0) relevance += 0.2;
        if (commercial.length > 0) relevance += 0.15;
        if ((hit.points || 0) > 50) relevance += 0.15;
        relevance = Math.min(1.0, relevance);

        const hash = computeSignalHash(this.sourceType, url, cleanContent);

        signals.push({
          id: `hn-${hit.objectID}`,
          sourceType: "hackernews",
          sourceName: "Hacker News",
          url,
          title,
          author: hit.author,
          publishedAt: hit.created_at,
          collectedAt: new Date().toISOString(),
          content: cleanContent,
          engagement: {
            upvotes: hit.points || 0,
            commentsCount: hit.num_comments || 0,
            score: hit.points || 0,
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
      console.error("[HackerNewsAdapter] Search error:", err);
    }

    return signals;
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    try {
      const idMatch = url.match(/id=(\d+)/);
      if (!idMatch) return null;
      const itemId = idMatch[1];

      const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`);
      if (!res.ok) return null;

      const item = await res.json();
      if (!item) return null;

      const text = `${item.title || ""}\n\n${item.text || ""}`;
      const clean = cleanText(text);

      return {
        id: `hn-${item.id}`,
        sourceType: "hackernews",
        sourceName: "Hacker News",
        url: item.url || url,
        title: item.title || "Untitled",
        author: item.by,
        publishedAt: item.time ? new Date(item.time * 1000).toISOString() : undefined,
        collectedAt: new Date().toISOString(),
        content: clean,
        engagement: {
          upvotes: item.score || 0,
          commentsCount: item.descendants || 0,
          score: item.score || 0,
        },
        topic: "tech",
        entities: extractCompetitorSignals(clean),
        painSignals: extractPainSignals(clean),
        commercialSignals: extractCommercialSignals(clean),
        competitorSignals: extractCompetitorSignals(clean),
        relevance: 0.8,
        hash: computeSignalHash("hackernews", url, clean),
      };
    } catch (err) {
      console.error("[HackerNewsAdapter] Fetch error:", err);
      return null;
    }
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const start = Date.now();
    try {
      const res = await fetch("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=1");
      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "Hacker News API operational" : `HTTP ${res.status}`,
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err.message || "Failed to reach Hacker News API",
        isConfigured: false,
      };
    }
  }
}
