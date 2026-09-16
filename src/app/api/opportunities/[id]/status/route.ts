import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { opportunityStatusSchema } from "@/lib/opportunities/schema";
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

    const parseResult = opportunityStatusSchema.safeParse(body.status);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid status value",
          validStatuses: opportunityStatusSchema.options,
        },
        { status: 400 },
      );
    }

    const updated = await opportunityStore.updateStatus(id, parseResult.data);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    console.error("[api/opportunities/:id/status] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
