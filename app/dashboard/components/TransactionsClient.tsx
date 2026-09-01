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

type Filter = (typeof filters)[number]["key"];
type StatusFilter = "all" | DashboardTransactionRow["status"];

export function TransactionsClient({ initialRows, initialFilter }: { initialRows: DashboardTransactionRow[]; initialFilter: string }) {
  const [filter, setFilter] = useState<Filter>(filters.some((item) => item.key === initialFilter) ? initialFilter as Filter : "all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return initialRows.filter((row) => {
      const matchesLedger = filter === "all" || (filter === "credit" && row.direction === "credit") || (filter === "debit" && row.direction === "debit") || (filter === "review" && row.status === "review");
      const matchesStatus = status === "all" || row.status === status;
      const matchesQuery = !term || row.description.toLowerCase().includes(term) || row.category.toLowerCase().includes(term) || row.date.toLowerCase().includes(term);
      return matchesLedger && matchesStatus && matchesQuery;
    });
  }, [filter, initialRows, query, status]);

  const columns: LedgerColumn<DashboardTransactionRow>[] = [
    { id: "date", header: "Date", render: (row) => row.date },
    { id: "description", header: "Description", render: (row) => <span className="ledger-description">{row.description}<small>{row.category}</small></span> },
    { id: "category", header: "Category", render: (row) => <span className="category-label">{row.category}</span> },
    { id: "amount", header: "Amount", className: (row) => `amt-cell ${row.direction}`, render: (row) => <span className={`amt-cell ${row.direction}`}>{row.amountLabel}</span> },
    { id: "status", header: "Status", status: (row) => row.status },
  ];

  return (
    <>
      <div className="ledger-toolbar">
        <div className="filter-row" role="tablist" aria-label="Transaction type">
          {filters.map((item) => <button key={item.key} type="button" role="tab" aria-selected={filter === item.key} className={`filter-chip${filter === item.key ? " active" : ""}`} onClick={() => setFilter(item.key)}>{item.label}</button>)}
        </div>
        <div className="ledger-search-controls">
          <input className="search-box" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search ledger…" aria-label="Search transactions" />
          <select className="status-filter" value={status} onChange={(event) => setStatus(event.currentTarget.value as StatusFilter)} aria-label="Filter by status">
            <option value="all">All statuses</option><option value="ok">Filed</option><option value="review">Review</option><option value="learned">Learned</option>
          </select>
        </div>
      </div>
      <section className="card dashboard-section ledger-card">
        <div className="card-head"><div><span className="folio-kicker">Day book</span><h3>Ledger entries</h3></div><span className="hint">{filteredRows.length} shown</span></div>
        <div className="card-body compact-table"><LedgerTable rows={filteredRows} columns={columns} getRowKey={(row) => row.id} getRowStatus={(row) => row.status === "review" ? "review" : undefined} caption="Ledger transactions" emptyMessage="No transactions match this filter." /></div>
      </section>
    </>
  );
}
