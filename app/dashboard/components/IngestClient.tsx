"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent, type ChangeEvent, type FormEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { createManualTransaction } from "@/app/dashboard/ingest/actions";

const intakeTabs = ["Payoneer / Wise statement", "WhatsApp screenshot", "Receipt photo", "Manual entry"] as const;
const previewRows = [
  { date: "31 Aug", description: "Upwork payout · Nadia Studio", amount: "+PKR 84,500", status: "FILED" },
  { date: "30 Aug", description: "Figma Professional", amount: "-PKR 4,290", status: "FILED" },
  { date: "29 Aug", description: "Wise transfer fee", amount: "-PKR 1,180", status: "REVIEW" },
  { date: "28 Aug", description: "Client milestone · Loom & Co.", amount: "+PKR 61,000", status: "FILED" },
];

function todayInputValue() {
  return new Date().toISOString().split("T")[0];
}

export function IngestClient() {
  const [activeTab, setActiveTab] = useState<(typeof intakeTabs)[number]>(intakeTabs[0]);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeout = useRef<number | null>(null);
  const showToast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => {
    if (timeout.current) window.clearTimeout(timeout.current);
  }, []);

  const isManualEntry = activeTab === "Manual entry";

  function isSupportedFile(file: File) {
    return (
      file.type === "application/pdf" ||
      file.type === "text/csv" ||
      file.type.startsWith("image/") ||
      /\.(pdf|png|jpe?g|webp|csv)$/i.test(file.name)
    );
  }

  function beginReading(file?: File) {
    if (!file) return;
    if (!isSupportedFile(file)) return;
    if (timeout.current) window.clearTimeout(timeout.current);
    setFileName(file.name);
    setExtracted(false);
    setReading(true);
    timeout.current = window.setTimeout(() => {
      setReading(false);
      setExtracted(true);
      showToast("4 entries extracted · added to your ledger");
    }, 1100);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    beginReading(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    beginReading(event.dataTransfer.files?.[0]);
  }

  function handleTabClick(tab: (typeof intakeTabs)[number]) {
    setActiveTab(tab);
    if (tab !== "Manual entry") {
      setExtracted(false);
    }
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await createManualTransaction(formData);
        showToast("Transaction recorded in the ledger");
        formRef.current?.reset();
        const dateInput = formRef.current?.elements.namedItem("date") as HTMLInputElement | undefined;
        if (dateInput) dateInput.value = todayInputValue();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not save transaction");
      }
    });
  }

  return (
    <div className="dashboard-folio ingest-page">
      <div className="intake-tabs" role="tablist" aria-label="Ingestion source">
        {intakeTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`intake-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {!isManualEntry ? (
        <section className="card dashboard-section">
          <div className="card-head">
            <div>
              <span className="folio-kicker">Statement reader</span>
              <h3>{activeTab}</h3>
            </div>
            <span className="hint">PDF · PNG · JPG · CSV</span>
          </div>
          <div className="card-body">
            <label className={`ingest-dropzone${reading ? " reading" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,application/pdf,image/*,text/csv" onChange={handleFileChange} />
              <span className="ingest-mark" aria-hidden="true">{reading ? "◌" : "↥"}</span>
              <strong>{reading ? "Reading your document…" : "Drop a file here, or choose one"}</strong>
              <small>{reading ? "Extracting dates, counterparties, and PKR amounts" : "Munshi reads statements and turns them into clear ledger entries."}</small>
              {fileName ? <span className="mono ingest-file">{fileName}</span> : null}
            </label>
          </div>
        </section>
      ) : null}

      {extracted && !isManualEntry ? (
        <section className="card dashboard-section extracted-ledger">
          <div className="card-head">
            <div>
              <span className="folio-kicker">Extraction complete</span>
              <h3>4 entries found</h3>
            </div>
            <span className="status-tag ok">Added</span>
          </div>
          <div className="table-scroll">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.description}>
                    <td>{row.date}</td>
                    <td>{row.description}</td>
                    <td className={row.amount.startsWith("+") ? "amt-cell credit" : "amt-cell debit"}>{row.amount}</td>
                    <td>
                      <span className={`status-tag ${row.status === "REVIEW" ? "review" : "ok"}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {isManualEntry ? (
        <section className="card dashboard-section">
          <div className="card-head">
            <div>
              <span className="folio-kicker">Manual entry</span>
              <h3>Record Transaction</h3>
            </div>
            <span className="hint">SAVED DIRECTLY TO LEDGER</span>
          </div>
          <div className="card-body">
            <form ref={formRef} onSubmit={handleManualSubmit}>
              <div className="payment-input-grid">
                <div className="form-field">
                  <label htmlFor="amount">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#7a7668]">Rs</span>
                    <input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="pl-9 mono" />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="direction">Transaction Type</label>
                  <select id="direction" name="direction" required defaultValue="">
                    <option value="" disabled>Select type</option>
                    <option value="credit">Money In</option>
                    <option value="debit">Money Out</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="date">Transaction Date</label>
                  <input id="date" name="date" type="date" required defaultValue={todayInputValue()} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="description">Description</label>
                <input id="description" name="description" type="text" required placeholder="What was this for?" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isPending} className="btn solid">
                  {isPending ? "Saving…" : "Save to ledger"}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default IngestClient;
