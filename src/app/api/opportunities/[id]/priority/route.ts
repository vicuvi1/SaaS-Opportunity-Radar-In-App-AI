import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { aiPrioritySchema, aiConfidenceSchema } from "@/lib/opportunities/schema";
import { verifyHermesOrUserAuth } from "@/lib/hermes/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await verifyHermesOrUserAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const priorityParse = aiPrioritySchema.safeParse(body.aiPriority);
    if (!priorityParse.success) {
      return NextResponse.json(
        { error: "Invalid AI priority value", valid: aiPrioritySchema.options },
        { status: 400 },
      );
    }

    const confidence = body.aiConfidence ? aiConfidenceSchema.safeParse(body.aiConfidence).data : undefined;
    const reasons = Array.isArray(body.aiPriorityReasons) ? body.aiPriorityReasons.map(String) : undefined;

    const updated = await opportunityStore.updatePriority(
      id,
      priorityParse.data,
      reasons,
      confidence,
    );

    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    console.error("[api/opportunities/:id/priority] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update priority" }, { status: 500 });
  }
}
