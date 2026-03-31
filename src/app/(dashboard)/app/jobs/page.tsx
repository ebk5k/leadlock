import { JobOpsList } from "@/components/dashboard/job-ops-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { appointmentService } from "@/lib/services/appointment-service";
import { employeeService } from "@/lib/services/employee-service";

export default async function JobsPage() {
  const [appointments, employees] = await Promise.all([
    appointmentService.getAppointments(),
    employeeService.getEmployees()
  ]);
  const visibleJobs = appointments.filter((appointment) => appointment.status !== "canceled");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Ops"
        title="Jobs"
        description="A simple worker-facing flow for assignment, dispatch, and proof-backed job completion."
      />
      <JobOpsList
        appointments={visibleJobs}
        employees={employees}
        title="Job board"
        description="Move work from scheduled to complete, then keep proof-backed closeouts visible for quick review."
      />
    </div>
  );
}
