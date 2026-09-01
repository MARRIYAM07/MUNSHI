export const billingPlans = [
  {
    id: "khata",
    name: "Khata",
    subtitle: "Starter",
    monthly: 0,
    description: "A tidy place to begin your books.",
    features: ["100 entries / month", "Core ledger", "Email support"],
  },
  {
    id: "pro",
    name: "Munshi Pro",
    subtitle: "For active books",
    monthly: 1490,
    description: "The full desk for active freelancers.",
    features: ["500 entries / month", "Smart categorization", "FBR summary exports"],
  },
  {
    id: "teams",
    name: "Munshi Teams",
    subtitle: "Shared workspace",
    monthly: 3490,
    description: "More visibility for a growing practice.",
    features: ["1,500 entries / month", "Shared review queue", "Priority support"],
  },
] as const;

export type Plan = (typeof billingPlans)[number]["id"];
export const paidPlanIds = ["pro", "teams"] as const;
export const billingCycles = ["monthly", "yearly"] as const;
export type PaidPlan = (typeof paidPlanIds)[number];
export type BillingCycle = (typeof billingCycles)[number];

export function isPaidPlan(value: unknown): value is PaidPlan {
  return typeof value === "string" && paidPlanIds.includes(value as PaidPlan);
}

export function isBillingCycle(value: unknown): value is BillingCycle {
  return typeof value === "string" && billingCycles.includes(value as BillingCycle);
}

export function getPlan(plan: Plan) {
  return billingPlans.find((item) => item.id === plan) ?? billingPlans[0];
}

export function formatPlanPrice(plan: Plan, cycle: BillingCycle) {
  const amount = getPlan(plan).monthly;
  if (!amount) return "Free";
  const price = cycle === "yearly" ? amount * 10 : amount;
  return `PKR ${price.toLocaleString("en-PK")}${cycle === "yearly" ? " / year" : " / month"}`;
}
