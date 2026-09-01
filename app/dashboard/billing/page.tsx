import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { BillingClient } from "@/app/dashboard/components/BillingClient";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { getPendingPaymentVerification } from "@/lib/payment-verification";
import { requireMember } from "@/lib/supabase";

export default async function BillingPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const [{ data: business }, { data: subscription }, pending] = await Promise.all([
    db.from("businesses").select("plan,billing_cycle").eq("id", businessId).single(),
    db.from("subscriptions").select("status,current_period_end").eq("business_id", businessId).maybeSingle(),
    getPendingPaymentVerification(businessId),
  ]);

  return <DashboardFrame title="Plan & billing" subtitle="Choose the ledger desk that fits your work" activeItemId="billing"><BillingClient activePlan={business?.plan ?? "khata"} initialCycle={business?.billing_cycle ?? "monthly"} subscriptionStatus={subscription?.status} periodEnd={subscription?.current_period_end} pendingPayment={pending ? { requestedPlan: pending.requestedPlan, requestedCycle: pending.requestedCycle, transactionId: pending.transactionReference, submittedAt: pending.submittedAt } : null} /></DashboardFrame>;
}
