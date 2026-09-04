import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { IngestClient } from "@/app/dashboard/components/IngestClient";

export default function IngestPage() {
  return (
    <DashboardFrame title="Ingest" subtitle="Bring statements, screenshots, and receipts into the ledger" activeItemId="ingest">
      <IngestClient />
    </DashboardFrame>
  );
}