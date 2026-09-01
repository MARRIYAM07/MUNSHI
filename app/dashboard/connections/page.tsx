import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { ConnectedAccountsClient, type ConnectedAccountRow } from "@/app/dashboard/components/ConnectedAccountsClient";
import { CONNECTION_DISPLAY } from "@/lib/connections";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ConnectionsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const { data: rows } = await db.from("connected_accounts").select("id,provider,status,last_synced_at,enabled").eq("business_id", businessId).order("provider");
  const accounts: ConnectedAccountRow[] = (rows ?? []).map((row) => {
    const display = CONNECTION_DISPLAY[row.provider];
    return { id: row.id, provider: row.provider, status: row.status, enabled: Boolean(row.enabled), last_synced_at: row.last_synced_at, name: display.name, transport: display.transport };
  });
  return (
    <DashboardFrame title="Connected accounts" subtitle="Keep every source synced to one familiar ledger" activeItemId="connections">
      <div className="dashboard-folio"><ConnectedAccountsClient businessId={businessId} initialRows={accounts} /></div>
    </DashboardFrame>
  );
}
