import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { FilingCountdownClient } from "@/app/dashboard/components/FilingCountdownClient";
import { ReportExportClient } from "@/app/dashboard/components/ReportExportClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ReportsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const [{ data: transactions }, { data: invoices }] = await Promise.all([
    db.from("transactions").select("amount_minor,direction,occurred_at").eq("business_id", businessId),
    db.from("invoices").select("amount_minor,status").eq("business_id", businessId),
  ]);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
  const summarize = (start: Date) => {
    const rows = (transactions ?? []).filter((row) => new Date(row.occurred_at) >= start);
    const income = rows.filter((row) => row.direction === "credit").reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
    const expenses = rows.filter((row) => row.direction === "debit").reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
    return { income, expenses, net: income - expenses };
  };
  const monthly = summarize(monthStart);
  const quarterly = summarize(quarterStart);
  const outstanding = (invoices ?? []).filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + Number(invoice.amount_minor ?? 0), 0);
  const history = ["Q2 FY26", "Q1 FY26", "Q4 FY25"];

  return (
    <DashboardFrame title="Reports & tax" subtitle="A calm filing desk for your latest numbers" activeItemId="reports">
      <div className="dashboard-folio reports-grid">
        <section className="card deadline-card dashboard-section"><div className="card-head"><div><span className="folio-kicker">FBR filing desk</span><h3>Filing deadline</h3></div><span className="hint">Live countdown</span></div><div className="card-body"><FilingCountdownClient /><p className="deadline-note">Keep receipts and review items ready before the annual filing window closes.</p></div></section>
        <section className="card dashboard-section report-summary"><div className="card-head"><div><span className="folio-kicker">Ledger summary</span><h3>Income & expenses</h3></div><ReportExportClient /></div><div className="card-body report-summary-grid">
          <div><span>Monthly income</span><strong>{formatMoney(monthly.income)}</strong><small>Expenses {formatMoney(monthly.expenses)}</small><b>Net income {formatMoney(monthly.net)}</b></div>
          <div><span>Quarterly income</span><strong>{formatMoney(quarterly.income)}</strong><small>Expenses {formatMoney(quarterly.expenses)}</small><b>Net income {formatMoney(quarterly.net)}</b></div>
          <div><span>Open invoices</span><strong>{formatMoney(outstanding)}</strong><small>Awaiting payment</small><b>Keep follow-ups moving</b></div>
        </div></section>
        <section className="card dashboard-section filing-history"><div className="card-head"><div><span className="folio-kicker">Filing record</span><h3>Filing history</h3></div><span className="hint">Tax quarters</span></div><div className="card-body">{history.map((period, index) => <div className="filing-history-row" key={period}><span>{period}</span><span className={`status-tag ${index === 0 ? "review" : "ok"}`}>{index === 0 ? "Draft" : "Filed"}</span><ReportExportClient /></div>)}</div></section>
      </div>
    </DashboardFrame>
  );
}
