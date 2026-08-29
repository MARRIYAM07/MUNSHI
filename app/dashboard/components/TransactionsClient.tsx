"use client";

import { useMemo, useState } from "react";
import { LedgerTable, type LedgerColumn } from "@/components/ui/LedgerTable";

export type DashboardTransactionRow = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  direction: "credit" | "debit";
  status: "ok" | "review" | "learned";
  amountLabel: string;
};

const filters = [
  { key: "all", label: "All" },
  { key: "credit", label: "Income" },
  { key: "debit", label: "Expenses" },
  { key: "review", label: "Needs review" },
] as const;

export function TransactionsClient({ initialRows, initialFilter }: { initialRows: DashboardTransactionRow[]; initialFilter: string }) {
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return initialRows.filter((row) => {
      const matchesFilter = filter === "all" || (filter === "credit" && row.direction === "credit") || (filter === "debit" && row.direction === "debit") || (filter === "review" && row.status === "review");
      if (!matchesFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return row.description.toLowerCase().includes(term) || row.category.toLowerCase().includes(term);
    });
  }, [filter, initialRows, query]);

  const columns: LedgerColumn<DashboardTransactionRow>[] = [
    { id: "date", header: "Date", render: (row) => row.date },
    { id: "description", header: "Description", render: (row) => row.description },
    { id: "category", header: "Category", render: (row) => row.category },
    { id: "amount", header: "Amount", className: (row) => `amt-cell ${row.direction === "credit" ? "credit" : "debit"}`, render: (row) => <span className={row.direction === "credit" ? "amt-cell credit" : "amt-cell debit"}>{row.amountLabel}</span> },
    { id: "status", header: "Status", status: (row) => (row.status === "review" ? "review" : row.status === "learned" ? "learned" : "ok") },
  ];

  return (
    <>
      <div className="filter-row">
        {filters.map((item) => (
          <button key={item.key} type="button" className={`filter-chip${filter === item.key ? " active" : ""}`} onClick={() => setFilter(item.key)}>
            {item.label}
          </button>
        ))}
        <input className="search-box" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search description…" aria-label="Search transactions" style={{ marginLeft: "auto" }} />
      </div>
      <div className="card">
        <div className="card-body">
          <LedgerTable rows={filteredRows} columns={columns} getRowKey={(row) => row.id} getRowStatus={(row) => (row.status === "review" ? "review" : undefined)} caption="Ledger" emptyMessage="No transactions match this filter." />
        </div>
      </div>
    </>
  );
}

