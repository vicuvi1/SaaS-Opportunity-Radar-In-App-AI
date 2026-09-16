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

export class ProductHuntAdapter implements SourceAdapter {
  id = "producthunt";
  name = "Product Hunt API";
  sourceType = "producthunt" as const;
  description = "Tracks newly launched products, category velocity, and competitive feature sets.";

  async isConfigured(): Promise<boolean> {
    const creds = await getIntegrationCredentials(undefined, "producthunt");
    if (creds && (creds.token || creds.apiKey)) return true;
    if (process.env.PRODUCT_HUNT_TOKEN) return true;
    return false;
  }

  private async getAuthToken(): Promise<string | null> {
    const creds = await getIntegrationCredentials(undefined, "producthunt");
    return creds?.token || creds?.apiKey || process.env.PRODUCT_HUNT_TOKEN || null;
  }

  async search(query: string, options: AdapterSearchOptions = {}): Promise<ResearchSignal[]> {
    const limit = options.limit || 10;
    const token = await this.getAuthToken();
    if (!token) {
      return [];
    }

    const signals: ResearchSignal[] = [];
    const graphqlQuery = `
      query SearchPosts($query: String!) {
        posts(order: VOTES, search: $query, first: ${limit}) {
          edges {
            node {
              id
              name
              tagline
              description
              url
              votesCount
              commentsCount
              createdAt
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "SaaSOpportunityRadar/2.0",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { query },
        }),
      });

      if (!res.ok) {
        console.warn(`[ProductHuntAdapter] HTTP ${res.status} from Product Hunt.`);
        return [];
      }

      const data = await res.json();
      const edges = data?.data?.posts?.edges || [];

      for (const edge of edges) {
        const post = edge.node;
        if (!post) continue;

        const combined = `${post.name}: ${post.tagline}\n\n${post.description || ""}`;
        const cleanContent = cleanText(combined);

        const pain = extractPainSignals(cleanContent);
        const commercial = extractCommercialSignals(cleanContent);
        const competitors = [post.name, ...extractCompetitorSignals(cleanContent)];

        const hash = computeSignalHash(this.sourceType, post.url, cleanContent);

        signals.push({
          id: `ph-${post.id}`,
          sourceType: "producthunt",
          sourceName: "Product Hunt",
          url: post.url,
          title: `${post.name} - ${post.tagline}`,
          publishedAt: post.createdAt,
          collectedAt: new Date().toISOString(),
          content: cleanContent,
          engagement: {
            upvotes: post.votesCount || 0,
            commentsCount: post.commentsCount || 0,
            score: post.votesCount || 0,
          },
          topic: query,
          entities: competitors,
          painSignals: pain,
          commercialSignals: commercial,
          competitorSignals: competitors,
          relevance: 0.7,
          hash,
        });
      }
    } catch (err) {
      console.error("[ProductHuntAdapter] Search error:", err);
    }

    return signals;
  }

  async fetch(url: string): Promise<ResearchSignal | null> {
    // Product Hunt post fetching via GraphQL
    return null;
  }

  async healthCheck(): Promise<SourceAdapterHealth> {
    const start = Date.now();
    const token = await this.getAuthToken();
    if (!token) {
      return {
        ok: false,
        latencyMs: 0,
        message: "Product Hunt API token not configured in Integrations Vault.",
        isConfigured: false,
      };
    }

    try {
      const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: "{ viewer { user { id name } } }",
        }),
      });

      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "Product Hunt API operational" : `HTTP ${res.status}`,
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err.message || "Failed to reach Product Hunt API",
        isConfigured: true,
      };
    }
  }
}
