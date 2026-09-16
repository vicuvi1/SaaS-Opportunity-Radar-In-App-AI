import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
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

    if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    const updated = await opportunityStore.addNote(id, body.content.trim());
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated, note: updated.notes[0] }, { status: 201 });
  } catch (error) {
    console.error("[api/opportunities/:id/notes] POST error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
