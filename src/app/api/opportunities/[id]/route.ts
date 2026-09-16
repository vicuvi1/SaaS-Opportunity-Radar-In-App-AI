import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { verifyHermesOrUserAuth } from "@/lib/hermes/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const opp = await opportunityStore.get(id);

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: opp });
  } catch (error) {
    console.error("[api/opportunities/:id] GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve opportunity" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await verifyHermesOrUserAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await opportunityStore.update(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    console.error("[api/opportunities/:id] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const auth = await verifyHermesOrUserAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await opportunityStore.delete(id);

    if (!success) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[api/opportunities/:id] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
}
