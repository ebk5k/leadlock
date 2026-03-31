import { CallLogTable } from "@/components/dashboard/call-log-table";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { receptionistService } from "@/lib/services/receptionist-service";
import { formatDateTime } from "@/lib/utils";

export default async function CallsPage() {
  const [calls, interactions] = await Promise.all([
    receptionistService.getCalls(),
    receptionistService.getInteractions()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communications"
        title="Calls"
        description="Persisted call logs, transcript previews, statuses, and outcomes from the webhook ingestion path."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">Calls answered</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {calls.filter((call) => call.outcome === "answered").length}
          </p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">Missed calls</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {calls.filter((call) => call.outcome === "missed").length}
          </p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">Voicemails / unknown</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {calls.filter((call) => call.outcome === "voicemail" || call.outcome === "unknown").length}
          </p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTableCard
          title="Call log"
          description="Transcript snippets and outcomes are designed to be readable on desktop and mobile."
          action={<Badge>{calls.length} calls</Badge>}
        >
          <CallLogTable calls={calls} />
        </DataTableCard>
        <Card className="rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-slate-950">Recent handoffs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Latest AI or receptionist-style actions attached to calls.</p>
          <div className="mt-5 space-y-4">
            {interactions.map((interaction) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={interaction.id}>
                <p className="font-medium text-slate-950">{interaction.customerName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{interaction.intent}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{interaction.action}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(interaction.timestamp)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
