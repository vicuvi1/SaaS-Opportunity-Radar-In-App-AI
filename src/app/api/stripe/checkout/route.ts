import { createClient } from "@/lib/supabase/server";
import { stripe, CREDIT_PACKS, type CreditPackId } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await req.json()) as { packId?: string };
  const pack = CREDIT_PACKS.find((p) => p.id === body.packId);
  if (!pack) {
    return Response.json({ error: "Invalid pack." }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.price,
          product_data: {
            name: `FounderHQ — ${pack.label}`,
            description: `${pack.credits} credits for Validate, Discover, and Launch Plan`,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/workspace?credits=purchased`,
    cancel_url: `${baseUrl}/workspace`,
    metadata: {
      user_id: user.id,
      credits: String(pack.credits),
      pack_id: pack.id as CreditPackId,
    },
  });

  return Response.json({ url: session.url });
}
