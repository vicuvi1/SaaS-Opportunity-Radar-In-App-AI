import Stripe from "stripe";
export { CREDIT_PACKS, CREDIT_COSTS } from "./stripe-config";
export type { CreditPackId, CreditAction } from "./stripe-config";

export const stripe = new Stripe(process.env.SECRET_STRIPE_KEY || "sk_test_placeholder_for_build", {
  apiVersion: "2026-04-22.dahlia" as any,
});
