import fs from "fs";
import path from "path";
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const vaultPath = body?.vaultPath;

    if (!vaultPath) {
      return NextResponse.json(
        { error: "Vault directory path is required" },
        { status: 400 },
      );
    }

    if (!fs.existsSync(vaultPath)) {
      return NextResponse.json(
        { error: `Vault directory "${vaultPath}" does not exist on this machine` },
        { status: 404 },
      );
    }

    const opportunities = await opportunityStore.list();
    let writtenCount = 0;

    for (const opp of opportunities) {
      const { folder, filename } = getObsidianFilePath(opp);
      const targetDir = path.join(vaultPath, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const filePath = path.join(targetDir, filename);
      const md = exportOpportunityToObsidian(opp);
      fs.writeFileSync(filePath, md, "utf-8");
      writtenCount++;
    }

    return NextResponse.json({
      success: true,
      writtenCount,
      vaultPath,
    });
  } catch (error) {
    console.error("[api/opportunities/export/obsidian-all] POST error:", error);
    return NextResponse.json({ error: "Failed to sync to Obsidian vault" }, { status: 500 });
  }
}
