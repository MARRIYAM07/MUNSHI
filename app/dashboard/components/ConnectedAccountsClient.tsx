"use client";

import { useState } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useToast } from "@/components/ui/Toast";

const services = [
  { provider: "upwork", name: "Upwork", mark: "Up", transport: "Marketplace feed" },
  { provider: "fiverr", name: "Fiverr", mark: "Fi", transport: "Marketplace feed" },
  { provider: "payoneer", name: "Payoneer", mark: "Py", transport: "Statement sync" },
  { provider: "wise", name: "Wise", mark: "Wi", transport: "Statement sync" },
  { provider: "jazzcash", name: "JazzCash", mark: "Jz", transport: "SMS forwarding" },
  { provider: "easypaisa", name: "EasyPaisa", mark: "Ep", transport: "SMS forwarding" },
  { provider: "bank_sms", name: "HBL Bank Feed", mark: "Hb", transport: "Bank feed" },
  { provider: "whatsapp", name: "WhatsApp forwarding", mark: "Wa", transport: "Forwarded messages" },
] as const;

export type ConnectedAccountRow = {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
  last_synced_at?: string | null;
  name: string;
  transport: string;
};

export function ConnectedAccountsClient({ businessId, initialRows }: { businessId: string; initialRows: ConnectedAccountRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [simulated, setSimulated] = useState<Record<string, boolean>>({});
  const showToast = useToast();

  async function toggleAccount(account: ConnectedAccountRow, nextEnabled: boolean) {
    setPendingProvider(account.provider);
    try {
      const response = await fetch(`/api/connected-accounts/${account.provider}/toggle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: businessId, enabled: nextEnabled }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to update the connection.");
      }
      setRows((current) => current.map((row) => row.provider === account.provider ? { ...row, enabled: nextEnabled, status: nextEnabled ? "connected" : row.status === "error" ? "error" : "disconnected" } : row));
      showToast(nextEnabled ? `${account.name} sync is active.` : `${account.name} sync is paused.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update the connection.");
    } finally {
      setPendingProvider(null);
    }
  }

  function connect(service: (typeof services)[number]) {
    setPendingProvider(service.provider);
    showToast(`Connecting to ${service.name}...`);
    window.setTimeout(() => {
      setSimulated((current) => ({ ...current, [service.provider]: true }));
      setPendingProvider(null);
      showToast(`${service.name} is ready to finish setup.`);
    }, 700);
  }

  return (
    <section className="service-grid" aria-label="Connected account services">
      {services.map((service) => {
        const row = rows.find((account) => account.provider === service.provider);
        const connecting = pendingProvider === service.provider;
        const isConnected = Boolean(row?.enabled || simulated[service.provider]);
        return <article className={`service-card${isConnected ? " connected" : ""}`} key={service.provider}>
          <div className="service-head"><span className="service-mark">{service.mark}</span><span className={`service-state${isConnected ? " active" : ""}`}>{isConnected ? "Active" : "Not connected"}</span></div>
          <h3>{service.name}</h3><p>{row?.last_synced_at ? `Synced ${new Date(row.last_synced_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Karachi" })}` : service.transport}</p>
          <div className="service-footer">
            {row ? <><span className="mono">{row.status === "error" ? "Needs attention" : row.enabled ? "Live sync" : "Paused"}</span><ToggleSwitch checked={row.enabled} disabled={connecting} onCheckedChange={(checked) => { void toggleAccount(row, checked); }} label={`Toggle ${service.name} sync`} /></> : <button type="button" className="btn small" disabled={connecting} onClick={() => connect(service)}>{connecting ? "Connecting…" : isConnected ? "Connected" : "Connect"}</button>}
          </div>
        </article>;
      })}
    </section>
  );
}
