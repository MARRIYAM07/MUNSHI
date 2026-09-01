import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { WhatsappSettingsForm } from "@/app/dashboard/settings/SettingsForm";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function SettingsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const { data: row } = await db.from("connected_accounts").select("metadata,status").eq("business_id", businessId).eq("provider", "whatsapp").maybeSingle();
  const metadata = row && typeof row.metadata === "object" && row.metadata && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {};
  const forwardingNumber = typeof metadata.forwarding_number === "string" ? metadata.forwarding_number : typeof metadata.forwardingNumber === "string" ? metadata.forwardingNumber : "";

  return (
    <DashboardFrame title="Settings" subtitle="A few quiet controls for your connected workflow" activeItemId="settings">
      <div className="dashboard-folio"><section className="card dashboard-section settings-card"><div className="card-head"><div><span className="folio-kicker">Forwarding desk</span><h3>WhatsApp forwarding</h3></div><span className="hint">{row?.status ?? "disconnected"}</span></div><div className="card-body"><WhatsappSettingsForm businessId={businessId} initialForwardingNumber={forwardingNumber} connectionStatus={row?.status ?? "disconnected"} /></div></section></div>
    </DashboardFrame>
  );
}
