import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { ApprovalActionsClient } from "@/app/dashboard/components/ApprovalActionsClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ApprovalsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const { data: approvals } = await db.from("approvals").select("id,kind,title,amount_minor,due_date,status").eq("business_id", businessId).order("due_date", { ascending: true });
  const pending = (approvals ?? []).filter((approval) => approval.status === "pending").length;

  return (
    <DashboardFrame title="Approvals" subtitle="Bills and payouts waiting for your signature" activeItemId="approvals">
      <div className="dashboard-folio"><section className="approvals-header"><span className="folio-kicker">Decision desk</span><h2>{pending} pending {pending === 1 ? "item" : "items"}</h2></section><ApprovalActionsClient initialApprovals={(approvals ?? []).map((approval) => ({ id: approval.id, kind: approval.kind, title: approval.title, amount_minor: Number(approval.amount_minor ?? 0), due_date: approval.due_date, status: approval.status, amountLabel: formatMoney(Number(approval.amount_minor ?? 0)) }))} />{!approvals?.length ? <p className="empty-ledger">No approvals are in flight.</p> : null}</div>
    </DashboardFrame>
  );
}
