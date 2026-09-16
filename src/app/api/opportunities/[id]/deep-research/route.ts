import { NextResponse } from "next/server";
import { runDeepResearch } from "@/lib/research/deep-research";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }

    const vaultPath = body?.vaultPath || undefined;

    const result = await runDeepResearch(id, vaultPath);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/deep-research] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run deep research" },
      { status: 500 },
    );
  }
}
