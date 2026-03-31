import { CalendarSyncBadge } from "@/components/dashboard/calendar-sync-badge";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { JobOpsList } from "@/components/dashboard/job-ops-list";
import { JobStatusBadge } from "@/components/dashboard/job-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentStatusBadge } from "@/components/dashboard/payment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { appointmentService } from "@/lib/services/appointment-service";
import { employeeService } from "@/lib/services/employee-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function AppointmentsPage() {
  const [appointments, employees] = await Promise.all([
    appointmentService.getAppointments(),
    employeeService.getEmployees()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description="A simple appointment queue with dispatch status, assignment, calendar sync, and payment state."
      />
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          title="Scheduled work"
          description="Bookings save into LeadLock first, then carry dispatch, payment, and proof-of-work state alongside the appointment."
          action={<Badge>{appointments.length} upcoming</Badge>}
        >
          <table className="hidden min-w-full text-sm md:table">
            <thead className="bg-slate-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Assigned</th>
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
                  <td className="px-5 py-4 text-muted-foreground">
                    {appointment.assignedEmployee
                      ? `${appointment.assignedEmployee.name} · ${appointment.assignedEmployee.role}`
                      : appointment.assignedTo}
                  </td>
                  <td className="px-5 py-4">
                    <JobStatusBadge status={appointment.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <CalendarSyncBadge status={appointment.calendarSyncStatus} />
                      {appointment.externalCalendarEventId ? (
                        <span className="text-xs text-muted-foreground">
                          {appointment.externalCalendarEventId}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PaymentStatusBadge status={appointment.paymentStatus} />
                        {appointment.paymentAmountCents ? (
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(appointment.paymentAmountCents)}
                          </span>
                        ) : null}
                      </div>
                      {appointment.paymentCheckoutUrl ? (
                        <a
                          className="text-xs font-medium text-primary hover:underline"
                          href={appointment.paymentCheckoutUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open checkout
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {appointment.proofAssetCount > 0 || appointment.completionNotes ? (
                      <div className="space-y-1">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {appointment.proofAssetCount} proof asset
                          {appointment.proofAssetCount === 1 ? "" : "s"}
                        </Badge>
                        {appointment.completionNotes ? (
                          <p className="max-w-[220px] text-xs text-muted-foreground">
                            {appointment.completionNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No proof yet</span>
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
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>{formatDateTime(appointment.scheduledFor)}</p>
                  <p>
                    Assigned to{" "}
                    {appointment.assignedEmployee
                      ? `${appointment.assignedEmployee.name} · ${appointment.assignedEmployee.role}`
                      : appointment.assignedTo}
                  </p>
                  {appointment.paymentAmountCents ? (
                    <p>Payment request {formatCurrency(appointment.paymentAmountCents)}</p>
                  ) : null}
                  {appointment.proofAssetCount > 0 ? (
                    <p>{appointment.proofAssetCount} proof asset{appointment.proofAssetCount === 1 ? "" : "s"} attached</p>
                  ) : null}
                  {appointment.completionNotes ? <p>{appointment.completionNotes}</p> : null}
                  {appointment.paymentCheckoutUrl ? (
                    <a
                      className="font-medium text-primary hover:underline"
                      href={appointment.paymentCheckoutUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open checkout
                    </a>
                  ) : null}
                  {appointment.calendarSyncError ? <p>{appointment.calendarSyncError}</p> : null}
                </div>
              </Card>
            ))}
          </div>
        </DataTableCard>
        <JobOpsList
          appointments={appointments.filter(
            (appointment) => appointment.status !== "completed" && appointment.status !== "canceled"
          )}
          employees={employees}
          description="Use the ops queue to assign a tech, move the job through field execution, and complete it with proof."
          title="Ops queue"
        />
      </div>
    </div>
  );
}
