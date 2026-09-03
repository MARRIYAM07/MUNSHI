"use client";
import { useTransition, useRef } from "react";
import { createManualTransaction } from "./actions";

export function IngestForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createManualTransaction(formData);
        formRef.current?.reset();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Add Transaction</h3>
        <span className="hint">Saved directly to your ledger</span>
      </div>
      <div className="card-body">
        <form ref={formRef} action={handleSubmit} className="form-grid">
          <label>
            Amount (PKR)
            <input name="amount" type="number" step="0.01" min="0.01" required />
          </label>
          <label>
            Type
            <select name="direction" required>
              <option value="credit">Money In</option>
              <option value="debit">Money Out</option>
            </select>
          </label>
          <label>
            Date
            <input name="date" type="date" required />
          </label>
          <label>
            Description
            <input name="description" type="text" required placeholder="e.g. Logo design payment" />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}