import { NextResponse } from "next/server";
import { opportunityStore, type OpportunityFilters } from "@/lib/opportunities/store";
import { createOpportunityInputSchema } from "@/lib/opportunities/schema";
import { verifyHermesOrUserAuth } from "@/lib/hermes/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters: OpportunityFilters = {
      status: searchParams.get("status") || undefined,
      aiPriority: searchParams.get("aiPriority") || undefined,
      aiConfidence: searchParams.get("aiConfidence") || undefined,
      industry: searchParams.get("industry") || undefined,
      search: searchParams.get("search") || undefined,
      favorite: searchParams.has("favorite")
        ? searchParams.get("favorite") === "true"
        : undefined,
      saved: searchParams.has("saved")
        ? searchParams.get("saved") === "true"
        : undefined,
      isUserGenerated: searchParams.has("isUserGenerated")
        ? searchParams.get("isUserGenerated") === "true"
        : undefined,
      sortBy: searchParams.get("sortBy") || undefined,
    };

    const opportunities = await opportunityStore.list(filters);
    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (error) {
    console.error("[api/opportunities] GET error:", error);
    return NextResponse.json({ error: "Failed to list opportunities" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyHermesOrUserAuth(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: "Unauthorized", hint: auth.reason || "Provide HERMES_API_KEY" },
        { status: 401 },
      );
    }

    const json = await req.json();
    const parseResult = createOpportunityInputSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid opportunity payload", issues: parseResult.error.format() },
        { status: 400 },
      );
    }

    const created = await opportunityStore.create(parseResult.data as any);
    return NextResponse.json({ opportunity: created }, { status: 201 });
  } catch (error) {
    console.error("[api/opportunities] POST error:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
