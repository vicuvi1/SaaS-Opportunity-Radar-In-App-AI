import Stripe from "stripe";
export { CREDIT_PACKS, CREDIT_COSTS } from "./stripe-config";
export type { CreditPackId, CreditAction } from "./stripe-config";

if (!process.env.SECRET_STRIPE_KEY) {
  throw new Error("SECRET_STRIPE_KEY is not set.");
}

export const stripe = new Stripe(process.env.SECRET_STRIPE_KEY, {
  apiVersion: "2026-04-22.dahlia",
});
