import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { FilingCountdownClient } from "@/app/dashboard/components/FilingCountdownClient";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ReportsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const { data: summary } = await db.from("invoices").select("amount_minor,status").eq("business_id", businessId);
  const totalPending = (summary ?? []).filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + Number(invoice.amount_minor ?? 0), 0);

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
          <h3>FBR export</h3>
          <span className="hint">Coming soon</span>
        </div>
        <div className="card-body">
          <button type="button" className="btn solid" disabled>Export FBR CSV</button>
          <p className="mono" style={{ marginTop: 14, color: "var(--muted)" }}>No filing history or export job is available yet. This panel is reserved for the upcoming export workflow.</p>
          <div className="report-row total"><span>Open invoice value</span><strong>{new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Math.round(totalPending / 100))}</strong></div>
        </div>
      </div>
    </DashboardFrame>
  );
}
