"use client";

import { useState } from "react";
import { CategoryCorrectionDropdown, type CategoryOption } from "@/app/dashboard/components/CategoryCorrectionDropdown";
import { StatusPill } from "@/components/ui/StatusPill";

export type CategorizeRow = {
  id: string;
  description: string;
  amountLabel: string;
  direction: "credit" | "debit";
  category_id?: string | null;
  category_name: string;
  confidence: "high" | "med" | "low" | "learned";
  status: "ok" | "review";
};

export function CategorizeClient({ initialRows, categories }: { initialRows: CategorizeRow[]; categories: CategoryOption[] }) {
  const [rows, setRows] = useState(initialRows);

  return (
    <section className="card dashboard-section categorize-card">
      <div className="card-head"><div><span className="folio-kicker">Learning queue</span><h3>Review & categorize</h3></div><span className="hint">{rows.filter((row) => row.status === "review").length} need review</span></div>
      <div className="table-scroll"><table className="ledger-table"><caption>Transaction categorization</caption><thead><tr><th>Transaction</th><th>Category</th><th>Amount</th><th>Confidence</th><th>Status</th></tr></thead><tbody>
        {rows.length ? rows.map((row) => <tr key={row.id} className={row.status === "review" ? "review" : ""}>
          <td><span className="ledger-description">{row.description}<small>Choose a category to improve future matches</small></span></td>
          <td><CategoryCorrectionDropdown transaction={row} categories={categories} onCategorized={(category) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, category_id: category.id, category_name: category.name, confidence: "learned", status: "ok" } : item))} /></td>
          <td className={`amt-cell ${row.direction}`}>{row.amountLabel}</td>
          <td><StatusPill value={row.confidence} /></td>
          <td><StatusPill value={row.status} label={row.status === "ok" ? "OK" : "Review"} /></td>
        </tr>) : <tr><td colSpan={5}>No transactions need categorization right now.</td></tr>}
      </tbody></table></div>
    </section>
  );
}
