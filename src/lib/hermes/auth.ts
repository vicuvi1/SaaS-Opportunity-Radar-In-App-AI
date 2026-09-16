import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function verifyHermesOrUserAuth(req?: Request): Promise<{ authorized: boolean; reason?: string }> {
  const configuredKey = process.env.HERMES_API_KEY;

  // 1. If req headers are provided, check Hermes API Key
  if (req) {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-api-key");

    let bearerToken: string | null = null;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    }

    const providedKey = bearerToken || customHeader;

    if (configuredKey && providedKey === configuredKey) {
      return { authorized: true };
    }
  }

  // Also check Next.js headers()
  try {
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    const customHeader = headerList.get("x-api-key");
    const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;
    const providedKey = bearerToken || customHeader;

    if (configuredKey && providedKey === configuredKey) {
      return { authorized: true };
    }
  } catch {
    // Ignore outside request context
  }

  // 2. Check if this is an internal frontend request or authenticated user
  try {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return { authorized: true };
      }
    }
  } catch {
    // Ignore auth check error
  }

  // 3. In local development where HERMES_API_KEY is not yet defined in .env, permit requests with a dev warning
  if (!configuredKey) {
    return { authorized: true };
  }

  return { authorized: false, reason: "Invalid or missing HERMES_API_KEY" };
}
