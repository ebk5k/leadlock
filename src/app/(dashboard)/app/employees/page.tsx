import { EmployeeManagement } from "@/components/dashboard/employee-management";
import { PageHeader } from "@/components/dashboard/page-header";
import { employeeService } from "@/lib/services/employee-service";

export default async function EmployeesPage() {
  const employees = await employeeService.getEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Employees"
        description="Create a real technician and dispatcher roster so jobs can be assigned to actual people."
      />
      <EmployeeManagement employees={employees} />
    </div>
  );
}
