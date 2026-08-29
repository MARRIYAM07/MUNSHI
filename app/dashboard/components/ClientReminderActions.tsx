"use client";

import { useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";

export type ClientReminderRow = {
  id: string;
  name: string;
  source: string;
  contact_email: string;
  contact_whatsapp: string;
  next_reminder_at?: string | null;
  retainer_note: string;
  invoiceCount: number;
  transactionCount: number;
  arrears: number;
};

export function ClientReminderActions({ initialRows }: { initialRows: ClientReminderRow[] }) {
  const [rows, setRows] = useState<Record<string, "idle" | "queued" | "sent">>({});
  const showToast = useToast();

  function queueReminder(id: string, name: string) {
    setRows((current) => ({ ...current, [id]: "queued" }));
    showToast(`Reminder queued for ${name}.`);
    window.setTimeout(() => {
      setRows((current) => ({ ...current, [id]: "sent" }));
    }, 900);
  }

  return (
    <>
      {initialRows.map((client) => {
        const reminderState = rows[client.id] ?? "idle";
        const nextReminder = client.next_reminder_at ? new Date(client.next_reminder_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—";
        const actionLabel = reminderState === "queued" ? "Queued" : reminderState === "sent" ? "Sent" : "Send reminder";

        return (
          <div key={client.id} className="client-row">
            <div className="client-name">
              {client.name}
              <span className="sub">{client.source}</span>
            </div>
            <div>
              <div>{client.contact_email}</div>
              <div>{client.contact_whatsapp}</div>
            </div>
            <div>{nextReminder}</div>
            <div>{client.retainer_note}</div>
            <div>
              <div>{client.invoiceCount} invoices</div>
              <div>{client.transactionCount} txns</div>
              <div>{new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Math.round(client.arrears / 100))}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => queueReminder(client.id, client.name)}
                  disabled={reminderState !== "idle"}
                >
                  {actionLabel}
                </button>
                {reminderState !== "idle" ? (
                  <StatusPill value={reminderState === "sent" ? "ok" : "active"} label={reminderState === "sent" ? "Sent" : "Queued"} />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

