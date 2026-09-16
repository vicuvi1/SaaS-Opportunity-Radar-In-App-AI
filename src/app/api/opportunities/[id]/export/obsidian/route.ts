import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { exportOpportunityToObsidian, getObsidianFilePath } from "@/lib/obsidian/export";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const opp = await opportunityStore.get(id);

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const markdown = exportOpportunityToObsidian(opp);
    const { filename, fullPath } = getObsidianFilePath(opp);

    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") === "true";
    const asJson = searchParams.get("format") === "json";

    if (asJson) {
      return NextResponse.json({
        id: opp.id,
        title: opp.title,
        filename,
        suggestedPath: fullPath,
        markdown,
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("X-Obsidian-Filename", filename);
    headers.set("X-Obsidian-Path", fullPath);

    if (download) {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    return new Response(markdown, { status: 200, headers });
  } catch (error) {
    console.error("[api/opportunities/:id/export/obsidian] GET error:", error);
    return NextResponse.json({ error: "Failed to export opportunity" }, { status: 500 });
  }
}
