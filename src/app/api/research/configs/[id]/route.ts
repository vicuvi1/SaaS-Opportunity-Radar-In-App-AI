import { NextResponse } from "next/server";
import { localScheduler } from "@/lib/scheduler/local-scheduler";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const config = await localScheduler.getConfig(id);
    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }
    return NextResponse.json({ config });
  } catch (err) {
    console.error("[api/research/configs/[id]] GET error:", err);
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const config = await localScheduler.saveConfig({ ...body, id });
    return NextResponse.json({ config });
  } catch (err) {
    console.error("[api/research/configs/[id]] PUT error:", err);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const success = await localScheduler.deleteConfig(id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("[api/research/configs/[id]] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete config" }, { status: 500 });
  }
}

// POST to trigger this config immediately
export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await localScheduler.triggerNow(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/research/configs/[id]] trigger error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run scheduled config" },
      { status: 500 },
    );
  }
}
