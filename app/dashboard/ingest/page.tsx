import { DashboardFrame } from "@/app/dashboard/DashboardFrame";
import { IngestForm } from "./IngestForm";

export default function IngestPage() {
  return (
    <DashboardFrame title="Manual Ingest" subtitle="Log a transaction by hand" activeItemId="ingest">
      <IngestForm />
    </DashboardFrame>
  );
}