"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { resolvePaymentVerificationAction, type PaymentVerificationRequest } from "../actions";

type VerificationFilter = "pending" | "approved" | "rejected" | "all";

type ReceiptPreview = {
  request: PaymentVerificationRequest;
  url: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function planName(plan: PaymentVerificationRequest["requestedPlan"]) {
  return plan === "teams" ? "Munshi Teams" : "Munshi Pro";
}

function railName(rail: PaymentVerificationRequest["rail"]) {
  if (rail === "jazzcash") return "JazzCash";
  if (rail === "easypaisa") return "EasyPaisa";
  return "Bank transfer";
}

export function PaymentVerificationQueue({
  requests,
  onResolved,
}: {
  requests: PaymentVerificationRequest[];
  onResolved: () => void;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<VerificationFilter>("pending");
  const [receipt, setReceipt] = useState<ReceiptPreview | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [rejecting, setRejecting] = useState<PaymentVerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleRequests = requests.filter((request) => filter === "all" || request.status === filter);

  function previewReceipt(request: PaymentVerificationRequest) {
    setReceiptError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/staff/payment-verifications/${request.id}/receipt`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({})) as { error?: string; url?: string };
        if (!response.ok || !payload.url) throw new Error(payload.error || "Receipt preview is unavailable.");
        setReceipt({ request, url: payload.url });
      } catch (error) {
        setReceiptError(error instanceof Error ? error.message : "Receipt preview is unavailable.");
      }
    });
  }

  function resolveRequest(request: PaymentVerificationRequest, decision: "approve" | "reject", reason?: string) {
    setDecisionError("");
    setPendingId(request.id);
    startTransition(async () => {
      const result = await resolvePaymentVerificationAction(request.id, decision, reason);
      setPendingId(null);
      if (!result.ok) {
        setDecisionError(result.message);
        return;
      }
      setRejecting(null);
      setRejectionReason("");
      onResolved();
      router.refresh();
    });
  }

  const receiptIsPdf = receipt?.request.receiptContentType === "application/pdf";

  return (
    <section className="panel payment-verification-panel">
      <div className="panel-head">
        <div>
          <h3>Payment verifications</h3>
          <span className="sub">Manual payment review queue</span>
        </div>
        <div className="chip-group" aria-label="Payment verification filter">
          {(["pending", "approved", "rejected", "all"] as const).map((value) => (
            <button
              className={`chip-filter ${filter === value ? "active" : ""}`}
              key={value}
              type="button"
              onClick={() => setFilter(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {receiptError ? <p className="verification-error" role="alert">{receiptError}</p> : null}
      {decisionError ? <p className="verification-error" role="alert">{decisionError}</p> : null}

      {visibleRequests.length ? (
        <div className="verification-table-wrap">
          <table className="verification-table">
            <thead>
              <tr>
                <th>Subscriber / business</th>
                <th>Requested plan</th>
                <th>Rail</th>
                <th>TID</th>
                <th>Receipt</th>
                <th>Submitted</th>
                <th>Status / action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request) => {
                const resolving = pendingId === request.id && isPending;
                return (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.subscriberName}</strong>
                      <span className="verification-meta">{request.businessName}</span>
                    </td>
                    <td>
                      <strong>{planName(request.requestedPlan)}</strong>
                      <span className="verification-meta">{request.requestedCycle}</span>
                    </td>
                    <td>{railName(request.rail)}</td>
                    <td className="mono">{request.transactionReference}</td>
                    <td>
                      <button className="btn ghost small" type="button" disabled={isPending} onClick={() => previewReceipt(request)}>
                        View receipt
                      </button>
                    </td>
                    <td className="mono">{formatDate(request.submittedAt)}</td>
                    <td>
                      {request.status === "pending" ? (
                        <div className="verification-actions">
                          <button className="btn small" type="button" disabled={resolving} onClick={() => resolveRequest(request, "approve")}>
                            {resolving ? "Saving…" : "Verify & activate"}
                          </button>
                          <button className="btn small danger" type="button" disabled={resolving} onClick={() => { setDecisionError(""); setRejectionReason(""); setRejecting(request); }}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className={`status-pill ${request.status === "approved" ? "active" : "expired"}`}>{request.status}</span>
                          {request.rejectionReason ? <span className="verification-meta">{request.rejectionReason}</span> : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="verification-empty">No {filter === "all" ? "payment verification requests" : `${filter} payment verification requests`}.</p>
      )}

      <Modal
        open={Boolean(receipt)}
        title={receipt ? `Receipt · ${receipt.request.transactionReference}` : "Receipt"}
        onClose={() => setReceipt(null)}
      >
        {receipt ? (
          <div className="receipt-preview">
            {receiptIsPdf ? (
              <iframe src={receipt.url} title={`Receipt for ${receipt.request.transactionReference}`} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receipt.url} alt={`Payment receipt for ${receipt.request.transactionReference}`} />
            )}
            <a className="btn ghost small" href={receipt.url} target="_blank" rel="noreferrer">Open in new tab</a>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        title="Reject payment verification?"
        onClose={() => { if (!isPending) { setRejecting(null); setRejectionReason(""); } }}
        footer={
          <>
            <button className="btn ghost" type="button" disabled={isPending} onClick={() => { setRejecting(null); setRejectionReason(""); }}>Cancel</button>
            <button
              className="btn danger"
              type="button"
              disabled={isPending || !rejectionReason.trim()}
              onClick={() => rejecting && resolveRequest(rejecting, "reject", rejectionReason)}
            >
              {isPending ? "Rejecting…" : "Reject / downgrade to Khata"}
            </button>
          </>
        }
      >
        <p>This keeps the business on Khata and notifies active members. State the reason for the rejection.</p>
        <div className="form-field">
          <label htmlFor="payment-rejection-reason">Reason</label>
          <textarea
            id="payment-rejection-reason"
            rows={4}
            maxLength={500}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="For example: the reference does not match the submitted receipt."
          />
        </div>
      </Modal>
    </section>
  );
}
