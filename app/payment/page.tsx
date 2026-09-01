import { PaymentClient } from "@/app/payment/PaymentClient";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { isBillingCycle, isPaidPlan } from "@/lib/plans";
import { getPendingPaymentVerification } from "@/lib/payment-verification";
import { requireMember } from "@/lib/supabase";
import { redirect } from "next/navigation";

function paymentDisplayName(email: string | undefined, metadata: unknown) {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const record = metadata as Record<string, unknown>;
    const name = record.full_name ?? record.name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }

  return email?.split("@")[0] || "there";
}

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ plan?: string; cycle?: string }> }) {
  const params = await searchParams;
  if (!isPaidPlan(params.plan) || !isBillingCycle(params.cycle)) redirect("/dashboard/billing");

  let dashboard;
  try {
    dashboard = await resolveDashboardBusiness();
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/payment?plan=${params.plan}&cycle=${params.cycle}`)}`);
    }
    throw error;
  }

  const { db } = await requireMember(dashboard.businessId);
  const [{ data: business }, pending] = await Promise.all([
    db.from("businesses").select("name").eq("id", dashboard.businessId).single(),
    getPendingPaymentVerification(dashboard.businessId),
  ]);

  return (
    <PaymentClient
      businessName={business?.name ?? "Your business"}
      email={dashboard.user.email ?? "your email"}
      name={paymentDisplayName(dashboard.user.email, dashboard.user.user_metadata)}
      plan={pending?.requestedPlan ?? params.plan}
      cycle={pending?.requestedCycle ?? params.cycle}
      initialPending={pending ? {
        requestedPlan: pending.requestedPlan,
        requestedCycle: pending.requestedCycle,
        transactionId: pending.transactionReference,
        submittedAt: pending.submittedAt,
      } : null}
    />
  );
}
