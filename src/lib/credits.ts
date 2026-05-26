import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/** Fetch the current credit balance for the authenticated user (server-side). */
export async function getCredits(userId: string): Promise<number> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Row doesn't exist yet — new user, return default
    return 20;
  }
  return data.credits as number;
}

/**
 * Atomically deduct credits via Supabase RPC.
 * Returns false when the user has insufficient credits (don't run the AI call).
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
): Promise<boolean> {
  if (amount === 0) return true;

  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
  });

  if (error) {
    console.error("[credits] deduct_credits RPC error:", error.message);
    return false;
  }

  return data as boolean;
}

/**
 * Add credits to a user account after a successful Stripe payment.
 */
export async function addCredits(
  userId: string,
  amount: number,
  description: string,
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
  });

  if (error) {
    console.error("[credits] add_credits RPC error:", error.message);
    throw new Error(`Failed to add credits: ${error.message}`);
  }
}

/** Server supabase client using service role key to bypass RLS. */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing.");
  return createServiceClient(url, key);
}

/** Route-handler helper: authenticate user and check they have enough credits.
 *  Returns { user, error } where error is a ready Response on failure.
 */
export async function requireCredits(amount: number) {
  const supabase = await createServerClient();
  if (!supabase) {
    return { user: null, error: Response.json({ error: "Auth not configured." }, { status: 503 }) };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, error: Response.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (amount > 0) {
    const balance = await getCredits(user.id);
    if (balance < amount) {
      return {
        user: null,
        error: Response.json(
          { error: "Insufficient credits.", required: amount, balance },
          { status: 402 },
        ),
      };
    }
  }

  return { user, error: null };
}
