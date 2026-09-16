import { NextResponse } from "next/server";
import { IntegrationRegistry } from "@/lib/integrations/registry";
import {
  deleteIntegrationConnection,
  saveIntegrationConnection,
} from "@/lib/integrations/vault";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  props: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerId } = await props.params;

    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const provider = IntegrationRegistry.getProvider(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: `Unknown provider: ${providerId}` },
        { status: 404 },
      );
    }

    // Save as NOT_CONNECTED with cleared credentials and details
    await saveIntegrationConnection({
      userId,
      provider: providerId,
      status: "NOT_CONNECTED",
      category: provider.category,
      accountName: null,
      accountMetadata: null,
      credentials: {},
      errorMessage: null,
    });

    const updatedCard = await provider.getClientCard(userId);

    return NextResponse.json({
      success: true,
      card: updatedCard,
    });
  } catch (err: any) {
    console.error("[api/integrations/disconnect] error:", err);
    return NextResponse.json(
      { error: "Disconnect failed", details: err.message },
      { status: 500 },
    );
  }
}
