import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatMoney, formatShortDate, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function OverviewPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  const [{ data: incomeRows }, { data: reviewRows }, { data: invoiceRows }, { data: recentRows }] = await Promise.all([
    db.from("transactions").select("amount_minor").eq("business_id", businessId).eq("direction", "credit").gte("occurred_at", monthStart.toISOString()).lte("occurred_at", monthEnd.toISOString()),
    db.from("transactions").select("id").eq("business_id", businessId).eq("status", "review"),
    db.from("invoices").select("client_id").eq("business_id", businessId).in("status", ["pending", "overdue"]),
    db.from("transactions").select("id, description, amount_minor, direction, source_provider, occurred_at").eq("business_id", businessId).order("occurred_at", { ascending: false }).limit(8),
  ]);

  const income = (incomeRows ?? []).reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
  const reviewCount = reviewRows?.length ?? 0;
  const clientCount = new Set((invoiceRows ?? []).map((row) => row.client_id)).size;
  const recentActivity = recentRows ?? [];

  return (
    <DashboardFrame title="Overview" subtitle="Cash flow, review queue, and client follow-up" activeItemId="overview">
      <div className="kpi-row">
        <KpiCard label="Income this month" value={formatMoney(income)} tone="forest" detail={<span className="mono">Current month</span>} />
        <KpiCard label="Needs review" value={String(reviewCount)} tone="red" warning={reviewCount > 0} detail={<span className="mono">{reviewCount > 0 ? "Action required" : "All clear"}</span>} />
        <KpiCard label="Clients owing" value={String(clientCount)} tone="brass" detail={<span className="mono">Outstanding invoices</span>} />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Monthly snapshot</h3>
          <span className="hint">Live from your ledger</span>
        </div>
        <div className="card-body">
          <div className="report-row"><span>Income (this month)</span><strong>{formatMoney(income)}</strong></div>
          <div className="report-row"><span>Review queue</span><strong>{reviewCount}</strong></div>
          <div className="report-row"><span>Clients with open invoices</span><strong>{clientCount}</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Recent activity</h3>
          <span className="hint">Last {recentActivity.length} transactions</span>
        </div>
        <div className="card-body">
          {recentActivity.length === 0 ? (
            <div className="report-row"><span>No transactions yet</span></div>
          ) : (
            recentActivity.map((row) => (
              <div className="report-row" key={row.id}>
                <span>
                  {row.description}
                  <span className="hint" style={{ marginLeft: 8 }}>
                    {formatShortDate(row.occurred_at)} · {row.source_provider}
                  </span>
                </span>
                <strong style={{ color: row.direction === "credit" ? "var(--forest, #2f6b3a)" : "var(--red, #b3392c)" }}>
                  {row.direction === "credit" ? "+" : "-"}{formatMoney(row.amount_minor)}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardFrame>
  );
}