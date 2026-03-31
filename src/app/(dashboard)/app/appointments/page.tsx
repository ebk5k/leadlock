import { DataTableCard } from "@/components/dashboard/data-table-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { appointmentService } from "@/lib/services/appointment-service";
import { formatDateTime } from "@/lib/utils";

export default async function AppointmentsPage() {
  const appointments = await appointmentService.getAppointments();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description="A simple appointment queue designed for later calendar sync and operational workflows."
      />
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          title="Scheduled work"
          description="MVP uses mock bookings first and leaves calendar providers stubbed."
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
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr className="border-t border-border" key={appointment.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{appointment.customerName}</td>
                  <td className="px-5 py-4 text-muted-foreground">{appointment.service}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDateTime(appointment.scheduledFor)}</td>
                  <td className="px-5 py-4 text-muted-foreground">{appointment.assignedTo}</td>
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
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>{formatDateTime(appointment.scheduledFor)}</p>
                  <p>Assigned to {appointment.assignedTo}</p>
                </div>
              </Card>
            ))}
          </div>
        </DataTableCard>
        <Card className="rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Calendar placeholder</h2>
              <p className="mt-1 text-sm text-muted-foreground">A mock weekly view for future sync and drag-and-drop scheduling.</p>
            </div>
            <Badge>Week view</Badge>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div className="rounded-2xl bg-slate-50 px-2 py-3" key={day}>
                <p className="font-medium text-slate-700">{day}</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-white px-2 py-2 text-[11px] text-slate-600">Open</div>
                  <div className="rounded-xl bg-primary/10 px-2 py-2 text-[11px] text-primary">Booked</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
