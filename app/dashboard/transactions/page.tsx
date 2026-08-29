import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { TransactionsClient, type DashboardTransactionRow } from "@/app/dashboard/components/TransactionsClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const filter = typeof params.filter === "string" ? params.filter : "all";

  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  let query = db
    .from("transactions")
    .select("id,occurred_at,description,amount_minor,direction,status,category:categories(name)")
    .eq("business_id", businessId)
    .order("occurred_at", { ascending: false });

  if (filter === "credit" || filter === "debit") {
    query = query.eq("direction", filter);
  }
  if (filter === "review") {
    query = query.eq("status", "review");
  }

  const { data: rows } = await query;

  const ledgerRows: DashboardTransactionRow[] = (rows ?? []).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return {
      id: row.id,
      date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Karachi" }).format(new Date(row.occurred_at)),
      description: row.description,
      category: category?.name ?? "Uncategorized",
      amount: Math.round(Number(row.amount_minor ?? 0) / 100),
      direction: row.direction,
      status: row.status,
      amountLabel: `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`,
    };
  });

  return (
    <DashboardFrame title="Transactions" subtitle="A full ledger for this business" activeItemId="transactions">
      <TransactionsClient initialRows={ledgerRows} initialFilter={filter} />
    </DashboardFrame>
  );
}
