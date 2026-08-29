"use client";

import { useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";

export type ApprovalActionRow = {
  id: string;
  kind: string;
  title: string;
  amount_minor: number;
  due_date?: string | null;
  status: "pending" | "approved" | "declined";
  amountLabel: string;
};

export function ApprovalActionsClient({ initialApprovals }: { initialApprovals: ApprovalActionRow[] }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const showToast = useToast();

  async function resolveApproval(id: string, action: "approve" | "decline") {
    const current = approvals.find((approval) => approval.id === id);
    if (!current) {
      return;
    }

    const nextStatus = action === "approve" ? "approved" : "declined";
    setApprovals((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus } : item));

    try {
      const response = await fetch(`/api/approvals/${id}/${action}`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Unable to ${action} approval.`);
      }
      showToast(action === "approve" ? "Approval recorded." : "Approval declined.");
    } catch (error) {
      setApprovals((items) => items.map((item) => item.id === id ? current : item));
      const message = error instanceof Error ? error.message : `Unable to ${action} approval.`;
      showToast(message);
    }
  }

  return (
    <>
      {approvals.map((approval) => {
        const isResolved = approval.status !== "pending";
        const statusLabel = approval.status === "approved" ? "Approved" : approval.status === "declined" ? "Declined" : "Pending";

        return (
          <div key={approval.id} className={`approval-card${isResolved ? " resolved" : ""}`}>
            <div className="approval-head">
              <span className="approval-tag">{approval.kind}</span>
              <StatusPill value={approval.status === "approved" ? "ok" : approval.status === "declined" ? "review" : "review"} label={statusLabel} />
            </div>
            <div className="approval-title">{approval.title}</div>
            <div className="approval-amt">{approval.amountLabel}</div>
            <div className="approval-due">Due: {approval.due_date ? new Date(approval.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "No due date"}</div>
            {approval.status === "pending" ? (
              <div className="approval-actions">
                <button type="button" className="btn solid small" onClick={() => { void resolveApproval(approval.id, "approve"); }}>
                  Approve
                </button>
                <button type="button" className="btn danger small" onClick={() => { void resolveApproval(approval.id, "decline"); }}>
                  Decline
                </button>
              </div>
            ) : (
              <div className="approval-status show" style={{ color: approval.status === "approved" ? "var(--forest)" : "var(--red)" }}>
                {approval.status === "approved" ? "✓ Approved and logged to ledger" : "✕ Declined"}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

