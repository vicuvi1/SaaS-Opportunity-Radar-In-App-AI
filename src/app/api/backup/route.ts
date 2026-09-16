import fs from "fs";
import { NextResponse } from "next/server";
import { db, DB_PATH } from "@/lib/db";
import {
  opportunitiesTable,
  opportunityNotesTable,
  opportunitySourcesTable,
  researchConfigsTable,
  researchRunsTable,
  aiConversationsTable,
} from "@/lib/db/schema";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "json";

    if (type === "db") {
      if (!fs.existsSync(DB_PATH)) {
        return NextResponse.json({ error: "Database file not found" }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(DB_PATH);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="startup-radar-${Date.now()}.db"`,
        },
      });
    }

    // JSON export
    const opportunities = db.select().from(opportunitiesTable).all();
    const notes = db.select().from(opportunityNotesTable).all();
    const sources = db.select().from(opportunitySourcesTable).all();
    const configs = db.select().from(researchConfigsTable).all();
    const runs = db.select().from(researchRunsTable).all();
    const conversations = db.select().from(aiConversationsTable).all();

    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      counts: {
        opportunities: opportunities.length,
        notes: notes.length,
        sources: sources.length,
        configs: configs.length,
        runs: runs.length,
        conversations: conversations.length,
      },
      data: {
        opportunities,
        notes,
        sources,
        configs,
        runs,
        conversations,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="saas-radar-backup-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    console.error("[api/backup] GET error:", err);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
