import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { ApprovalActionsClient } from "@/app/dashboard/components/ApprovalActionsClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ApprovalsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const { data: approvals } = await db.from("approvals").select("id,kind,title,amount_minor,due_date,status").eq("business_id", businessId).order("due_date", { ascending: true });

  return (
    <DashboardFrame title="Approvals" subtitle="Bills and payouts awaiting sign-off" activeItemId="approvals">
      <div className="card">
        <div className="card-head">
          <h3>Pending approvals</h3>
          <span className="hint">{approvals?.length ?? 0} items</span>
        </div>
        <div className="card-body">
          <ApprovalActionsClient initialApprovals={(approvals ?? []).map((approval) => ({
            id: approval.id,
            kind: approval.kind,
            title: approval.title,
            amount_minor: Number(approval.amount_minor ?? 0),
            due_date: approval.due_date,
            status: approval.status,
            amountLabel: formatMoney(Number(approval.amount_minor ?? 0)),
          }))} />

          {(!approvals || approvals.length === 0) ? <p className="mono" style={{ margin: 0, color: "var(--muted)" }}>No approvals in flight.</p> : null}
        </div>
      </div>
    </DashboardFrame>
  );
}
