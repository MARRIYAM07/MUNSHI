"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function ReportExportClient() {
  const [downloading, setDownloading] = useState(false);
  const showToast = useToast();

  function exportSummary() {
    setDownloading(true);
    showToast("Downloading FBR summary (PDF)...");
    window.setTimeout(() => setDownloading(false), 850);
  }

  return <button type="button" className="btn solid" disabled={downloading} onClick={exportSummary}>{downloading ? "Preparing PDF…" : "Export FBR summary (PDF)"}</button>;
}
