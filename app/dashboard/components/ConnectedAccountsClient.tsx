"use client";

import { useState } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useToast } from "@/components/ui/Toast";

export type ConnectedAccountRow = {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
  last_synced_at?: string | null;
  name: string;
  transport: string;
  connected: boolean;
};

export function ConnectedAccountsClient({ businessId, initialRows }: { businessId: string; initialRows: ConnectedAccountRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const showToast = useToast();

  async function toggleAccount(account: ConnectedAccountRow, nextEnabled: boolean) {
    setPendingProvider(account.provider);
    setFeedback((current) => ({ ...current, [account.provider]: "" }));

    try {
      const response = await fetch(`/api/connected-accounts/${account.provider}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, enabled: nextEnabled }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to update the connection.");
      }

      const nextStatus = nextEnabled ? "connected" : account.status === "error" ? "error" : "disconnected";
      setRows((current) => current.map((row) => row.provider === account.provider ? { ...row, enabled: nextEnabled, status: nextStatus, connected: nextEnabled } : row));
      showToast(nextEnabled ? `${account.name} enabled.` : `${account.name} paused.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the connection.";
      setFeedback((current) => ({ ...current, [account.provider]: message }));
      showToast(message);
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Connected accounts</h3>
        <span className="hint">Live status</span>
      </div>
      <div className="card-body">
        {rows.map((row) => {
          const providerError = feedback[row.provider];
          const toggling = pendingProvider === row.provider;

          return (
            <div key={row.id} className="acct-row">
              <div className="acct-name">
                <div className="acct-badge">{row.name.slice(0, 2).toUpperCase()}</div>
                <div className="acct-meta">
                  <div className="nm">{row.name}</div>
                  <div className="sub">{row.transport}</div>
                </div>
              </div>
              <div className="acct-meta" style={{ textAlign: "right" }}>
                <div className="nm">{row.enabled ? "Connected" : row.status === "error" ? "Needs attention" : "Disconnected"}</div>
                <div className="sub">
                  {row.last_synced_at ? new Date(row.last_synced_at).toLocaleString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Karachi" }) : "Not synced yet"}
                  {toggling ? " • syncing…" : providerError ? " • error" : ""}
                </div>
                {providerError ? <div className="form-status error" role="alert">{providerError}</div> : null}
              </div>
              <ToggleSwitch
                checked={row.enabled}
                disabled={toggling}
                onCheckedChange={async (checked) => {
                  await toggleAccount(row, checked);
                }}
                label={`Enable ${row.name}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

