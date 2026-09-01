import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { CategorizeClient, type CategorizeRow } from "@/app/dashboard/components/CategorizeClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

const preferredCategories = ["Client Income", "Utilities", "Software & tools", "Platform Fees", "Meals & travel"];

export default async function CategorizePage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const [{ data: categoryRows }, { data: rows }] = await Promise.all([
    db.from("categories").select("id,name").or(`business_id.is.null,business_id.eq.${businessId}`).order("name"),
    db.from("transactions").select("id,description,amount_minor,direction,confidence,status,category:categories(name, id)").eq("business_id", businessId).order("occurred_at", { ascending: false }).limit(30),
  ]);
  const allCategories = (categoryRows ?? []).map((row) => ({ id: row.id, name: row.name }));
  const matchingCategories = allCategories.filter((category) => preferredCategories.includes(category.name));
  const categories = matchingCategories.length ? matchingCategories : allCategories;
  const ledgerRows: CategorizeRow[] = (rows ?? []).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return {
      id: row.id,
      description: row.description,
      direction: row.direction,
      category_id: category?.id ?? null,
      category_name: category?.name ?? "Uncategorized",
      confidence: row.confidence,
      status: row.status,
      amountLabel: `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`,
    };
  });

  return (
    <DashboardFrame title="Categorize" subtitle="Review a line once. Munshi remembers the rule." activeItemId="categorize">
      <div className="dashboard-folio"><CategorizeClient initialRows={ledgerRows} categories={categories} /></div>
    </DashboardFrame>
  );
}
