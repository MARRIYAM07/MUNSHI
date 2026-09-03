import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { FilingCountdownClient } from "@/app/dashboard/components/FilingCountdownClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

function currentFiscalYearRange() {
  const now = new Date();
  // Pakistan FY: 1 Jul - 30 Jun. If we're Jan-Jun, FY started last calendar year.
  const fyStartYear = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 6, 1, 0, 0, 0, 0);       // 1 Jul
  const end = new Date(fyStartYear + 1, 5, 30, 23, 59, 59, 999); // 30 Jun next year
  return { start, end, label: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}` };
}

export default async function ReportsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const { start, end, label } = currentFiscalYearRange();

  const [{ data: summary }, { data: fyTransactions }] = await Promise.all([
    db.from("invoices").select("amount_minor,status").eq("business_id", businessId),
    db
      .from("transactions")
      .select("amount_minor, direction, status, category:categories(kind)")
      .eq("business_id", businessId)
      .eq("status", "ok")
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString()),
  ]);

  const totalPending = (summary ?? [])
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount_minor ?? 0), 0);

  const rows = fyTransactions ?? [];
  const grossRevenue = rows
    .filter((row) => row.direction === "credit")
    .reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);

  const totalDeductions = rows
    .filter((row) => {
      const category = Array.isArray(row.category) ? row.category[0] : row.category;
      return row.direction === "debit" && category?.kind === "expense";
    })
    .reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);

  const netTaxableBalance = grossRevenue - totalDeductions;

  return (
    <DashboardFrame title="Reports" subtitle="FBR filing countdown and export readiness" activeItemId="reports">
      <div className="card">
        <div className="card-head">
          <h3>FBR filing deadline</h3>
          <span className="hint">Live countdown</span>
        </div>
        <div className="card-body">
          <FilingCountdownClient />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Tax summary</h3>
          <span className="hint">{label}</span>
        </div>
        <div className="card-body">
          <div className="report-row"><span>Gross revenue</span><strong>{formatMoney(grossRevenue)}</strong></div>
          <div className="report-row"><span>Total deductions</span><strong>{formatMoney(totalDeductions)}</strong></div>
          <div className="report-row total"><span>Net taxable balance</span><strong>{formatMoney(netTaxableBalance)}</strong></div>
          <p className="mono" style={{ marginTop: 14, color: "var(--muted)" }}>
            Deductions include only debit transactions tagged with an expense category. Uncategorized spending isn&apos;t counted until tagged in Categorize or Review.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>FBR export</h3>
          <span className="hint">{label}</span>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 12 }}>
            <a
              href="/dashboard/reports/export-csv"
              className="btn solid"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              Export FBR CSV
            </a>
            <a
              href="/dashboard/reports/export-pdf"
              className="btn solid"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              Export FBR PDF
            </a>
          </div>
          <p className="mono" style={{ marginTop: 14, color: "var(--muted)" }}>
            Downloads all confirmed transactions for {label}.
          </p>
          <div className="report-row total"><span>Open invoice value</span><strong>{new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Math.round(totalPending / 100))}</strong></div>
        </div>
      </div>
    </DashboardFrame>
  );
}