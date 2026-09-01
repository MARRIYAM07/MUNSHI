import { formatMoney } from "@/lib/dashboard";

type ClientShare = {
  id: string;
  name: string;
  amount: number;
  share: number;
};

export function ClientIncomeDistribution({ rows }: { rows: ClientShare[] }) {
  return (
    <section className="card dashboard-section">
      <div className="card-head">
        <div>
          <span className="folio-kicker">Client book</span>
          <h3>Income by client</h3>
        </div>
        <span className="hint">Share of income</span>
      </div>
      <div className="card-body distribution-list">
        {rows.length ? rows.map((client) => (
          <div className="distribution-row" key={client.id}>
            <div className="distribution-meta"><span>{client.name}</span><strong>{client.share}%</strong></div>
            <div className="distribution-track" aria-label={`${client.name} represents ${client.share}% of income`}><div className="distribution-bar" style={{ width: `${Math.max(client.share, 3)}%` }} /></div>
            <span className="distribution-amount">{formatMoney(client.amount)}</span>
          </div>
        )) : <p className="empty-ledger">Client income will appear once transactions are linked.</p>}
      </div>
    </section>
  );
}
