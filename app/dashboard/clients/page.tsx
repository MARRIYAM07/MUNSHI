import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { ClientReminderActions, type ClientReminderRow } from "@/app/dashboard/components/ClientReminderActions";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { requireMember } from "@/lib/supabase";

export default async function ClientsPage() {
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const [{ data: clients }, { data: invoices }, { data: transactions }] = await Promise.all([
    db.from("clients").select("id,name,contact_email,retainer_note,source,next_reminder_at").eq("business_id", businessId).order("name"),
    db.from("invoices").select("client_id,status,amount_minor,due_date").eq("business_id", businessId).order("due_date", { ascending: true }),
    db.from("transactions").select("client_id,id").eq("business_id", businessId),
  ]);
  const invoicesByClient = new Map<string, typeof invoices>();
  (invoices ?? []).forEach((invoice) => invoicesByClient.set(invoice.client_id, [...(invoicesByClient.get(invoice.client_id) ?? []), invoice]));
  const transactionCountByClient = new Map<string, number>();
  (transactions ?? []).forEach((transaction) => {
    if (transaction.client_id) transactionCountByClient.set(transaction.client_id, (transactionCountByClient.get(transaction.client_id) ?? 0) + 1);
  });
  const clientRows: ClientReminderRow[] = (clients ?? []).map((client) => {
    const clientInvoices = invoicesByClient.get(client.id) ?? [];
    const openInvoices = clientInvoices.filter((invoice) => invoice.status !== "paid");
    return {
      id: client.id,
      name: client.name,
      contactEmail: client.contact_email ?? "",
      retainerType: client.retainer_note || (client.source?.toLowerCase().includes("retainer") ? "Retainer · monthly" : "Project milestone"),
      amountDue: openInvoices.reduce((sum, invoice) => sum + Number(invoice.amount_minor ?? 0), 0),
      dueDate: openInvoices[0]?.due_date ?? null,
      nextReminderAt: client.next_reminder_at,
      transactionCount: transactionCountByClient.get(client.id) ?? 0,
    };
  });
  const owing = clientRows.filter((client) => client.amountDue > 0).length;

  return (
    <DashboardFrame title="Clients & reminders" subtitle="Drafted reminders, sent with one tap" activeItemId="clients">
      <div className="dashboard-folio">
        <section className="client-ledger-header"><span className="folio-kicker">Receivables</span><h2>{owing} {owing === 1 ? "client owes" : "clients owe"} you money</h2><p>Drafted reminders, sent with one tap</p></section>
        <section className="card dashboard-section clients-card">
          <div className="card-head"><div><span className="folio-kicker">Client book</span><h3>Outstanding work</h3></div><span className="hint">{clientRows.length} clients</span></div>
          <ClientReminderActions initialRows={clientRows} />
        </section>
      </div>
    </DashboardFrame>
  );
}
