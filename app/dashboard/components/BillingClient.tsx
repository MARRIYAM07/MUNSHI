"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { billingPlans, formatPlanPrice, type BillingCycle, type PaidPlan, type Plan } from "@/lib/plans";

type PendingPayment = {
  requestedPlan: PaidPlan;
  requestedCycle: BillingCycle;
  transactionId: string;
  submittedAt: string;
};

export function BillingClient({
  activePlan,
  initialCycle,
  subscriptionStatus,
  periodEnd,
  pendingPayment,
}: {
  activePlan: Plan;
  initialCycle: BillingCycle;
  subscriptionStatus?: string | null;
  periodEnd?: string | null;
  pendingPayment?: PendingPayment | null;
}) {
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const router = useRouter();
  const showToast = useToast();
  const history = [{ date: "01 Jul 2026", detail: "Munshi Pro · monthly", amount: "PKR 1,490", status: "Paid" }, { date: "01 Jun 2026", detail: "Munshi Pro · monthly", amount: "PKR 1,490", status: "Paid" }, { date: "01 May 2026", detail: "Munshi Pro · monthly", amount: "PKR 1,490", status: "Paid" }];

  function choosePlan(plan: Plan) {
    if (plan === activePlan) {
      showToast(`${billingPlans.find((item) => item.id === plan)?.name} is your active plan.`);
      return;
    }
    if (pendingPayment) {
      showToast(`Payment verification for ${billingPlans.find((item) => item.id === pendingPayment.requestedPlan)?.name} is already pending.`);
      return;
    }
    if (plan === "khata") {
      showToast("Contact support to change an active paid plan to Khata.");
      return;
    }
    router.push(`/payment?plan=${plan}&cycle=${cycle}`);
  }

  return <div className="dashboard-folio">
    <div className="billing-toggle" role="group" aria-label="Billing cycle"><button type="button" className={cycle === "monthly" ? "active" : ""} onClick={() => setCycle("monthly")}>Monthly</button><button type="button" className={cycle === "yearly" ? "active" : ""} onClick={() => setCycle("yearly")}>Yearly <span>2 mo free</span></button></div>
    {pendingPayment ? <section className="billing-pending card"><span className="folio-kicker">Payment verification pending</span><strong>{billingPlans.find((plan) => plan.id === pendingPayment.requestedPlan)?.name}</strong><span>{pendingPayment.requestedCycle[0].toUpperCase() + pendingPayment.requestedCycle.slice(1)} billing · Reference ID: {pendingPayment.transactionId}</span><span>Submitted {new Date(pendingPayment.submittedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span></section> : null}
    <section className="pricing-grid">{billingPlans.map((plan) => {
      const isActive = plan.id === activePlan;
      const isPending = plan.id === pendingPayment?.requestedPlan;
      const displayCycle = isPending && pendingPayment ? pendingPayment.requestedCycle : cycle;
      return <article className={`pricing-card${isActive ? " active-plan" : ""}${isPending ? " selected" : ""}`} key={plan.id}><span className="folio-kicker">{plan.subtitle}</span><h2>{plan.name}</h2><p>{plan.description}</p><strong className="price">{formatPlanPrice(plan.id, displayCycle)}</strong><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><button type="button" className={`btn ${isActive ? "solid" : ""}`} disabled={Boolean(isPending)} onClick={() => choosePlan(plan.id)}>{isActive ? "Active plan" : isPending ? "Pending verification" : "Choose plan"}</button>{isPending ? <span className="pricing-pending-reference">Reference: {pendingPayment.transactionId}</span> : null}</article>;
    })}</section>
    <section className="card dashboard-section"><div className="card-head"><div><span className="folio-kicker">Billing record</span><h3>Billing history</h3></div><span className="hint">{subscriptionStatus ?? "No subscription record"}{periodEnd ? ` · renews ${new Date(periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}</span></div><div className="table-scroll"><table className="ledger-table"><thead><tr><th>Date</th><th>Details</th><th>Amount</th><th>Status</th></tr></thead><tbody>{history.map((item) => <tr key={item.date}><td>{item.date}</td><td>{item.detail}</td><td className="amt-cell debit">{item.amount}</td><td><span className="status-tag ok">{item.status}</span></td></tr>)}</tbody></table></div></section>
  </div>;
}
