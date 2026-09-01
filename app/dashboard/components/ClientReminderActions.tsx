"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export type ClientReminderRow = {
  id: string;
  name: string;
  contactEmail: string;
  retainerType: string;
  amountDue: number;
  dueDate?: string | null;
  nextReminderAt?: string | null;
  transactionCount: number;
};

type ReminderState = "idle" | "sent" | "scheduled";

function dueLabel(amountDue: number, dueDate?: string | null) {
  if (!amountDue) return "Paid";
  if (!dueDate) return "Due soon";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} ${Math.abs(diff) === 1 ? "day" : "days"} late`;
  if (diff === 0) return "Due today";
  return `Due in ${diff} ${diff === 1 ? "day" : "days"}`;
}

export function ClientReminderActions({ initialRows }: { initialRows: ClientReminderRow[] }) {
  const [states, setStates] = useState<Record<string, ReminderState>>({});
  const showToast = useToast();

  function updateReminder(client: ClientReminderRow) {
    if (!client.amountDue) return;
    const next = client.dueDate && new Date(`${client.dueDate}T00:00:00`) > new Date() ? "scheduled" : "sent";
    setStates((current) => ({ ...current, [client.id]: next }));
    showToast(next === "sent" ? `Reminder sent to ${client.name}` : `Reminder scheduled for ${client.name}`);
  }

  return (
    <div className="client-list">
      {initialRows.length ? initialRows.map((client) => {
        const state = states[client.id] ?? "idle";
        const paid = client.amountDue === 0;
        const action = paid ? "Settled" : state === "sent" ? "Sent" : state === "scheduled" ? "Scheduled" : client.dueDate && new Date(`${client.dueDate}T00:00:00`) > new Date() ? "Schedule" : "Send reminder";
        const amount = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Math.round(client.amountDue / 100));
        return <article className="client-reminder-row" key={client.id}>
          <div className="client-reminder-name"><strong>{client.name}</strong><span>{client.retainerType}</span></div>
          <div className="client-reminder-amount"><span>Amount due</span><strong>{amount}</strong></div>
          <span className={`due-chip${paid ? " paid" : client.dueDate && new Date(`${client.dueDate}T00:00:00`) < new Date() ? " late" : ""}`}>{dueLabel(client.amountDue, client.dueDate)}</span>
          {client.contactEmail ? <a className="mail-button" href={`mailto:${client.contactEmail}`} aria-label={`Email ${client.name}`}>✉</a> : <span className="mail-button disabled" aria-hidden="true">✉</span>}
          <button type="button" className={`btn small${paid ? " settled" : state === "idle" ? " solid" : ""}`} disabled={paid || state !== "idle"} onClick={() => updateReminder(client)}>{action}</button>
        </article>;
      }) : <p className="empty-ledger">Add a client and an invoice to begin tracking reminders.</p>}
    </div>
  );
}
