import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { exportOpportunityToObsidian, getObsidianFilePath } from "@/lib/obsidian/export";

export async function GET() {
  try {
    const opportunities = await opportunityStore.list();

    const exports = opportunities.map((opp) => {
      const { filename, fullPath } = getObsidianFilePath(opp);
      return {
        id: opp.id,
        title: opp.title,
        status: opp.status,
        aiPriority: opp.aiPriority,
        filename,
        suggestedPath: fullPath,
        markdown: exportOpportunityToObsidian(opp),
      };
    });

    return NextResponse.json({
      count: exports.length,
      exportedAt: new Date().toISOString(),
      files: exports,
    });
  } catch (error) {
    console.error("[api/opportunities/export/obsidian-all] GET error:", error);
    return NextResponse.json({ error: "Failed to export opportunities" }, { status: 500 });
  }
}
