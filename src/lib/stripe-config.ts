export const CREDIT_PACKS = [
  {
    id: "pack_50",
    credits: 50,
    price: 400,
    label: "50 credits",
    sublabel: "$0.08 / credit",
  },
  {
    id: "pack_150",
    credits: 150,
    price: 1000,
    label: "150 credits",
    sublabel: "$0.07 / credit",
    popular: true,
  },
  {
    id: "pack_400",
    credits: 400,
    price: 2200,
    label: "400 credits",
    sublabel: "$0.055 / credit",
  },
] as const;

export type CreditPackId = typeof CREDIT_PACKS[number]["id"];

export const CREDIT_COSTS = {
  validate: 3,
  discover: 3,
  finish: 10,
  chat: 0,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;
