import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { opportunitySourceSchema } from "@/lib/opportunities/schema";
import { verifyHermesOrUserAuth } from "@/lib/hermes/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await verifyHermesOrUserAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = opportunitySourceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid source data", issues: parseResult.error.format() },
        { status: 400 },
      );
    }

    const sourceData = {
      id: parseResult.data.id || `src-${Date.now().toString(36)}`,
      title: parseResult.data.title,
      url: parseResult.data.url,
      sourceType: parseResult.data.sourceType,
      date: parseResult.data.date,
      summary: parseResult.data.summary,
      evidenceRelevance: parseResult.data.evidenceRelevance,
      grading: parseResult.data.grading,
    };

    const updated = await opportunityStore.addSource(id, sourceData);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated, source: sourceData }, { status: 201 });
  } catch (error) {
    console.error("[api/opportunities/:id/sources] POST error:", error);
    return NextResponse.json({ error: "Failed to add source" }, { status: 500 });
  }
}
