import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { addCredits } from "@/lib/credits";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing.");
  return createServiceClient(url, key);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await req.json()) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "Promo code required." }, { status: 400 });
  }

  const service = getServiceClient();

  const { data: promo, error: promoError } = await service
    .from("promo_codes")
    .select("id, credits, max_uses, uses_count, expires_at")
    .eq("code", code)
    .eq("active", true)
    .single();

  if (!promo) {
    console.error("[promo] lookup failed for code:", code, "error:", promoError?.message, promoError?.code);
    return Response.json({ error: "Invalid or expired promo code." }, { status: 400 });
  }

  if (promo.expires_at && new Date(promo.expires_at as string) < new Date()) {
    return Response.json({ error: "This promo code has expired." }, { status: 400 });
  }

  if (promo.max_uses !== null && (promo.uses_count as number) >= (promo.max_uses as number)) {
    return Response.json({ error: "This promo code has been fully redeemed." }, { status: 400 });
  }

  const email = user.email?.toLowerCase() ?? null;

  const { error: redeemError } = await service
    .from("promo_code_redemptions")
    .insert({ code, user_id: user.id, credits_granted: promo.credits, email });

  if (redeemError) {
    // Unique constraint violation on (code, email) means already redeemed
    if (redeemError.code === "23505") {
      return Response.json({ error: "You have already redeemed this code." }, { status: 400 });
    }
    console.error("[promo] insert error:", redeemError.message);
    return Response.json({ error: "Failed to redeem code. Please try again." }, { status: 500 });
  }

  await service
    .from("promo_codes")
    .update({ uses_count: (promo.uses_count as number) + 1 })
    .eq("id", promo.id);

  await addCredits(user.id, promo.credits as number, `Promo code: ${code}`);

  return Response.json({ credits: promo.credits, message: `${promo.credits} credits added to your account!` });
}
