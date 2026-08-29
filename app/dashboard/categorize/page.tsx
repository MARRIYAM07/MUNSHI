import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { CategoryCorrectionDropdown } from "@/app/dashboard/components/CategoryCorrectionDropdown";
import { LedgerTable, type LedgerColumn } from "@/components/ui/LedgerTable";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function CategorizePage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const [{ data: categoriesRows }, { data: rows }] = await Promise.all([
    db.from("categories").select("id,name").or(`business_id.is.null,business_id.eq.${businessId}`).order("name"),
    db.from("transactions").select("id,description,amount_minor,direction,confidence,status,category:categories(name, id)").eq("business_id", businessId).order("occurred_at", { ascending: false }).limit(20),
  ]);

  const categories = (categoriesRows ?? []).map((row) => ({ id: row.id, name: row.name }));

  const ledgerRows = (rows ?? []).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return {
      id: row.id,
      description: row.description,
      amount: Math.round(Number(row.amount_minor ?? 0) / 100),
      direction: row.direction,
      category_id: category?.id ?? null,
      category_name: category?.name ?? "Uncategorized",
      confidence: row.confidence,
      status: row.status,
      amountLabel: `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`,
    };
  });

  const columns: LedgerColumn<typeof ledgerRows[number]>[] = [
    { id: "description", header: "Description", render: (row) => row.description },
    { id: "category", header: "Category", render: (row) => <CategoryCorrectionDropdown transaction={row} categories={categories} /> },
    { id: "amount", header: "Amount", className: (row) => `amt-cell ${row.direction === "credit" ? "credit" : "debit"}`, render: (row) => <span className={row.direction === "credit" ? "amt-cell credit" : "amt-cell debit"}>{row.amountLabel}</span> },
    { id: "confidence", header: "Confidence", status: (row) => row.confidence },
    { id: "status", header: "Status", status: (row) => (row.status === "review" ? "review" : "ok") },
  ];

  return (
    <DashboardFrame title="Categorize" subtitle="Correct flagging and confidence scores" activeItemId="categorize">
      <LedgerTable rows={ledgerRows} columns={columns} getRowKey={(row) => row.id} getRowStatus={(row) => (row.status === "review" ? "review" : undefined)} caption="Transaction categorization" emptyMessage="No transactions need categorization right now." />
    </DashboardFrame>
  );
}
