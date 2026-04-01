import { EmployeeManagement } from "@/components/dashboard/employee-management";
import { EmployeePerformanceView } from "@/components/dashboard/employee-performance-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { employeeService } from "@/lib/services/employee-service";

export default async function EmployeesPage() {
  const [employees, performance] = await Promise.all([
    employeeService.getEmployees(),
    employeeService.getPerformanceSnapshots()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Employees"
        description="Create a real technician and dispatcher roster, then monitor assigned work, completions, and paid revenue attribution."
      />
      <EmployeePerformanceView performance={performance} />
      <EmployeeManagement employees={employees} />
    </div>
  );
}
