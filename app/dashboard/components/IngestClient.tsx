"use client";

import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useToast } from "@/components/ui/Toast";

const intakeTabs = ["Payoneer / Wise statement", "WhatsApp screenshot", "Receipt photo"] as const;
const previewRows = [
  { date: "31 Aug", description: "Upwork payout · Nadia Studio", amount: "+PKR 84,500", status: "FILED" },
  { date: "30 Aug", description: "Figma Professional", amount: "-PKR 4,290", status: "FILED" },
  { date: "29 Aug", description: "Wise transfer fee", amount: "-PKR 1,180", status: "REVIEW" },
  { date: "28 Aug", description: "Client milestone · Loom & Co.", amount: "+PKR 61,000", status: "FILED" },
];

export function IngestClient() {
  const [activeTab, setActiveTab] = useState<(typeof intakeTabs)[number]>(intakeTabs[0]);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const timeout = useRef<number | null>(null);
  const showToast = useToast();

  useEffect(() => () => {
    if (timeout.current) window.clearTimeout(timeout.current);
  }, []);

  function beginReading(file?: File) {
    if (!file) return;
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

  return (
    <div className="dashboard-folio ingest-page">
      <div className="intake-tabs" role="tablist" aria-label="Ingestion source">
        {intakeTabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`intake-tab${activeTab === tab ? " active" : ""}`} onClick={() => { setActiveTab(tab); setExtracted(false); }}>{tab}</button>)}
      </div>

      <section className="card dashboard-section">
        <div className="card-head">
          <div><span className="folio-kicker">Statement reader</span><h3>{activeTab}</h3></div>
          <span className="hint">PDF · PNG · JPG · CSV</span>
        </div>
        <div className="card-body">
          <label className={`ingest-dropzone${reading ? " reading" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <input type="file" accept=".pdf,.csv,image/png,image/jpeg" onChange={handleFileChange} />
            <span className="ingest-mark" aria-hidden="true">{reading ? "◌" : "↥"}</span>
            <strong>{reading ? "Reading your document…" : "Drop a file here, or choose one"}</strong>
            <small>{reading ? "Extracting dates, counterparties, and PKR amounts" : "Munshi reads statements and turns them into clear ledger entries."}</small>
            {fileName ? <span className="mono ingest-file">{fileName}</span> : null}
          </label>
        </div>
      </section>

      {extracted ? <section className="card dashboard-section extracted-ledger">
        <div className="card-head"><div><span className="folio-kicker">Extraction complete</span><h3>4 entries found</h3></div><span className="status-tag ok">Added</span></div>
        <div className="table-scroll"><table className="ledger-table"><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>{previewRows.map((row) => <tr key={row.description}><td>{row.date}</td><td>{row.description}</td><td className={row.amount.startsWith("+") ? "amt-cell credit" : "amt-cell debit"}>{row.amount}</td><td><span className={`status-tag ${row.status === "REVIEW" ? "review" : "ok"}`}>{row.status}</span></td></tr>)}</tbody></table></div>
      </section> : null}
    </div>
  );
}
