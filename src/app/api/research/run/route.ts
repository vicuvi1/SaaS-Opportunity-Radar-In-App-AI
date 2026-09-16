import { NextResponse } from "next/server";
import { runOpportunityResearchPipeline } from "@/lib/research/pipeline";

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

    let body: { mode?: "quick" | "deep"; topic?: string; niche?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Allow empty body (defaults to quick mode)
    }

    const mode = body.mode === "deep" ? "deep" : "quick";
    const result = await runOpportunityResearchPipeline({
      mode,
      topic: body.topic,
      niche: body.niche,
    });

    return NextResponse.json({
      success: true,
      mode: result.stats.mode,
      createdCount: result.opportunities.length,
      durationMs: result.stats.durationMs,
      opportunities: result.opportunities,
    });
  } catch (error) {
    console.error("[api/research/run] Execution error:", error);
    return NextResponse.json({ error: "Research pipeline failed to complete" }, { status: 500 });
  }
}
