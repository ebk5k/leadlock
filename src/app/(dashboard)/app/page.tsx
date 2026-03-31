import { ArrowRight, CalendarDays, PhoneCall, TrendingUp, Users } from "lucide-react";

import { CalendarSyncBadge } from "@/components/dashboard/calendar-sync-badge";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { JobStatusBadge } from "@/components/dashboard/job-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentStatusBadge } from "@/components/dashboard/payment-status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { CallLogTable } from "@/components/dashboard/call-log-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { appointmentService } from "@/lib/services/appointment-service";
import { employeeService } from "@/lib/services/employee-service";
import { leadService } from "@/lib/services/lead-service";
import { receptionistService } from "@/lib/services/receptionist-service";
import { formatDateTime } from "@/lib/utils";

export default async function AppOverviewPage() {
  const [leads, appointments, calls, employees] = await Promise.all([
    leadService.getLeads(),
    appointmentService.getAppointments(),
    receptionistService.getCalls(),
    employeeService.getEmployees()
  ]);
  const answeredCalls = calls.filter((call) => call.outcome === "answered").length;
  const activeJobs = appointments.filter(
    (appointment) => appointment.status !== "completed" && appointment.status !== "canceled"
  ).length;
  const syncedAppointments = appointments.filter(
    (appointment) => appointment.calendarSyncStatus === "synced"
  ).length;
  const paidAppointments = appointments.filter((appointment) => appointment.paymentStatus === "paid").length;
  const activeEmployees = employees.filter((employee) => employee.active).length;
  const completedWithProof = appointments.filter(
    (appointment) => appointment.status === "completed" && appointment.proofAssetCount > 0
  ).length;

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
          change={`${activeEmployees} active employees in rotation`}
          tone="success"
          icon={<PhoneCall className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Scheduling"
          label="Active jobs"
          value={String(activeJobs)}
          change={`${syncedAppointments} synced, ${paidAppointments} paid, ${completedWithProof} completed with proof`}
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
          description="Appointments now save dispatch progress, payment state, calendar sync, and proof-of-work details alongside the booking record."
          action={<Badge>Next 3 jobs</Badge>}
        >
          <table className="hidden min-w-full text-sm md:table">
            <thead className="bg-slate-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Calendar</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Proof</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr className="border-t border-border" key={appointment.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{appointment.customerName}</td>
                  <td className="px-5 py-4 text-muted-foreground">{appointment.service}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDateTime(appointment.scheduledFor)}</td>
                  <td className="px-5 py-4">
                    <JobStatusBadge status={appointment.status} />
                  </td>
                  <td className="px-5 py-4">
                    <CalendarSyncBadge status={appointment.calendarSyncStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <PaymentStatusBadge status={appointment.paymentStatus} />
                  </td>
                  <td className="px-5 py-4">
                    {appointment.proofAssetCount > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {appointment.proofAssetCount} proof
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
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
                  <div className="flex flex-col items-end gap-2">
                    <JobStatusBadge status={appointment.status} />
                    <CalendarSyncBadge status={appointment.calendarSyncStatus} />
                    <PaymentStatusBadge status={appointment.paymentStatus} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{formatDateTime(appointment.scheduledFor)}</span>
                  <span>{appointment.assignedEmployee?.name ?? appointment.assignedTo}</span>
                </div>
                {appointment.proofAssetCount > 0 ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    {appointment.proofAssetCount} proof asset{appointment.proofAssetCount === 1 ? "" : "s"} attached
                  </p>
                ) : null}
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
