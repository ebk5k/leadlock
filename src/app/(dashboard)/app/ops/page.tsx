import { ClientOpsDashboard } from "@/components/dashboard/client-ops-dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { clientOpsService } from "@/lib/services/client-ops-service";

export default async function OpsPage() {
  const snapshot = await clientOpsService.getDashboardSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Internal Ops"
        title="Client Ops"
        description="A business-by-business install control center for provider setup, verification, launch blockers, operator workload, and overdue reminder follow-through."
      />
      <ClientOpsDashboard snapshot={snapshot} />
    </div>
  );
}
