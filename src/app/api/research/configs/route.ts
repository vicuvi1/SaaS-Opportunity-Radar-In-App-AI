import { NextResponse } from "next/server";
import { localScheduler } from "@/lib/scheduler/local-scheduler";

export async function GET() {
  try {
    const configs = await localScheduler.listConfigs();
    return NextResponse.json({ configs });
  } catch (err) {
    console.error("[api/research/configs] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list research configs" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = await localScheduler.saveConfig(body);
    return NextResponse.json({ config }, { status: 201 });
  } catch (err) {
    console.error("[api/research/configs] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save research config" },
      { status: 500 },
    );
  }
}
