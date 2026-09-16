export type SignalSourceType =
  | "reddit"
  | "hackernews"
  | "github"
  | "producthunt"
  | "web"
  | "reviews"
  | "competitor";

export interface ResearchSignal {
  id: string; // SHA-256 or unique identifier
  sourceType: SignalSourceType;
  sourceName: string; // e.g. "r/saas", "HN Algolia", "GitHub Issues"
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  collectedAt: string;
  content: string; // Clean text / markdown
  engagement: {
    upvotes?: number;
    commentsCount?: number;
    shares?: number;
    score?: number;
  };
  topic: string;
  entities: string[]; // Companies, products, tools detected
  painSignals: string[]; // Explicit complaints or friction points
  commercialSignals: string[]; // Budget, pricing mentions, willingness to pay
  competitorSignals: string[]; // Mentions of existing alternatives
  relevance: number; // 0.0 - 1.0 calibrated relevance score
  hash: string; // For deduplication
}

export interface AdapterSearchOptions {
  limit?: number;
  industry?: string;
  sinceDays?: number;
  includeComments?: boolean;
  searchType?: "keyword" | "semantic" | "pain_focused";
}

export interface SourceAdapterHealth {
  ok: boolean;
  latencyMs?: number;
  message?: string;
  isConfigured: boolean;
}

export interface SourceAdapter {
  id: string;
  name: string;
  sourceType: SignalSourceType;
  description: string;
  isConfigured(): Promise<boolean>;
  search(query: string, options?: AdapterSearchOptions): Promise<ResearchSignal[]>;
  fetch(url: string): Promise<ResearchSignal | null>;
  healthCheck(): Promise<SourceAdapterHealth>;
}
