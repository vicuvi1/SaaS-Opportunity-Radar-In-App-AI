import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { researchRunsTable } from "@/lib/db/schema";
import { runResearch } from "@/lib/research/runner";

export async function GET() {
  try {
    const runs = db
      .select()
      .from(researchRunsTable)
      .orderBy(desc(researchRunsTable.createdAt))
      .limit(30)
      .all();
    return NextResponse.json({ runs });
  } catch (err) {
    console.error("[api/research/runs] GET error:", err);
    return NextResponse.json({ error: "Failed to list research runs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await runResearch({
      configId: body.configId,
      field: body.field,
      customField: body.customField,
      depth: body.depth || "quick",
      targetIdeaCount: body.targetIdeaCount || 10,
      minQualityThreshold: body.minQualityThreshold || 60,
      sources: body.sources,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[api/research/runs] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute research run" },
      { status: 500 },
    );
  }
}
