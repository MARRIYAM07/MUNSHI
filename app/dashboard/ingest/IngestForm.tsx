"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type DragEvent } from "react";
import { createManualTransaction } from "./actions";

export default function IngestForm() {
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeout.current) window.clearTimeout(timeout.current);
  }, []);

  function beginReading(file?: File) {
    if (!file) return;
    if (!["application/pdf", "image/png", "image/jpeg", "text/csv"].includes(file.type) && !/\.(pdf|png|jpe?g|csv)$/i.test(file.name)) return;
    if (timeout.current) window.clearTimeout(timeout.current);
    setFileName(file.name);
    setReading(true);
    timeout.current = window.setTimeout(() => setReading(false), 1100);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    beginReading(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    beginReading(event.dataTransfer.files?.[0]);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    formData.set("direction", formData.get("type") === "Money Out" ? "debit" : "credit");

    startTransition(async () => {
      await createManualTransaction(formData);
      form.reset();
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ingest method">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "upload"}
          onClick={() => setActiveTab("upload")}
          className={`rounded-md px-4 py-2 font-mono text-sm shadow-sm transition ${activeTab === "upload" ? "bg-[#1b3b22] text-[#f6f4ee]" : "border border-[#cfc8b8] text-[#555042] hover:bg-[#ece7d9]"}`}
        >
          Upload Slips &amp; Statements
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "manual"}
          onClick={() => setActiveTab("manual")}
          className={`rounded-md px-4 py-2 font-mono text-sm shadow-sm transition ${activeTab === "manual" ? "bg-[#1b3b22] text-[#f6f4ee]" : "border border-[#cfc8b8] text-[#555042] hover:bg-[#ece7d9]"}`}
        >
          Manual Entry
        </button>
      </div>

      {activeTab === "upload" ? (
        <section className="mt-4 max-w-3xl space-y-6 rounded-xl border border-[#d8d2c2] bg-[#fcfbf7] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs tracking-widest text-[#7a7668]">STATEMENT &amp; SLIP PARSER</p>
              <h2 className="font-serif text-2xl font-bold text-[#1b3b22]">Upload slips &amp; statements</h2>
            </div>
            <div className="flex gap-2">
              {["PDF", "PNG", "JPG"].map((format) => <span key={format} className="rounded bg-[#e8e4d9] px-2 py-0.5 font-mono text-xs font-semibold text-[#1b3b22]">{format}</span>)}
            </div>
          </div>

          <label
            className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cfc8b8] bg-[#f7f5ed] p-10 text-center text-[#1b3b22] transition hover:border-[#1b3b22] ${dragging || reading ? "border-[#1b3b22]" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="sr-only" />
            <span className="grid h-12 w-12 place-items-center bg-[#1b3b22] font-mono text-2xl text-[#f6f4ee]" aria-hidden="true">{reading ? "◌" : "↥"}</span>
            <strong className="font-serif text-xl">{reading ? "Reading your document..." : dragging ? "Drop your document here" : "Drop a file here, or choose one"}</strong>
            <small className="max-w-[360px] text-xs text-[#7a7668]">{reading ? "Extracting dates, counterparties, and PKR amounts" : "PDF or image receipts and slips up to 5 MB"}</small>
            {fileName ? <span className="font-mono text-xs text-[#4a4639]">{fileName}</span> : null}
          </label>
        </section>
      ) : (
        <div className="rounded-xl border border-[#d8d2c2] bg-[#fcfbf7] p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-[#ece7d9] pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1b3b22]">New Transaction Entry</h2>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#6a6659]">Saved directly to your ledger</p>
            </div>
            <span className="rounded bg-[#e8e4d9] px-2.5 py-1 font-mono text-xs font-semibold text-[#1b3b22]">MANUAL ENTRY</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#4a4639]">Amount (PKR)</label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-sm text-[#7a7668]">Rs</span>
                  <input type="number" step="0.01" required name="amount" placeholder="0.00" className="w-full rounded-lg border border-[#cfc8b8] bg-[#f6f4ee] py-2.5 pl-10 pr-3 font-mono text-sm text-[#1b3b22] placeholder-[#a29e91] focus:border-[#1b3b22] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1b3b22]" />
                </div>
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#4a4639]">Transaction Type</label>
                <select name="type" defaultValue="Money In" className="mt-2 w-full rounded-lg border border-[#cfc8b8] bg-[#f6f4ee] px-3 py-2.5 font-mono text-sm text-[#1b3b22] focus:border-[#1b3b22] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1b3b22]">
                  <option value="Money In">Money In (Income)</option>
                  <option value="Money Out">Money Out (Expense)</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#4a4639]">Transaction Date</label>
                <input type="date" required name="date" defaultValue={new Date().toISOString().split("T")[0]} className="mt-2 w-full rounded-lg border border-[#cfc8b8] bg-[#f6f4ee] px-3 py-2.5 font-mono text-sm text-[#1b3b22] focus:border-[#1b3b22] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1b3b22]" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#4a4639]">Description</label>
                <input type="text" required name="description" placeholder="e.g. Upwork payout, Retainer fee, Server bill" className="mt-2 w-full rounded-lg border border-[#cfc8b8] bg-[#f6f4ee] py-2.5 px-3 font-serif text-sm text-[#1b3b22] placeholder-[#a29e91] focus:border-[#1b3b22] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1b3b22]" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isPending} className="rounded-lg bg-[#1b3b22] px-6 py-2.5 font-mono text-sm font-medium text-[#f6f4ee] transition hover:bg-[#254f2f] focus:outline-none focus:ring-2 focus:ring-[#1b3b22] focus:ring-offset-2 disabled:opacity-50">
                {isPending ? "Recording to Ledger..." : "Record Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export { IngestForm };