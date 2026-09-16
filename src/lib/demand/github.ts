import type { RawDemandSnippet } from "./types";
import { stripHtml } from "./strip-html";
import { getIntegrationCredentials } from "@/lib/integrations/vault";

const UA = `FounderHQ/1.0 (+${process.env.NEXT_PUBLIC_URL ?? "https://founderhq.fyi"}; startup validation research bot)`;

export async function fetchGithubSignals(query: string, userId?: string): Promise<RawDemandSnippet[]> {
  const q = encodeURIComponent(`${query.trim()} type:issue`);
  const url = `https://api.github.com/search/issues?q=${q}&per_page=15&sort=reactions&order=desc`;

  try {
    const creds = await getIntegrationCredentials<{ token?: string }>(userId, "github").catch(() => null);
    const token = creds?.token || process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
      "User-Agent": UA,
      Accept: "application/vnd.github+json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }
    const res = await fetch(url, {
      headers,
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error(`[github] HTTP ${res.status}`, await res.text().catch(() => ""));
      return [];
    }

    const data = (await res.json()) as {
      items?: Array<{
        title?: string;
        body?: string;
        html_url?: string;
        reactions?: { total_count?: number };
      }>;
    };

    console.log(`[github] raw items: ${data.items?.length ?? 0}`);
    const out: RawDemandSnippet[] = [];
    for (const item of data.items ?? []) {
      const body = item.body ? stripHtml(item.body).slice(0, 800) : "";
      const text = [item.title, body].filter(Boolean).join("\n").trim();
      if (text.length < 24) continue;
      out.push({
        source: "github",
        title: item.title,
        text: text.slice(0, 1200),
        url: item.html_url,
        score: item.reactions?.total_count,
      });
    }
    return out;
  } catch (e) {
    console.error("[github] fetch threw:", e);
    return [];
  }
}
