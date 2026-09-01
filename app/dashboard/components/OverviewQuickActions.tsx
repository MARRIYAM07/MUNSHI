"use client";

import { useToast } from "@/components/ui/Toast";

export function OverviewQuickActions() {
  const showToast = useToast();

  return (
    <section className="card quick-actions dashboard-section">
      <div className="card-head">
        <div>
          <span className="folio-kicker">Desk actions</span>
          <h3>Quick actions</h3>
        </div>
      </div>
      <div className="card-body quick-action-list">
        <a className="quick-action" href="/dashboard/ingest"><span>↥</span><span><strong>Forward statement</strong><small>Read a new statement into your ledger.</small></span></a>
        <a className="quick-action" href="/dashboard/categorize"><span>✦</span><span><strong>Review uncategorized</strong><small>Teach Munshi the right category.</small></span></a>
        <button className="quick-action" type="button" onClick={() => showToast("Summary is ready to export.")}><span>⇩</span><span><strong>Export summary</strong><small>Prepare a compact ledger handoff.</small></span></button>
      </div>
    </section>
  );
}
