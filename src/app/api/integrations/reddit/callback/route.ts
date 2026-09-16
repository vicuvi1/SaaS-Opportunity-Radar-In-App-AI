import { NextResponse } from "next/server";
import { RedditProvider } from "@/lib/integrations/registry";
import {
  getIntegrationCredentials,
  saveIntegrationConnection,
} from "@/lib/integrations/vault";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${proto}://${host}/api/integrations/reddit/callback`;

  if (error) {
    return new Response(
      `<!DOCTYPE html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: "REDDIT_AUTH_ERROR", error: "${error}" }, "*");
          window.close();
        } else {
          window.location.href = "/workspace?reddit_error=${encodeURIComponent(error)}";
        }
      </script><p>Reddit authorization failed: ${error}. You can close this window.</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  if (!code) {
    return new Response(
      `<!DOCTYPE html><html><body><p>Missing authorization code from Reddit.</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  try {
    let userId: string | undefined;
    const supabase = await createServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const creds = await getIntegrationCredentials<{
      clientId?: string;
      clientSecret?: string;
    }>(userId, "reddit");

    const clientId = creds?.clientId || process.env.REDDIT_CLIENT_ID;
    const clientSecret = creds?.clientSecret || process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Reddit Client ID or Client Secret in vault or environment");
    }

    const reddit = new RedditProvider();
    const tokenData = await reddit.exchangeCode({
      clientId,
      clientSecret,
      code,
      redirectUri,
    });

    // Test token and get account name
    const testResult = await reddit.test({ accessToken: tokenData.accessToken });

    await saveIntegrationConnection({
      userId,
      provider: "reddit",
      status: testResult.success ? "CONNECTED" : "ERROR",
      category: "signal",
      accountName: testResult.accountName || "Connected Reddit Account",
      accountMetadata: testResult.details,
      credentials: {
        clientId,
        clientSecret,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: Date.now() + tokenData.expiresIn * 1000,
        scope: tokenData.scope,
      },
      errorMessage: testResult.success ? null : testResult.message,
      markTested: true,
    });

    return new Response(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0b0f19; color: #fff;">
        <h2 style="color: #10b981;">✅ Reddit Connected Successfully!</h2>
        <p>Your Reddit integration has been securely verified and saved.</p>
        <p style="color: #94a3b8; font-size: 14px;">Closing window...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: "REDDIT_AUTH_SUCCESS" }, "*");
            setTimeout(() => window.close(), 1200);
          } else {
            setTimeout(() => { window.location.href = "/workspace?tab=integrations"; }, 1500);
          }
        </script>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (err: any) {
    console.error("[reddit/callback] error:", err);
    return new Response(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0b0f19; color: #fff;">
        <h2 style="color: #ef4444;">❌ Reddit Authorization Failed</h2>
        <p style="color: #fca5a5;">${err.message}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: "REDDIT_AUTH_ERROR", error: "${err.message}" }, "*");
          }
        </script>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 },
    );
  }
}
