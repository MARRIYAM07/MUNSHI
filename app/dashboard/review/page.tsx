import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import ReviewQueueClient from "./ReviewQueueClient";
import { formatMoney, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ReviewPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const [{ data: staging }, { data: categoriesRows }] = await Promise.all([
    db
      .from("staging_transactions")
      .select("id, provider, description, amount_minor, currency, direction, occurred_at, counterparty")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("occurred_at", { ascending: false }),
    db
      .from("categories")
      .select("id,name")
      .or(`business_id.is.null,business_id.eq.${businessId}`)
      .order("name"),
  ]);

  const categories = (categoriesRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  const items = (staging ?? []).map((row) => ({
    id: row.id,
    provider: row.provider,
    description: row.description,
    direction: row.direction,
    occurred_at: row.occurred_at,
    counterparty: row.counterparty,
    amountLabel: `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`,
  }));

  return (
    <DashboardFrame title="Review Queue" subtitle="Approve or reject auto-parsed transactions" activeItemId="review">
      <div className="card">
        <div className="card-head">
          <h3>Pending review</h3>
          <span className="hint">{items.length} items</span>
        </div>
        <div className="card-body">
          <ReviewQueueClient initialItems={items} categories={categories} />
          {items.length === 0 ? (
            <p className="mono" style={{ margin: 0, color: "var(--muted)" }}>
              Nothing waiting for review.
            </p>
          ) : null}
        </div>
      </div>
    </DashboardFrame>
  );
}