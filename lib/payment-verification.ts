import { cache } from "react";
import { isBillingCycle, isPaidPlan, type BillingCycle, type PaidPlan } from "@/lib/plans";
import { userDb } from "@/lib/supabase";

export type PendingPaymentVerification = {
  requestedPlan: PaidPlan;
  requestedCycle: BillingCycle;
  transactionReference: string;
  submittedAt: string;
};

export const getPendingPaymentVerification = cache(async (businessId: string): Promise<PendingPaymentVerification | null> => {
  const db = await userDb();
  const { data, error } = await db.rpc("get_payment_verification_status", { bid: businessId });
  if (error) throw error;

  const request = data[0];
  if (!request || !isPaidPlan(request.requested_plan) || !isBillingCycle(request.requested_cycle)) return null;

  return {
    requestedPlan: request.requested_plan,
    requestedCycle: request.requested_cycle,
    transactionReference: request.transaction_reference,
    submittedAt: request.submitted_at,
  };
});
