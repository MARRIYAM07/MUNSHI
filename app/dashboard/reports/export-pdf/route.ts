import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { resolveDashboardBusiness, formatMoney } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

// pdfkit needs Node APIs (fs, streams) — not available on the Edge runtime
export const runtime = "nodejs";

function currentFiscalYearRange() {
  const now = new Date();
  const fyStartYear = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 6, 1, 0, 0, 0, 0);
  const end = new Date(fyStartYear + 1, 5, 30, 23, 59, 59, 999);
  return { start, end, label: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}` };
}

export async function GET() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const { start, end, label } = currentFiscalYearRange();

  const [{ data: business }, { data: rows }] = await Promise.all([
    db.from("businesses").select("name, currency").eq("id", businessId).single(),
    db
      .from("transactions")
      .select("occurred_at, description, amount_minor, direction, category:categories(name, kind)")
      .eq("business_id", businessId)
      .eq("status", "ok")
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString())
      .order("occurred_at", { ascending: true }),
  ]);

  const transactions = rows ?? [];
  const grossRevenue = transactions
    .filter((r) => r.direction === "credit")
    .reduce((sum, r) => sum + Number(r.amount_minor ?? 0), 0);
  const totalDeductions = transactions
    .filter((r) => {
      const category = Array.isArray(r.category) ? r.category[0] : r.category;
      return r.direction === "debit" && category?.kind === "expense";
    })
    .reduce((sum, r) => sum + Number(r.amount_minor ?? 0), 0);
  const netTaxableBalance = grossRevenue - totalDeductions;

  // Build the PDF into memory
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.on("data", (chunk) => chunks.push(chunk));

  const pdfBuffer: Buffer = await new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text(business?.name ?? "Munshi", { align: "left" });
    doc.fontSize(12).fillColor("#555").text(`Tax Summary — ${label}`, { align: "left" });
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor("#000");
    doc.text(`Gross revenue:`, { continued: true }).text(`  ${formatMoney(grossRevenue)}`, { align: "right" });
    doc.text(`Total deductions:`, { continued: true }).text(`  ${formatMoney(totalDeductions)}`, { align: "right" });
    doc.moveDown(0.3);
    doc.fontSize(13).text(`Net taxable balance: ${formatMoney(netTaxableBalance)}`);
    doc.moveDown(1.5);

    doc.fontSize(13).text("Transactions", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);

    for (const row of transactions) {
      const category = Array.isArray(row.category) ? row.category[0] : row.category;
      const date = new Date(row.occurred_at).toISOString().slice(0, 10);
      const amount = `${row.direction === "credit" ? "+" : "-"}${formatMoney(Number(row.amount_minor ?? 0))}`;
      doc.text(`${date}  ${row.description}  [${category?.name ?? "Uncategorized"}]  ${amount}`);
    }

    if (transactions.length === 0) {
      doc.fillColor("#888").text("No transactions recorded for this period.");
    }

    doc.end();
  });

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="munshi-${label.replace(/\s/g, "")}.pdf"`,
    },
  });
}