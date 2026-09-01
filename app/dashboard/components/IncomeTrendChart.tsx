type TrendPoint = {
  label: string;
  amount: number;
};

export function IncomeTrendChart({ points }: { points: TrendPoint[] }) {
  const max = Math.max(...points.map((point) => point.amount), 1);

  return (
    <section className="card dashboard-section">
      <div className="card-head">
        <div>
          <span className="folio-kicker">Cash flow ledger</span>
          <h3>Income trend</h3>
        </div>
        <span className="hint">Last 6 months</span>
      </div>
      <div className="card-body trend-chart" aria-label="Income trend for the last six months">
        {points.map((point) => (
          <div className="trend-column" key={point.label}>
            <span className="trend-value">{point.amount > 0 ? `PKR ${Math.round(point.amount / 100).toLocaleString("en-PK")}` : "—"}</span>
            <div className="trend-track" aria-hidden="true">
              <div className="trend-bar" style={{ height: `${Math.max(6, Math.round((point.amount / max) * 100))}%` }} />
            </div>
            <span className="trend-label">{point.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
