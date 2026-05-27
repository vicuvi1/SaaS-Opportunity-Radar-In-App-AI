import { createClient as createServiceClient } from "@supabase/supabase-js";

const ANON_INITIAL_CREDITS = 3;
const FP_MAX_LENGTH = 64;
// Only alphanumeric + hyphens — matches UUID v4 format and common fingerprint IDs.
const FP_PATTERN = /^[a-zA-Z0-9-]+$/;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing.");
  return createServiceClient(url, key);
}

/** Sanitize a fingerprint ID value from a request body field. */
export function parseAnonFp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const fp = value.trim().slice(0, FP_MAX_LENGTH);
  if (!fp || !FP_PATTERN.test(fp)) return null;
  return fp;
}

/** Return the credit balance for an anonymous fingerprint. Defaults to initial credits for unknown IDs. */
export async function getAnonCredits(fingerprintId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .select("credits")
    .eq("fingerprint_id", fingerprintId)
    .single();

  if (error || !data) return ANON_INITIAL_CREDITS;
  return data.credits as number;
}

/** Atomically deduct credits from an anonymous session via RPC.
 *  Returns false if the balance is insufficient.
 */
export async function deductAnonCredits(fingerprintId: string, amount: number): Promise<boolean> {
  if (amount === 0) return true;
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("deduct_anon_credits", {
    p_fingerprint_id: fingerprintId,
    p_amount: amount,
  });

  if (error) {
    console.error("[anon-credits] deduct_anon_credits RPC error:", error.message);
    return false;
  }
  return data as boolean;
}
