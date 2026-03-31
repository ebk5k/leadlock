import { DataTableCard } from "@/components/dashboard/data-table-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { leadService } from "@/lib/services/lead-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function LeadsPage() {
  const leads = await leadService.getLeads();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description="Every incoming opportunity is staged here first, ready for future CRM expansion."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">New this week</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {leads.filter((lead) => lead.status === "new").length}
          </p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">Qualified or booked</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {leads.filter((lead) => lead.status === "qualified" || lead.status === "booked").length}
          </p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">Estimated pipeline</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {formatCurrency(leads.reduce((sum, lead) => sum + lead.value, 0))}
          </p>
        </Card>
      </div>
      <DataTableCard
        title="Mini CRM lead list"
        description="A lightweight lead pipeline with service, source, timing, and value visibility."
        action={<Badge>{leads.length} active leads</Badge>}
      >
        <table className="hidden min-w-full text-sm md:table">
          <thead className="bg-slate-50 text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Lead</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Source</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Requested</th>
              <th className="px-5 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr className="border-t border-border" key={lead.id}>
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-950">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.location}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{lead.service}</td>
                <td className="px-5 py-4 text-muted-foreground">{lead.source}</td>
                <td className="px-5 py-4">
                  <Badge>{lead.status}</Badge>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{formatDateTime(lead.requestedAt)}</td>
                <td className="px-5 py-4 text-muted-foreground">{formatCurrency(lead.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid gap-3 p-4 md:hidden">
          {leads.map((lead) => (
            <Card className="rounded-2xl border border-border p-4 shadow-none" key={lead.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{lead.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.service}</p>
                </div>
                <Badge>{lead.status}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span>{lead.source}</span>
                <span>{lead.location}</span>
                <span>{formatDateTime(lead.requestedAt)}</span>
                <span>{formatCurrency(lead.value)}</span>
              </div>
            </Card>
          ))}
        </div>
      </DataTableCard>
    </div>
  );
}
