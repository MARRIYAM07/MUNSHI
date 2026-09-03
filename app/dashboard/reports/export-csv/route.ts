import { NextResponse } from "next/server";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

function currentFiscalYearRange() {
  const now = new Date();
  const fyStartYear = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 6, 1, 0, 0, 0, 0);
  const end = new Date(fyStartYear + 1, 5, 30, 23, 59, 59, 999);
  return { start, end, label: `FY${fyStartYear}-${String(fyStartYear + 1).slice(2)}` };
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const { start, end, label } = currentFiscalYearRange();

  const { data: rows, error } = await db
    .from("transactions")
    .select("occurred_at, description, amount_minor, currency, direction, source_provider, category:categories(name, kind)")
    .eq("business_id", businessId)
    .eq("status", "ok")
    .gte("occurred_at", start.toISOString())
    .lte("occurred_at", end.toISOString())
    .order("occurred_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ["Date", "Description", "Amount", "Currency", "Direction", "Category", "Type", "Source"];
  const lines = [header.join(",")];

  for (const row of rows ?? []) {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    const amount = (Number(row.amount_minor ?? 0) / 100).toFixed(2);
    const date = new Date(row.occurred_at).toISOString().slice(0, 10);
    lines.push(
      [
        csvEscape(date),
        csvEscape(row.description),
        csvEscape(amount),
        csvEscape(row.currency),
        csvEscape(row.direction),
        csvEscape(category?.name ?? "Uncategorized"),
        csvEscape(category?.kind ?? ""),
        csvEscape(row.source_provider),
      ].join(",")
    );
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="munshi-${label}.csv"`,
    },
  });
}