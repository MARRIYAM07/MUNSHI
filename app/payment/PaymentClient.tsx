"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { receiptAccept, receiptExtension, receiptMaxBytes } from "@/lib/payment";
import { formatPlanPrice, getPlan, type BillingCycle, type PaidPlan } from "@/lib/plans";

type RailId = "jazzcash" | "easypaisa" | "bank";

type PaymentRail = {
  id: RailId;
  label: string;
  detail: string;
  account: string;
  title: string;
};

type PendingPayment = {
  requestedPlan: PaidPlan;
  requestedCycle: BillingCycle;
  transactionId: string;
  submittedAt?: string;
};

const rails: PaymentRail[] = [
  { id: "jazzcash", label: "JazzCash", detail: "Mobile wallet transfer", account: "0300 1234567", title: "Munshi Pakistan" },
  { id: "easypaisa", label: "EasyPaisa", detail: "Mobile wallet transfer", account: "0300 7654321", title: "Munshi Pakistan" },
  { id: "bank", label: "Bank transfer", detail: "Bank Alfalah IBAN", account: "PK00XXXX0000000000000000", title: "Munshi Pakistan" },
];

function fallbackCopy(value: string) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

export function PaymentClient({
  businessName,
  email,
  name,
  plan,
  cycle,
  initialPending,
}: {
  businessName: string;
  email: string;
  name: string;
  plan: PaidPlan;
  cycle: BillingCycle;
  initialPending?: PendingPayment | null;
}) {
  const [selectedRail, setSelectedRail] = useState<RailId>("jazzcash");
  const [phone, setPhone] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [syncWhatsApp, setSyncWhatsApp] = useState(true);
  const [transactionId, setTransactionId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const [copiedRail, setCopiedRail] = useState<RailId | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(initialPending ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRail, setSubmittedRail] = useState<RailId | null>(null);
  const copyReset = useRef<number | null>(null);
  const phoneInput = useRef<HTMLInputElement | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const showToast = useToast();
  const rail = rails.find((item) => item.id === selectedRail) ?? rails[0];
  const activePlan = pending?.requestedPlan ?? plan;
  const activeCycle = pending?.requestedCycle ?? cycle;
  const planDetails = getPlan(activePlan);

  function updatePhone(value: string) {
    setPhone(value);
    if (syncWhatsApp) setWhatsApp(value);
    if (value.trim()) setPhoneError("");
  }

  function updateSync(checked: boolean) {
    setSyncWhatsApp(checked);
    if (checked) setWhatsApp(phone);
  }

  async function copyAccount() {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rail.account);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) copied = fallbackCopy(rail.account);
    if (!copied) {
      showToast("Could not copy the account number. Please select it manually.");
      return;
    }

    setCopiedRail(rail.id);
    if (copyReset.current) window.clearTimeout(copyReset.current);
    copyReset.current = window.setTimeout(() => setCopiedRail(null), 1800);
    showToast(`${rail.label} account copied.`);
  }

  function selectReceipt(file?: File) {
    if (!file) return;
    if (!receiptExtension(file.type)) {
      setReceipt(null);
      setFormError("Receipt must be a PNG, JPG, WEBP, or PDF file.");
      return;
    }
    if (file.size === 0 || file.size > receiptMaxBytes) {
      setReceipt(null);
      setFormError("Receipt must be smaller than 5 MB.");
      return;
    }
    setReceipt(file);
    setDragging(false);
    setFormError("");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectReceipt(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectReceipt(event.dataTransfer.files?.[0]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!phone.trim()) {
      setPhoneError("Add a phone number so we can confirm your payment.");
      phoneInput.current?.focus();
      return;
    }
    if (transactionId.trim().length < 4) {
      setFormError("Add the payment transaction reference ID before submitting.");
      return;
    }
    if (!receipt) {
      setFormError("Attach a payment receipt before submitting for review.");
      return;
    }

    setSubmitting(true);
    try {
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
      const formData = new FormData();
      formData.set("plan", plan);
      formData.set("cycle", cycle);
      formData.set("rail", selectedRail);
      formData.set("phone", phone.trim());
      formData.set("whatsapp", syncWhatsApp ? phone.trim() : whatsApp.trim());
      formData.set("transactionId", transactionId.trim());
      formData.set("idempotencyKey", idempotencyKey.current);
      formData.set("receipt", receipt);

      const response = await fetch("/api/payments/manual", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409 && result.pending) {
          setPending({
            requestedPlan: result.pending.requestedPlan,
            requestedCycle: result.pending.requestedCycle,
            transactionId: result.pending.transactionId,
            submittedAt: result.pending.submittedAt,
          });
          return;
        }
        setFormError(result.error || "We could not submit your payment for review. Please try again.");
        return;
      }

      setSubmittedRail(selectedRail);
      setPending({
        requestedPlan: result.request.requestedPlan,
        requestedCycle: result.request.requestedCycle,
        transactionId: result.request.transactionId,
        submittedAt: result.request.submittedAt,
      });
    } catch {
      setFormError("We could not submit your payment for review. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pending) {
    const paymentRail = submittedRail ? rails.find((item) => item.id === submittedRail) : null;
    return (
      <main className="payment-page">
        <div className="payment-nav"><a className="wordmark" href="/"><span>MUNSHI<span className="dot">.</span></span></a><a className="payment-back" href="/dashboard/billing">← Back to plan selection</a></div>
        <section className="payment-done card" aria-labelledby="payment-done-title">
          <div className="payment-check" aria-hidden="true">✓</div>
          <span className="folio-kicker">Payment review pending</span>
          <h1 id="payment-done-title">Payment submitted for review</h1>
          <p>We&apos;ll confirm your receipt and activate your plan within 24 hours. Your books remain available on Khata until approval.</p>
          <div className="payment-summary-card">
            <div><span>Requested plan</span><strong>{planDetails.name}</strong></div>
            <div><span>Billing</span><strong>{formatPlanPrice(activePlan, activeCycle)}</strong></div>
            {paymentRail ? <div><span>Method</span><strong>{paymentRail.label}</strong></div> : null}
            <div><span>Business name</span><strong>{businessName}</strong></div>
            <div><span>Reference ID</span><strong>{pending.transactionId}</strong></div>
            {pending.submittedAt ? <div><span>Submitted</span><strong>{new Date(pending.submittedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</strong></div> : null}
            {receipt ? <div><span>Receipt</span><strong>{receipt.name}</strong></div> : null}
          </div>
          <a className="btn solid payment-dashboard-link" href="/dashboard/overview">Continue to your dashboard →</a>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-nav">
        <a className="wordmark" href="/"><span>MUNSHI<span className="dot">.</span></span></a>
        <a className="payment-back" href="/dashboard/billing">← Back to plan selection</a>
      </div>

      <section className="payment-hero">
        <span className="folio-kicker">Step 2 of 3 · payment</span>
        <h1>Activate your plan</h1>
        <p>Pay via JazzCash, EasyPaisa, or bank.</p>
      </section>

      <section className="payment-plan card" aria-label="Selected plan">
        <div><span className="payment-plan-pill">{planDetails.name} — {formatPlanPrice(plan, cycle)}</span><p>{planDetails.description}</p></div>
        <ul className="payment-feature-chips">{planDetails.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      </section>

      <section className="payment-context" aria-label="Payment account context">
        Paying as <strong>{name}</strong>. We&apos;ll notify <strong>{email}</strong> when your receipt is verified.
      </section>

      <form className="payment-grid" onSubmit={submit} noValidate>
        <section className="card payment-panel payment-rails">
          <div className="card-head"><div><span className="folio-kicker">Step 1</span><h2>Send payment to</h2></div><span className="hint">Choose a rail</span></div>
          <div className="card-body">
            <fieldset className="payment-rail-list"><legend className="sr-only">Payment method</legend>{rails.map((item) => <label className={`payment-rail-option${selectedRail === item.id ? " selected" : ""}`} key={item.id}><input type="radio" name="payment_rail" value={item.id} checked={selectedRail === item.id} onChange={() => setSelectedRail(item.id)} /><span className="payment-rail-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="payment-radio" aria-hidden="true" /></label>)}</fieldset>
            <div className="payment-account"><span className="folio-kicker">{rail.detail}</span><strong className="payment-account-number">{rail.account}</strong><span className="payment-account-title">Account title: {rail.title}</span><button className="btn small" type="button" onClick={() => { void copyAccount(); }}>{copiedRail === rail.id ? "Copied" : "Copy"}</button></div>
          </div>
        </section>

        <section className="card payment-panel payment-details">
          <div className="card-head"><div><span className="folio-kicker">Step 2</span><h2>Your details &amp; verification</h2></div><span className="hint">Receipt review</span></div>
          <div className="card-body">
            <div className="payment-input-grid">
              <div className="form-field"><label htmlFor="payment-phone">Phone number</label><input ref={phoneInput} id="payment-phone" name="phone" value={phone} onChange={(event) => updatePhone(event.currentTarget.value)} placeholder="0300 1234567" inputMode="tel" aria-describedby={phoneError ? "payment-phone-error" : undefined} aria-invalid={Boolean(phoneError)} />{phoneError ? <span id="payment-phone-error" className="form-status error" role="alert">{phoneError}</span> : null}</div>
              <div className="form-field"><label htmlFor="payment-whatsapp">WhatsApp <span className="payment-optional">optional</span></label><input id="payment-whatsapp" name="whatsapp" value={whatsApp} onChange={(event) => setWhatsApp(event.currentTarget.value)} placeholder="0300 1234567" inputMode="tel" disabled={syncWhatsApp} /><label className="payment-sync"><input type="checkbox" checked={syncWhatsApp} onChange={(event) => updateSync(event.currentTarget.checked)} /> Use phone for WhatsApp</label></div>
            </div>
            <div className="form-field"><label htmlFor="payment-tid">Transaction Reference ID (TID)</label><input id="payment-tid" name="transaction_id" value={transactionId} onChange={(event) => setTransactionId(event.currentTarget.value)} placeholder="e.g. TX-1234567" /></div>
            <div className={`payment-dropzone${dragging ? " dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              <input id="payment-receipt" type="file" accept={receiptAccept} onChange={onFileChange} />
              <label htmlFor="payment-receipt"><span className="ingest-mark" aria-hidden="true">↥</span><strong>Click to attach a receipt screenshot</strong><small>PNG, JPG, WEBP, or PDF · up to 5 MB</small></label>
              {receipt ? <div className="payment-attachment"><span>{receipt.name}</span><button type="button" onClick={() => setReceipt(null)} aria-label="Remove attached receipt">×</button></div> : null}
            </div>
            {formError ? <p className="form-status error" role="alert">{formError}</p> : null}
            <button className="btn solid payment-submit" type="submit" disabled={submitting}>{submitting ? "Submitting payment…" : "Submit payment for review"}</button>
          </div>
        </section>
      </form>
    </main>
  );
}
