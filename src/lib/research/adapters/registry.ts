import type {
  SourceAdapter,
  ResearchSignal,
  AdapterSearchOptions,
  SourceAdapterHealth,
} from "./types";
import { RedditApiAdapter } from "./reddit";
import { HackerNewsAdapter } from "./hackernews";
import { GitHubAdapter } from "./github";
import { ProductHuntAdapter } from "./producthunt";
import { TavilySearchAdapter } from "./tavily";
import { ExaSearchAdapter } from "./exa";
import { WebCrawlerAdapter } from "./web-crawler";

class SourceAdapterRegistry {
  private adapters: Map<string, SourceAdapter> = new Map();

  constructor() {
    this.register(new RedditApiAdapter());
    this.register(new HackerNewsAdapter());
    this.register(new GitHubAdapter());
    this.register(new ProductHuntAdapter());
    this.register(new TavilySearchAdapter());
    this.register(new ExaSearchAdapter());
    this.register(new WebCrawlerAdapter());
  }

  register(adapter: SourceAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(id: string): SourceAdapter | undefined {
    return this.adapters.get(id);
  }

  getAllAdapters(): SourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  async getConfiguredAdapters(): Promise<SourceAdapter[]> {
    const list: SourceAdapter[] = [];
    for (const adapter of this.adapters.values()) {
      if (await adapter.isConfigured()) {
        list.push(adapter);
      }
    }
    return list;
  }

  async checkHealthAll(): Promise<Record<string, SourceAdapterHealth>> {
    const results: Record<string, SourceAdapterHealth> = {};
    for (const [id, adapter] of this.adapters.entries()) {
      try {
        results[id] = await adapter.healthCheck();
      } catch (err: any) {
        results[id] = {
          ok: false,
          message: err.message || "Health check failed",
          isConfigured: false,
        };
      }
    }
    return results;
  }

  /**
   * Dispatches search across configured adapters concurrently with resilient failure handling.
   * If an individual adapter fails or times out, the remaining adapters return their signals safely.
   */
  async searchAllSources(
    query: string,
    options: AdapterSearchOptions & { sourceIds?: string[] } = {},
  ): Promise<{
    signals: ResearchSignal[];
    successfulSources: string[];
    failedSources: Array<{ id: string; error: string }>;
  }> {
    const allAdapters = await this.getConfiguredAdapters();
    const targetAdapters = options.sourceIds && options.sourceIds.length > 0
      ? allAdapters.filter((a) => options.sourceIds!.includes(a.id))
      : allAdapters;

    const successfulSources: string[] = [];
    const failedSources: Array<{ id: string; error: string }> = [];
    const signals: ResearchSignal[] = [];

    const tasks = targetAdapters.map(async (adapter) => {
      // Don't search WebCrawler directly (it's used for URL extraction)
      if (adapter.id === "web-crawler") return;

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Adapter timeout after 10s")), 10000),
        );
        const res = await Promise.race([adapter.search(query, options), timeoutPromise]);
        if (res && res.length > 0) {
          signals.push(...res);
          successfulSources.push(adapter.id);
        }
      } catch (err: any) {
        console.warn(`[SourceAdapterRegistry] Adapter ${adapter.id} error:`, err.message);
        failedSources.push({ id: adapter.id, error: err.message || "Search failed" });
      }
    });

    await Promise.allSettled(tasks);

    return {
      signals,
      successfulSources,
      failedSources,
    };
  }
}

export const adapterRegistry = new SourceAdapterRegistry();
