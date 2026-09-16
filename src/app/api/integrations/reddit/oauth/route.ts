import { NextResponse } from "next/server";
import crypto from "crypto";
import { RedditProvider } from "@/lib/integrations/registry";
import { getIntegrationCredentials, saveIntegrationConnection } from "@/lib/integrations/vault";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customClientId = searchParams.get("clientId");
    const customClientSecret = searchParams.get("clientSecret");

    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    // Get client credentials: query params > vault > env
    const existingCreds = await getIntegrationCredentials<{ clientId?: string; clientSecret?: string }>(
      userId,
      "reddit",
    );

    const clientId = customClientId || existingCreds?.clientId || process.env.REDDIT_CLIENT_ID;
    const clientSecret = customClientSecret || existingCreds?.clientSecret || process.env.REDDIT_CLIENT_SECRET;

    if (!clientId) {
      return NextResponse.json(
        { error: "Missing Reddit Client ID. Please provide your Reddit App Client ID." },
        { status: 400 },
      );
    }

    // Save clientId and clientSecret in vault if newly provided
    if (customClientId || customClientSecret) {
      await saveIntegrationConnection({
        userId,
        provider: "reddit",
        status: "CONNECTING",
        category: "signal",
        credentials: {
          clientId,
          clientSecret: clientSecret || "",
        },
      });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const redirectUri = `${proto}://${host}/api/integrations/reddit/callback`;

    const state = crypto.randomBytes(16).toString("hex");

    const reddit = new RedditProvider();
    const authUrl = reddit.getOAuthUrl(clientId, redirectUri, state);

    // If client requested json
    if (searchParams.get("format") === "json") {
      return NextResponse.json({ authUrl, state });
    }

    // Otherwise redirect directly
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("[reddit/oauth] error:", err);
    return NextResponse.json({ error: "Failed to initiate Reddit OAuth", details: err.message }, { status: 500 });
  }
}
