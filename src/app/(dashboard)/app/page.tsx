import { ArrowRight, CalendarDays, PhoneCall, TrendingUp, Users } from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CallLogTable } from "@/components/dashboard/call-log-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { appointmentService } from "@/lib/services/appointment-service";
import { leadService } from "@/lib/services/lead-service";
import { receptionistService } from "@/lib/services/receptionist-service";
import { formatDateTime } from "@/lib/utils";

export default async function AppOverviewPage() {
  const [leads, appointments, calls] = await Promise.all([
    leadService.getLeads(),
    appointmentService.getAppointments(),
    receptionistService.getCalls()
  ]);
  const answeredCalls = calls.filter((call) => call.outcome === "answered").length;
  const bookedAppointments = appointments.filter((appointment) => appointment.status !== "completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard overview"
        description="A quick snapshot of lead volume, bookings, and persisted call activity."
        action={<Button>Export Snapshot</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="Pipeline"
          label="Total leads"
          value={String(leads.length)}
          change={`${leads.filter((lead) => lead.status === "new").length} new this week`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Calls"
          label="Calls answered"
          value={String(answeredCalls)}
          change="1 same-day booking"
          tone="success"
          icon={<PhoneCall className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Scheduling"
          label="Booked appointments"
          value={String(bookedAppointments)}
          change={`${appointments.filter((appointment) => appointment.status === "pending").length} pending review`}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Conversion"
          label="Lead-to-booking ratio"
          value={`${leads.length === 0 ? 0 : Math.round((appointments.length / leads.length) * 100)}%`}
          change="Computed from saved data"
          tone="success"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTableCard
          title="Upcoming appointments"
          description="Mock appointments are async-backed now so a real API can slide in later."
          action={<Badge>Next 3 jobs</Badge>}
        >
          <table className="hidden min-w-full text-sm md:table">
            <thead className="bg-slate-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr className="border-t border-border" key={appointment.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{appointment.customerName}</td>
                  <td className="px-5 py-4 text-muted-foreground">{appointment.service}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDateTime(appointment.scheduledFor)}</td>
                  <td className="px-5 py-4">
                    <Badge>{appointment.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid gap-3 p-4 md:hidden">
            {appointments.map((appointment) => (
              <Card className="rounded-2xl border border-border p-4 shadow-none" key={appointment.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{appointment.customerName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{appointment.service}</p>
                  </div>
                  <Badge>{appointment.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{formatDateTime(appointment.scheduledFor)}</span>
                  <span>{appointment.assignedTo}</span>
                </div>
              </Card>
            ))}
          </div>
        </DataTableCard>
        <DataTableCard
          title="Latest calls"
          description="A quick look at recent calls, statuses, outcomes, and transcript previews."
          action={<Badge>{calls.length} total</Badge>}
        >
          <CallLogTable calls={calls} />
        </DataTableCard>
      </div>
    </div>
  );
}
