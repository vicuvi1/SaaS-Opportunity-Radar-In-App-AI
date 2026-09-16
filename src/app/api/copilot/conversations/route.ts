import { NextResponse } from "next/server";
import { conversationStore, type CopilotConversation } from "@/lib/copilot/conversation-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId") || undefined;
    const conversations = await conversationStore.list(opportunityId);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[api/copilot/conversations] GET error:", error);
    return NextResponse.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CopilotConversation>;
    if (body.id) {
      const updated = await conversationStore.save(body as CopilotConversation);
      return NextResponse.json({ conversation: updated });
    }
    const created = await conversationStore.create(body);
    return NextResponse.json({ conversation: created }, { status: 201 });
  } catch (error) {
    console.error("[api/copilot/conversations] POST error:", error);
    return NextResponse.json({ error: "Failed to save conversation" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }
    const success = await conversationStore.delete(id);
    return NextResponse.json({ success, id });
  } catch (error) {
    console.error("[api/copilot/conversations] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
