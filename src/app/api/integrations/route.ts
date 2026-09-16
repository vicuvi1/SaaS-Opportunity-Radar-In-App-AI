import { NextResponse } from "next/server";
import { IntegrationRegistry } from "@/lib/integrations/registry";
import {
  saveIntegrationConnection,
  getIntegrationCredentials,
  getIntegrationConnection,
} from "@/lib/integrations/vault";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const cards = await IntegrationRegistry.getCards(userId);
    const connectedCount = cards.filter((c) => c.status === "CONNECTED").length;

    return NextResponse.json({
      integrations: cards,
      stats: {
        total: cards.length,
        connected: connectedCount,
      },
    });
  } catch (err: any) {
    console.error("[api/integrations] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list integrations", details: err.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const body = await req.json();
    const { provider: providerId, credentials, testImmediate } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Missing provider id" }, { status: 400 });
    }

    const provider = IntegrationRegistry.getProvider(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: `Unknown integration provider: ${providerId}` },
        { status: 404 },
      );
    }

    let testResult: { success: boolean; accountName?: string; details?: any; message: string } | null = null;
    let status: "CONNECTED" | "ERROR" | "NOT_CONNECTED" = "CONNECTED";
    let errorMessage: string | null = null;
    let accountName: string | null = null;
    let accountMetadata: Record<string, any> | null = null;

    if (testImmediate && credentials) {
      testResult = await provider.test(credentials);
      if (!testResult.success) {
        status = "ERROR";
        errorMessage = testResult.message;
      } else {
        status = "CONNECTED";
        accountName = testResult.accountName || null;
        accountMetadata = testResult.details || null;
      }
    }

    // Save encrypted credentials to vault
    await saveIntegrationConnection({
      userId,
      provider: provider.id,
      status,
      category: provider.category,
      accountName,
      accountMetadata,
      credentials,
      errorMessage,
      markTested: !!testImmediate,
    });

    const updatedCard = await provider.getClientCard(userId);

    return NextResponse.json({
      success: true,
      card: updatedCard,
      testResult,
    });
  } catch (err: any) {
    console.error("[api/integrations] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save integration credentials", details: err.message },
      { status: 500 },
    );
  }
}
