import { stripe } from "@/lib/stripe";
import { addCredits } from "@/lib/credits";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set.");
    return Response.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return Response.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const creditsStr = session.metadata?.credits;
    const packId = session.metadata?.pack_id ?? "unknown";

    if (!userId || !creditsStr) {
      console.error("[stripe/webhook] Missing metadata on session:", session.id);
      return Response.json({ error: "Missing metadata." }, { status: 400 });
    }

    const credits = parseInt(creditsStr, 10);
    if (isNaN(credits) || credits <= 0) {
      console.error("[stripe/webhook] Invalid credits value:", creditsStr);
      return Response.json({ error: "Invalid credits." }, { status: 400 });
    }

    try {
      await addCredits(userId, credits, `Stripe purchase — ${packId} (${session.id})`);
      console.log(`[stripe/webhook] Added ${credits} credits to user ${userId}`);
    } catch (err) {
      console.error("[stripe/webhook] Failed to add credits:", err);
      return Response.json({ error: "Failed to add credits." }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
