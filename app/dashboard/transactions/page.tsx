import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { TransactionsClient, type DashboardTransactionRow } from "@/app/dashboard/components/TransactionsClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const requestedFilter = typeof params.filter === "string" ? params.filter : "all";
  const initialFilter = ["all", "credit", "debit", "review"].includes(requestedFilter) ? requestedFilter : "all";
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const { data: rows } = await db
    .from("transactions")
    .select("id,occurred_at,description,amount_minor,direction,status,confidence,category:categories(name)")
    .eq("business_id", businessId)
    .order("occurred_at", { ascending: false });

  const ledgerRows: DashboardTransactionRow[] = (rows ?? []).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    const status = row.status === "review" ? "review" : row.confidence === "learned" ? "learned" : "ok";
    return {
      id: row.id,
      date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Karachi" }).format(new Date(row.occurred_at)),
      description: row.description,
      category: category?.name ?? "Uncategorized",
      amount: Math.round(Number(row.amount_minor ?? 0) / 100),
      direction: row.direction,
      status,
      amountLabel: `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`,
    };
  });

  return (
    <DashboardFrame title="Transactions" subtitle="A complete, searchable record of every movement" activeItemId="transactions">
      <div className="dashboard-folio"><TransactionsClient initialRows={ledgerRows} initialFilter={initialFilter} /></div>
    </DashboardFrame>
  );
}
