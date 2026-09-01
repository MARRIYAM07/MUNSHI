"use client";

import { useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";

export type ApprovalActionRow = {
  id: string;
  kind: "bill" | "payout";
  title: string;
  amount_minor: number;
  due_date?: string | null;
  status: "pending" | "approved" | "declined";
  amountLabel: string;
};

export function ApprovalActionsClient({ initialApprovals }: { initialApprovals: ApprovalActionRow[] }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const showToast = useToast();

  async function resolveApproval(id: string, action: "approve" | "decline") {
    const current = approvals.find((approval) => approval.id === id);
    if (!current || pendingId) return;
    const nextStatus = action === "approve" ? "approved" : "declined";
    setPendingId(id);
    setApprovals((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    try {
      const response = await fetch(`/api/approvals/${id}/${action}`, { method: "POST" });
      if (!response.ok) throw new Error(`Unable to ${action} approval.`);
      showToast(action === "approve" ? "Approval logged in your ledger." : "Approval declined.");
    } catch (error) {
      setApprovals((items) => items.map((item) => item.id === id ? current : item));
      showToast(error instanceof Error ? error.message : `Unable to ${action} approval.`);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="approval-grid">
      {approvals.map((approval) => {
        const resolved = approval.status !== "pending";
        const working = pendingId === approval.id;
        const label = approval.kind === "bill" ? "Approve & log" : "Confirm";
        return <article key={approval.id} className={`approval-card${resolved ? " resolved" : ""}`}>
          <div className="approval-head"><span className="approval-tag">{approval.kind === "bill" ? "Pending bill" : "Payout"}</span>{approval.status === "pending" ? <StatusPill value="review" label="Pending" /> : <StatusPill value={approval.status === "approved" ? "ok" : "review"} label={approval.status === "approved" ? "Approved" : "Declined"} />}</div>
          <h3 className="approval-title">{approval.title}</h3>
          <strong className="approval-amt">{approval.amountLabel}</strong>
          <p className="approval-due">{approval.due_date ? `Due ${new Date(approval.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" })}` : "No due date recorded"}</p>
          {resolved ? <div className={`approval-status ${approval.status}`}><span>{approval.status === "approved" ? "✓" : "×"}</span>{approval.status === "approved" ? "Approved and logged" : "Declined"}</div> : <div className="approval-actions"><button type="button" className="btn danger small" disabled={working} onClick={() => { void resolveApproval(approval.id, "decline"); }}>Decline</button><button type="button" className="btn solid small" disabled={working} onClick={() => { void resolveApproval(approval.id, "approve"); }}>{working ? "Saving…" : label}</button></div>}
        </article>;
      })}
    </div>
  );
}
