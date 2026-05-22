import type { RawDemandSnippet } from "./types";
import { stripHtml } from "./strip-html";

const TOKEN_URL = "https://api.producthunt.com/v2/oauth/token";
const GQL_URL   = "https://api.producthunt.com/v2/api/graphql";

// Module-level token cache — tokens last ~2h
let tokenCache: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId     = process.env.PRODUCT_HUNT_CLIENT_ID;
  const clientSecret = process.env.PRODUCT_HUNT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        redirect_uri: "https://localhost",
      }),
    });
    if (!res.ok) { console.error(`[producthunt] token HTTP ${res.status}`); return null; }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    tokenCache = {
      value: data.access_token,
      expiresAt: Date.now() + ((data.expires_in ?? 7200) - 60) * 1000,
    };
    return tokenCache.value;
  } catch (e) {
    console.error("[producthunt] token error:", e);
    return null;
  }
}

async function gql<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 0 },
    });
    if (!res.ok) { console.error(`[producthunt] HTTP ${res.status}`); return null; }
    const json = (await res.json()) as { data?: T; errors?: Array<{ message?: string }> };
    if (json.errors?.length) {
      console.error("[producthunt] GQL errors:", json.errors.map(e => e.message).join("; "));
      return null;
    }
    return json.data ?? null;
  } catch (e) {
    console.error("[producthunt] gql error:", e);
    return null;
  }
}

// Require word to match a complete hyphen-segment of the slug (or vice versa).
// Prevents short words like "ctr", "api", "tab" from accidentally matching
// longer slugs via substring (e.g. "ctr" inside "ele-ctr-ic-cars").
function slugMatchesWord(slug: string, word: string): boolean {
  if (word.length < 3) return false;
  if (slug === word) return true;
  const segments = slug.split("-");
  return segments.some(seg => seg === word || seg.startsWith(word) || word.startsWith(seg));
}

// Hardcoded fallbacks for keywords with no exact PH topic slug.
// Only entries confirmed to exist via introspection.
const FALLBACK: Record<string, string> = {
  shopify:      "e-commerce",
  ecommerce:    "e-commerce",
  store:        "e-commerce",
  woocommerce:  "e-commerce",
  scheduling:   "calendar",
  calendar:     "calendar",
  booking:      "calendar",
  recruiting:   "hiring",
  startup:      "saas",
  b2b:          "saas",
  subscription: "saas",
  poker:        "games",
  gaming:       "games",
  discord:      "developer-tools",
  ai:           "developer-tools",
  llm:          "developer-tools",
  gpt:          "developer-tools",
  openai:       "developer-tools",
  chatgpt:      "developer-tools",
  chrome:       "browser-extensions",
  browser:      "browser-extensions",
  extension:    "browser-extensions",
  figma:        "design",
};

// Resolve up to 2 topic slugs from the search query using a SINGLE batched GQL call.
// Words in the fallback map are resolved instantly with no API call.
async function resolveTopicSlugs(token: string, query: string): Promise<string[]> {
  const words = query.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/).filter(Boolean);
  const found: string[] = [];
  const seen  = new Set<string>();
  const toApi: string[] = [];

  for (const word of words) {
    if (found.length >= 2) break;
    const fallback = FALLBACK[word];
    if (fallback && !seen.has(fallback)) {
      found.push(fallback);
      seen.add(fallback);
    } else if (!FALLBACK[word]) {
      toApi.push(word);
    }
  }

  // If we still need more slugs and have words to query, batch ALL of them in one GQL call
  if (found.length < 2 && toApi.length > 0) {
    const wordsToQuery = toApi.slice(0, 4); // max 4 aliases
    const aliases = wordsToQuery
      .map((w, i) => `w${i}: topics(query: "${w}", first: 1) { edges { node { slug } } }`)
      .join("\n");
    const data = await gql<Record<string, { edges: Array<{ node: { slug: string } }> }>>(
      token,
      `query { ${aliases} }`,
    );

    if (data) {
      for (let i = 0; i < wordsToQuery.length; i++) {
        if (found.length >= 2) break;
        const word = wordsToQuery[i];
        const slug = data[`w${i}`]?.edges[0]?.node.slug ?? "";
        if (slug && !seen.has(slug) && slugMatchesWord(slug, word)) {
          found.push(slug);
          seen.add(slug);
        }
      }
    }
  }

  return found;
}

// Fetch posts + top comments for up to 2 topic slugs in a SINGLE batched GQL call.
type PostNode = {
  name: string;
  tagline: string;
  description?: string;
  url: string;
  votesCount: number;
  comments: { edges: Array<{ node: { body: string; url: string; votesCount: number } }> };
};

async function fetchPostsForSlugs(token: string, slugs: string[]): Promise<PostNode[]> {
  if (slugs.length === 0) return [];

  const aliases = slugs
    .map((s, i) => `
      t${i}: posts(topic: "${s}", first: 6, order: VOTES) {
        edges {
          node {
            name tagline description url votesCount
            comments(first: 5, order: VOTES_COUNT) {
              edges { node { body url votesCount } }
            }
          }
        }
      }
    `)
    .join("\n");

  const data = await gql<Record<string, { edges: Array<{ node: PostNode }> }>>(
    token,
    `query { ${aliases} }`,
  );

  if (!data) return [];

  const posts: PostNode[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (const edge of data[`t${i}`]?.edges ?? []) {
      if (edge.node) posts.push(edge.node);
    }
  }
  return posts;
}

export async function fetchProductHuntSignals(query: string): Promise<RawDemandSnippet[]> {
  const token = await getAccessToken();
  if (!token) {
    console.warn("[producthunt] skipped — credentials not set");
    return [];
  }

  // 1 API call for topic resolution (batched), 1 API call for all posts (batched)
  // Total: 2 GQL calls per validation (plus 1 for token if cache miss)
  const slugs = await resolveTopicSlugs(token, query);

  if (slugs.length === 0) {
    console.log("[producthunt] no matching topics for query");
    return [];
  }

  const posts = await fetchPostsForSlugs(token, slugs);
  const out: RawDemandSnippet[] = [];

  for (const post of posts) {
    const postText = [post.name, post.tagline, post.description].filter(Boolean).join(" — ");
    if (postText.length >= 20) {
      out.push({
        source: "producthunt",
        title: post.name,
        text: postText.slice(0, 800),
        url: post.url,
        score: post.votesCount,
      });
    }
    for (const ce of post.comments?.edges ?? []) {
      const body = stripHtml(ce.node?.body ?? "").trim();
      if (body.length < 30) continue;
      out.push({
        source: "producthunt",
        title: `Comment on: ${post.name}`,
        text: body.slice(0, 1200),
        url: ce.node?.url ?? post.url,
        score: ce.node?.votesCount,
      });
    }
  }

  console.log(`[producthunt] topics=${slugs.join(",")} posts=${posts.length} snippets=${out.length}`);
  return out;
}
