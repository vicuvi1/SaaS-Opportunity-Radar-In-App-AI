import { generateText } from "ai";
import { getQueryModel } from "@/lib/ai/model";

// Strip a leading "ProductName:" or "ProductName -" prefix that founders often include
// as their idea title — it's not a real searchable term.
function stripIdeaName(topic: string): string {
  return topic.replace(/^[A-Z][A-Za-z0-9]+\s*[:–-]\s*/, "").trim();
}

export async function extractSearchQuery(topic: string): Promise<string> {
  const cleanedTopic = stripIdeaName(topic);
  try {
    const { text } = await generateText({
      model: getQueryModel(),
      system: "Extract 3-4 keywords to search Reddit, Hacker News, and GitHub for real user complaints about this problem. The search requires ALL keywords to appear in the same post, so fewer broader terms return more results - 3-4 is the limit. Keep real existing platforms, technologies, and domain terms that frustrated users would actually write (e.g. 'Shopify', 'React', 'Kubernetes', 'poker', 'invoicing'). DO NOT use the name of the idea or product being described — that name is invented and will not appear in any forum post. Use the underlying domain, workflow, and problem terms instead. Avoid ALL generic words: app, build, create, tool, platform, software, make, want, need, solution, service, system, product, detection, alert, journaling, tracker. Output ONLY the keywords space-separated, no punctuation, no explanation.",
      prompt: cleanedTopic.slice(0, 600),
      maxOutputTokens: 20,
      temperature: 0.3,
    });
    const STRIP = new Set(["app","tool","platform","software","service","solution","system","product","build","create","make","want","need"]);
    const words = text.trim().replace(/[^a-z0-9\s]/gi, " ").split(/\s+/).filter(Boolean).filter(w => !STRIP.has(w.toLowerCase())).slice(0, 4);
    if (words.length > 0) return words.join(" ");
  } catch {
    // fall through to simple fallback
  }
  return cleanedTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(" ");
}
