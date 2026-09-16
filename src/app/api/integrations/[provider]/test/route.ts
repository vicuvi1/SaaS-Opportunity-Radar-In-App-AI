import { NextResponse } from "next/server";
import { IntegrationRegistry } from "@/lib/integrations/registry";
import {
  getIntegrationCredentials,
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

    // Optional override credentials in request body, otherwise use vault
    let credentials: Record<string, any> | null = null;
    try {
      const body = await req.json();
      if (body && Object.keys(body).length > 0) {
        credentials = body;
      }
    } catch {
      // Empty body is valid; use stored vault credentials
    }

    if (!credentials) {
      credentials = await getIntegrationCredentials(userId, providerId);
    }

    const testResult = await provider.test(credentials || {});

    // Update connection status in vault based on test result
    await saveIntegrationConnection({
      userId,
      provider: providerId,
      status: testResult.success ? "CONNECTED" : "ERROR",
      category: provider.category,
      accountName: testResult.accountName,
      accountMetadata: testResult.details,
      errorMessage: testResult.success ? null : testResult.message,
      markTested: true,
    });

    const updatedCard = await provider.getClientCard(userId);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      accountName: testResult.accountName,
      details: testResult.details,
      card: updatedCard,
    });
  } catch (err: any) {
    console.error("[api/integrations/test] error:", err);
    return NextResponse.json(
      { error: "Test failed", details: err.message },
      { status: 500 },
    );
  }
}
