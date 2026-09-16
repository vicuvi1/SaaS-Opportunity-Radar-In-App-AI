import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { formatTelegramDigest, sendOpportunitiesToTelegram } from "@/lib/telegram/dispatch";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const opportunityIds: string[] = body.opportunityIds || [];
    const previewOnly = Boolean(body.previewOnly);
    const customChatId = body.customChatId || undefined;

    if (opportunityIds.length === 0) {
      return NextResponse.json(
        { error: "No opportunity IDs provided" },
        { status: 400 },
      );
    }

    // Fetch opportunities from store
    const all = await opportunityStore.list();
    const selected = all.filter((o) => opportunityIds.includes(o.id));

    if (selected.length === 0) {
      return NextResponse.json(
        { error: "None of the selected opportunities were found" },
        { status: 404 },
      );
    }

    if (previewOnly) {
      const previewText = formatTelegramDigest(selected);
      return NextResponse.json({ previewText, count: selected.length });
    }

    const result = await sendOpportunitiesToTelegram(selected, customChatId);
    if (!result.success) {
      return NextResponse.json({ error: result.error, previewText: result.previewText }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/telegram/dispatch] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to dispatch to Telegram" },
      { status: 500 },
    );
  }
}
