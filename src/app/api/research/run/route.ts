import { NextResponse } from "next/server";
import { runResearch } from "@/lib/research/runner";

export const maxDuration = 120; // Allow sufficient time for multi-source scraping and LLM generation

export async function POST(req: Request) {
  try {
    // Optional cron secret check for scheduled runners
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const customHeader = req.headers.get("x-cron-secret");
      const passedSecret = bearerToken || customHeader;

      // Only enforce if request comes externally and secret is provided
      if (passedSecret && passedSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
      }
    }

    let body: { mode?: "quick" | "standard" | "deep"; topic?: string; niche?: string; configId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Allow empty body (defaults to quick mode)
    }

    const depth = body.mode === "deep" ? "deep" : "quick";
    const result = await runResearch({
      configId: body.configId,
      field: body.topic || body.niche || "B2B SaaS",
      depth,
    });

    return NextResponse.json({
      success: true,
      runId: result.runId,
      mode: depth,
      createdCount: result.opportunities.length,
      durationMs: result.stats.durationMs,
      stats: result.stats,
      opportunities: result.opportunities,
    });
  } catch (error) {
    console.error("[api/research/run] Execution error:", error);
    return NextResponse.json({ error: "Research pipeline failed to complete" }, { status: 500 });
  }
}
