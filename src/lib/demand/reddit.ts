import type { RawDemandSnippet } from "./types";
import { getIntegrationCredentials } from "@/lib/integrations/vault";

const UA = `FounderHQ/1.0 (+${process.env.NEXT_PUBLIC_URL ?? "https://founderhq.app"}; startup validation research bot)`;

export async function fetchRedditSignals(query: string, userId?: string): Promise<RawDemandSnippet[]> {
  const q = encodeURIComponent(query.trim());

  // Check vault for authenticated OAuth token
  const creds = await getIntegrationCredentials<{
    accessToken?: string;
  }>(userId, "reddit").catch(() => null);

  const headers: Record<string, string> = { "User-Agent": UA };
  let url = `https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=20&t=all`;

  if (creds?.accessToken) {
    url = `https://oauth.reddit.com/search?q=${q}&sort=relevance&limit=20&t=all`;
    headers.Authorization = `Bearer ${creds.accessToken}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error(`[reddit] HTTP ${res.status}`);
      // If oauth failed with 401, retry once without oauth
      if (res.status === 401 && creds?.accessToken) {
        const fallbackRes = await fetch(`https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=20&t=all`, {
          headers: { "User-Agent": UA },
          next: { revalidate: 0 },
        });
        if (!fallbackRes.ok) return [];
        return parseRedditJson(await fallbackRes.json());
      }
      return [];
    }

    const data = await res.json();
    return parseRedditJson(data);
  } catch (e) {
    console.error("[reddit] fetch error:", e);
    return [];
  }
}

function parseRedditJson(data: any): RawDemandSnippet[] {
  const children = data?.data?.children ?? [];
  const out: RawDemandSnippet[] = [];

  for (const c of children) {
    const d = c.data;
    if (!d) continue;
    const text = [d.title, d.selftext].filter(Boolean).join("\n").trim();
    if (text.length < 24) continue;
    const link = d.permalink
      ? `https://www.reddit.com${d.permalink}`
      : d.url;
    out.push({
      source: "reddit",
      title: d.title,
      text: text.slice(0, 1200),
      url: link,
      score: d.score,
    });
  }

  return out;
}
