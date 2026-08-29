import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { ClientReminderActions } from "@/app/dashboard/components/ClientReminderActions";
import { formatMoney, formatShortDate, resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ClientsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);

  const { data: clients } = await db.from("clients").select("id,name,contact_email,contact_whatsapp,next_reminder_at,retainer_note,source").eq("business_id", businessId).order("name");

  const clientRows = await Promise.all((clients ?? []).map(async (client) => {
    const [{ data: invoices }, { data: transactions }] = await Promise.all([
      db.from("invoices").select("id,status,amount_minor,due_date").eq("business_id", businessId).eq("client_id", client.id),
      db.from("transactions").select("id,amount_minor,direction").eq("business_id", businessId).eq("client_id", client.id),
    ]);

    const arrears = (invoices ?? []).filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + Number(invoice.amount_minor ?? 0), 0);
    const invoiceCount = invoices?.length ?? 0;
    const transactionCount = transactions?.length ?? 0;

    return { ...client, invoiceCount, transactionCount, arrears };
  }));

  return (
    <DashboardFrame title="Clients" subtitle="Contacts, reminders, and outstanding balances" activeItemId="clients">
      <div className="card">
        <div className="card-head">
          <h3>Client list</h3>
          <span className="hint">{clientRows.length} active clients</span>
        </div>
        <div className="card-body">
          <div className="client-row head">
            <span>Client</span>
            <span>Contact</span>
            <span>Next reminder</span>
            <span>Retainer</span>
            <span>Linked</span>
          </div>
          <ClientReminderActions initialRows={clientRows.map((client) => ({
            id: client.id,
            name: client.name,
            source: client.source ?? "Imported",
            contact_email: client.contact_email ?? "—",
            contact_whatsapp: client.contact_whatsapp ?? "—",
            next_reminder_at: client.next_reminder_at,
            retainer_note: client.retainer_note ?? "—",
            invoiceCount: client.invoiceCount,
            transactionCount: client.transactionCount,
            arrears: client.arrears,
          }))} />
        </div>
      </div>
    </DashboardFrame>
  );
}
