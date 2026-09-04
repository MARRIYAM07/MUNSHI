"use client";

import { useState } from "react";
import { approveStaging, rejectStaging } from "./actions";

type ReviewQueueItem = {
  id: string;
  provider: string;
  description: string | null;
  direction: "credit" | "debit";
  occurred_at: string | null;
  counterparty: string | null;
  amountLabel: string;
};

type Category = {
  id: string;
  name: string;
};

type ReviewQueueClientProps = {
  initialItems: ReviewQueueItem[];
  categories: Category[];
};

export default function ReviewQueueClient({ initialItems, categories }: ReviewQueueClientProps) {
  const [items, setItems] = useState(initialItems);
  const [categoryByItem, setCategoryByItem] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(item: ReviewQueueItem) {
    if (pendingId) return;
    setPendingId(item.id);
    setError(null);
    try {
      await approveStaging(item.id, categoryByItem[item.id] ?? "");
      setItems((current) => current.filter(({ id }) => id !== item.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to approve transaction.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleReject(item: ReviewQueueItem) {
    if (pendingId) return;
    setPendingId(item.id);
    setError(null);
    try {
      await rejectStaging(item.id);
      setItems((current) => current.filter(({ id }) => id !== item.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reject transaction.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="table-wrap">
      {error ? <p className="form-status error" role="alert">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Provider</th>
            <th>Occurred</th>
            <th>Amount</th>
            <th>Category</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const working = pendingId === item.id;
            return (
              <tr key={item.id}>
                <td>
                  <strong>{item.description || "Untitled transaction"}</strong>
                  {item.counterparty ? <div className="hint">{item.counterparty}</div> : null}
                </td>
                <td>{item.provider}</td>
                <td>{item.occurred_at ? new Date(item.occurred_at).toLocaleDateString() : "—"}</td>
                <td className={item.direction === "credit" ? "positive" : "negative"}>{item.amountLabel}</td>
                <td>
                  <select
                    value={categoryByItem[item.id] ?? ""}
                    onChange={(event) => setCategoryByItem((current) => ({ ...current, [item.id]: event.target.value }))}
                    disabled={working}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </td>
                <td>
                  <button type="button" className="btn danger small" disabled={pendingId !== null} onClick={() => { void handleReject(item); }}>
                    Reject
                  </button>
                  <button type="button" className="btn solid small" disabled={pendingId !== null} onClick={() => { void handleApprove(item); }}>
                    {working ? "Saving..." : "Approve"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { ReviewQueueClient };
