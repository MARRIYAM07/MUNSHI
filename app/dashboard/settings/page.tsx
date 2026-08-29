import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { WhatsappSettingsForm } from "@/app/dashboard/settings/SettingsForm";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function SettingsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const [{ data: row }, { data: business }] = await Promise.all([
    db.from("connected_accounts").select("metadata,status,enabled").eq("business_id", businessId).eq("provider", "whatsapp").maybeSingle(),
    db.from("businesses").select("plan").eq("id", businessId).single(),
  ]);
  const metadata = row && typeof row.metadata === "object" && row.metadata && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {};
  const forwardingNumber = typeof metadata.forwarding_number === "string" ? metadata.forwarding_number : typeof metadata.forwardingNumber === "string" ? metadata.forwardingNumber : "";

  return (
    <DashboardFrame title="Settings" subtitle="WhatsApp forwarding and connected workflow" activeItemId="settings">
      <div className="card">
        <div className="card-head">
          <h3>WhatsApp forwarding</h3>
          <span className="hint">{row?.status ?? "disconnected"}</span>
        </div>
        <div className="card-body">
          <WhatsappSettingsForm
            businessId={businessId}
            initialForwardingNumber={forwardingNumber}
            connectionStatus={row?.status ?? "disconnected"}
          />
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Plan &amp; Billing</h3>
          <span className="hint">Current plan</span>
        </div>
        <div className="card-body">
          <div className="report-row">
            <span>Plan</span>
            <strong>{business?.plan === "khata" ? "Khata" : business?.plan === "pro" ? "Pro" : "Teams"}</strong>
          </div>
          <a className="btn" href="/payment">Manage plan &amp; billing</a>
        </div>
      </div>
    </DashboardFrame>
  );
}
