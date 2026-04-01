import { Bot, CalendarDays, PhoneCall, ReceiptText, TrendingUp, Users, Wrench } from "lucide-react";
import { redirect } from "next/navigation";

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
import { paymentService } from "@/lib/services/payment-service";
import { receptionistService } from "@/lib/services/receptionist-service";
import { settingsService } from "@/lib/services/settings-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function AppOverviewPage() {
  const settings = await settingsService.getSettings();

  if (!settings.onboardingCompleted) {
    redirect("/app/onboarding");
  }

  const [leads, appointments, calls, employees, payments] = await Promise.all([
    leadService.getLeads(),
    appointmentService.getAppointments(),
    receptionistService.getCalls(),
    employeeService.getEmployees(),
    paymentService.getPayments()
  ]);
  const followUps = await settingsService.getFollowUps();
  const answeredCalls = calls.filter((call) => call.outcome === "answered").length;
  const handledCalls = calls.filter((call) => call.outcome !== "unknown").length;
  const activeJobs = appointments.filter(
    (appointment) => appointment.status !== "completed" && appointment.status !== "canceled"
  ).length;
  const completedJobs = appointments.filter((appointment) => appointment.status === "completed").length;
  const syncedAppointments = appointments.filter(
    (appointment) => appointment.calendarSyncStatus === "synced"
  ).length;
  const paidAppointments = appointments.filter((appointment) => appointment.paymentStatus === "paid").length;
  const activeEmployees = employees.filter((employee) => employee.active).length;
  const completedWithProof = appointments.filter(
    (appointment) => appointment.status === "completed" && appointment.proofAssetCount > 0
  ).length;
  const missedCallRecoveries = followUps.filter(
    (event) => event.messageType === "missed_call_recovery" && event.status === "sent"
  ).length;
  const noResponseRecoveries = followUps.filter(
    (event) => event.messageType === "no_response_lead_recovery" && event.status === "sent"
  ).length;
  const recoveryAutomationsTriggered = followUps.filter(
    (event) =>
      event.messageType === "missed_call_recovery" ||
      event.messageType === "no_response_lead_recovery" ||
      event.messageType === "payment_reminder"
  ).length;
  const paymentRemindersSent = followUps.filter(
    (event) => event.messageType === "payment_reminder" && event.status === "sent"
  ).length;
  const paidRevenue = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const ownerProofPoints = [
    { label: "Leads captured", value: String(leads.length), helper: `${leads.filter((lead) => lead.status === "new").length} still new` },
    { label: "Calls handled", value: String(handledCalls), helper: `${answeredCalls} answered live` },
    { label: "Bookings created", value: String(appointments.length), helper: `${activeJobs} still active` },
    { label: "Payments tracked", value: String(payments.length), helper: `${paidAppointments} paid · ${paymentRemindersSent} reminders sent` },
    { label: "Jobs completed", value: String(completedJobs), helper: `${completedWithProof} with proof` },
    {
      label: "Recovery automations",
      value: String(recoveryAutomationsTriggered),
      helper: `${missedCallRecoveries + noResponseRecoveries + paymentRemindersSent} sent`
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard overview"
        description="The business story at a glance: captured demand, handled calls, booked jobs, tracked payments, and automations that recover missed revenue."
        action={<Button>Export Snapshot</Button>}
      />
      <Card className="rounded-[2rem] border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_62%,_#0f766e_100%)] p-6 text-white sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="space-y-3">
            <Badge className="bg-white/10 text-white">Owner Snapshot</Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                LeadLock is turning interest into booked, paid, and completed work.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                This is the clearest demo story for a local business owner: leads are being captured,
                calls are being handled, bookings are being created, payments are being tracked, and
                missed opportunities are getting recovery follow-up instead of going cold.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Paid revenue tracked</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(paidRevenue / 100)}</p>
              <p className="mt-2 text-sm text-white/65">{paidAppointments} paid jobs saved in the system</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Recovery automations</p>
              <p className="mt-2 text-3xl font-semibold">{recoveryAutomationsTriggered}</p>
              <p className="mt-2 text-sm text-white/65">
                {missedCallRecoveries} call recoveries · {noResponseRecoveries} lead recoveries · {paymentRemindersSent} payment reminders
              </p>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ownerProofPoints.map((item) => (
          <Card className="rounded-3xl p-5" key={item.label}>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{item.value}</p>
            <p className="mt-2 text-sm text-slate-300">{item.helper}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="Pipeline"
          label="Total leads"
          value={String(leads.length)}
          change={`${leads.filter((lead) => lead.status === "new").length} new · ${noResponseRecoveries} lead recoveries sent`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Calls"
          label="Calls answered"
          value={String(answeredCalls)}
          change={`${missedCallRecoveries} missed-call recoveries sent · ${activeEmployees} active employees`}
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
          eyebrow="Revenue"
          label="Payments tracked"
          value={String(payments.length)}
          change={`${paidAppointments} paid · ${paymentRemindersSent} reminders sent · ${formatCurrency(paidRevenue / 100)} collected`}
          tone="success"
          icon={<ReceiptText className="h-4 w-4" />}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Why this demos well</p>
              <p className="mt-1 text-sm text-slate-300">
                The system now shows the full owner-facing story without needing extra explanation.
              </p>
            </div>
            <Badge>Demo-ready</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              {
                title: "Demand captured",
                description: "Leads and calls are visible instead of being scattered across tools.",
                icon: Users
              },
              {
                title: "Revenue path tracked",
                description: "Bookings, payments, and completions now read like one operating system.",
                icon: TrendingUp
              },
              {
                title: "Missed opportunities recovered",
                description: "Automations now re-engage missed calls and no-response leads for follow-up.",
                icon: Bot
              },
              {
                title: "Work delivered",
                description: "Completed jobs and proof-of-work show the operational follow-through behind the sale.",
                icon: Wrench
              }
            ].map((item) => (
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4" key={item.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <DataTableCard
          title="Latest calls"
          description="A quick look at recent calls, statuses, outcomes, and transcript previews."
          action={<Badge>{calls.length} total</Badge>}
        >
          <CallLogTable calls={calls} />
        </DataTableCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTableCard
          title="Upcoming appointments"
          description="Appointments now save dispatch progress, payment state, calendar sync, and proof-of-work details alongside the booking record."
          action={<Badge>Next 3 jobs</Badge>}
        >
          <table className="hidden min-w-full text-sm md:table">
            <thead className="bg-white/5 text-slate-400">
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
                <tr className="border-t border-white/10" key={appointment.id}>
                  <td className="px-5 py-4 font-medium text-slate-100">{appointment.customerName}</td>
                  <td className="px-5 py-4 text-slate-300">{appointment.service}</td>
                  <td className="px-5 py-4 text-slate-300">{formatDateTime(appointment.scheduledFor)}</td>
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
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid gap-3 p-4 md:hidden">
            {appointments.map((appointment) => (
              <Card className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-none" key={appointment.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{appointment.customerName}</p>
                    <p className="mt-1 text-sm text-slate-300">{appointment.service}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <JobStatusBadge status={appointment.status} />
                    <CalendarSyncBadge status={appointment.calendarSyncStatus} />
                    <PaymentStatusBadge status={appointment.paymentStatus} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>{formatDateTime(appointment.scheduledFor)}</span>
                  <span>{appointment.assignedEmployee?.name ?? appointment.assignedTo}</span>
                </div>
                {appointment.proofAssetCount > 0 ? (
                  <p className="mt-2 text-xs text-emerald-300">
                    {appointment.proofAssetCount} proof asset{appointment.proofAssetCount === 1 ? "" : "s"} attached
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </DataTableCard>
        <Card className="rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Proof points to call out in a demo</p>
              <p className="mt-1 text-sm text-slate-300">
                These are the strongest signals for a service business owner seeing the system live.
              </p>
            </div>
            <Badge>Use in sales</Badge>
          </div>
          <div className="mt-5 space-y-4">
            {[
              `${leads.length} leads captured and visible in one place`,
              `${handledCalls} calls tracked with answered, missed, and voicemail outcomes`,
              `${appointments.length} bookings created with dispatch and proof-of-work visibility`,
              `${payments.length} payments tracked with ${paidAppointments} already paid and ${paymentRemindersSent} reminders sent`,
              `${completedJobs} jobs completed, with ${completedWithProof} carrying proof assets`,
              `${recoveryAutomationsTriggered} recovery automations triggered to catch missed revenue`
            ].map((item) => (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300" key={item}>
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
