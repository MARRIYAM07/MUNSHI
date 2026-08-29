"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export type CategoryOption = {
  id: string;
  name: string;
};

export function CategoryCorrectionDropdown({
  transaction,
  categories,
}: {
  transaction: {
    id: string;
    category_id?: string | null;
    category_name: string;
    confidence: "high" | "med" | "low" | "learned";
    status: "ok" | "review";
    direction: "credit" | "debit";
    amount: number;
    description: string;
  };
  categories: CategoryOption[];
}) {
  const [value, setValue] = useState(transaction.category_name || "Uncategorized");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast();

  async function updateCategory(categoryId: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Failed to update category");
      }

      const category = categories.find((item) => item.id === categoryId);
      const nextLabel = category?.name ?? "Uncategorized";
      setValue(nextLabel);
      setOpen(false);
      showToast(`Categorized as ${nextLabel}`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to update category";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="cat-pill" onClick={() => setOpen((current) => !current)} disabled={saving} aria-expanded={open}>
        <span className={`conf-dot ${transaction.confidence}`} aria-hidden="true" />
        {value}
      </button>
      <div className={`cat-dropdown${open ? " open" : ""}`}>
        {categories.map((category) => (
          <button key={category.id} type="button" disabled={saving} onClick={() => { void updateCategory(category.id); }}>
            {category.name}
          </button>
        ))}
        {error ? <div className="form-status error" role="alert">{error}</div> : null}
      </div>
    </div>
  );
}

