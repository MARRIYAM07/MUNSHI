import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { ClientIncomeDistribution } from "@/app/dashboard/components/ClientIncomeDistribution";
import { IncomeTrendChart } from "@/app/dashboard/components/IncomeTrendChart";
import { OverviewQuickActions } from "@/app/dashboard/components/OverviewQuickActions";
import { KpiCard } from "@/components/ui/KpiCard";
import { LedgerTable, type LedgerColumn } from "@/components/ui/LedgerTable";
import { formatMoney, formatShortDate, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

type RecentRow = {
  id: string;
  date: string;
  description: string;
  amountLabel: string;
  direction: "credit" | "debit";
  status: "ok" | "review";
};

function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export default async function OverviewPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [{ data: transactions }, { data: clients }, { data: business }] = await Promise.all([
    db
      .from("transactions")
      .select("id,occurred_at,description,amount_minor,direction,status,client_id")
      .eq("business_id", businessId)
      .gte("occurred_at", sixMonthsStart.toISOString())
      .order("occurred_at", { ascending: false }),
    db.from("clients").select("id,name").eq("business_id", businessId).order("name"),
    db.from("businesses").select("plan").eq("id", businessId).single(),
  ]);

  const ledger = transactions ?? [];
  const currentMonth = ledger.filter((row) => new Date(row.occurred_at) >= monthStart);
  const income = currentMonth.filter((row) => row.direction === "credit").reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
  const spent = currentMonth.filter((row) => row.direction === "debit").reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
  const reviewCount = ledger.filter((row) => row.status === "review").length;
  const plan = business?.plan ?? "khata";
  const quota = plan === "khata" ? 100 : plan === "pro" ? 500 : 1500;
  const usage = Math.min(100, Math.round((currentMonth.length / quota) * 100));

  const monthPoints = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const amount = ledger
      .filter((row) => row.direction === "credit" && monthKey(new Date(row.occurred_at)) === monthKey(date))
      .reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
    return { label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date), amount };
  });

  const clientNames = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const clientAmounts = new Map<string, number>();
  currentMonth.filter((row) => row.direction === "credit" && row.client_id).forEach((row) => {
    const clientId = row.client_id as string;
    clientAmounts.set(clientId, (clientAmounts.get(clientId) ?? 0) + Number(row.amount_minor ?? 0));
  });
  const clientShares = [...clientAmounts.entries()]
    .map(([id, amount]) => ({ id, name: clientNames.get(id) ?? "Unlinked client", amount, share: income ? Math.round((amount / income) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const recentRows: RecentRow[] = ledger.slice(0, 7).map((row) => ({
    id: row.id,
    date: formatShortDate(row.occurred_at),
    description: row.description,
    amountLabel: `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`,
    direction: row.direction,
    status: row.status,
  }));
  const recentColumns: LedgerColumn<RecentRow>[] = [
    { id: "date", header: "Date", render: (row) => row.date },
    { id: "description", header: "Description", render: (row) => row.description },
    { id: "amount", header: "Amount", className: (row) => `amt-cell ${row.direction}`, render: (row) => <span className={`amt-cell ${row.direction}`}>{row.amountLabel}</span> },
    { id: "status", header: "Status", status: (row) => row.status },
  ];

  return (
    <DashboardFrame title="Overview" subtitle="Your books, balanced in one quiet place" activeItemId="overview">
      <div className="dashboard-folio">
        <div className="kpi-row">
          <KpiCard label="Income this month" value={formatMoney(income)} tone="forest" detail={<span className="mono">Credits recorded</span>} />
          <KpiCard label="Spent this month" value={formatMoney(spent)} tone="red" detail={<span className="mono">Debits recorded</span>} />
          <KpiCard label="Net ready to file" value={formatMoney(income - spent)} tone="brass" detail={<span className="mono">Income less expenses</span>} />
          <KpiCard label="Total clients" value={String(clients?.length ?? 0)} tone="forest" detail={<span className="mono">In your client book</span>} />
          <KpiCard label="Needs review" value={String(reviewCount)} tone="red" warning={reviewCount > 0} detail={<span className="mono">{reviewCount ? "Action required" : "All clear"}</span>} />
        </div>

        <div className="dashboard-grid overview-grid">
          <IncomeTrendChart points={monthPoints} />
          <ClientIncomeDistribution rows={clientShares} />
        </div>

        <div className="dashboard-grid overview-bottom-grid">
          <section className="card dashboard-section">
            <div className="card-head">
              <div><span className="folio-kicker">Ledger book</span><h3>Recent activity</h3></div>
              <a className="hint link-hint" href="/dashboard/transactions">Open ledger →</a>
            </div>
            <div className="card-body compact-table"><LedgerTable rows={recentRows} columns={recentColumns} getRowKey={(row) => row.id} getRowStatus={(row) => row.status === "review" ? "review" : undefined} caption="Recent activity" emptyMessage="Your recent ledger activity will appear here." /></div>
          </section>
          <OverviewQuickActions />
        </div>

        <footer className="plan-usage card">
          <div><span className="folio-kicker">Plan usage</span><strong>{plan === "khata" ? "Khata" : plan === "pro" ? "Munshi Pro" : "Munshi Teams"}</strong><span className="mono">{currentMonth.length} of {quota} entries this month</span></div>
          <div className="plan-usage-track" aria-label={`${usage}% of monthly plan usage`}><span style={{ width: `${usage}%` }} /></div>
          <a className="btn small" href="/dashboard/billing">View plan</a>
        </footer>
      </div>
    </DashboardFrame>
  );
}
