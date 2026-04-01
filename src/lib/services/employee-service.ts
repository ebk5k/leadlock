import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { getCurrentBusinessId } from "@/lib/settings/store";
import type { Employee, EmployeePerformanceSnapshot, EmployeeRole } from "@/types/domain";

function mapEmployeeRow(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : undefined,
    name: String(row.name),
    role: row.role as EmployeeRole,
    phone: String(row.phone),
    email: row.email ? String(row.email) : undefined,
    active: Boolean(row.active)
  };
}

export interface EmployeeService {
  getEmployees(): Promise<Employee[]>;
  getActiveEmployees(): Promise<Employee[]>;
  getPerformanceSnapshots(): Promise<EmployeePerformanceSnapshot[]>;
  createEmployee(input: {
    name: string;
    role: EmployeeRole;
    phone: string;
    email?: string;
    active?: boolean;
  }): Promise<Employee>;
}

export const employeeService: EmployeeService = {
  async getEmployees() {
    noStore();
    const businessId = getCurrentBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, business_id, name, role, phone, email, active
          FROM employees
          WHERE business_id = ?
          ORDER BY active DESC, name ASC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    return rows.map(mapEmployeeRow);
  },
  async getActiveEmployees() {
    noStore();
    const businessId = getCurrentBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, business_id, name, role, phone, email, active
          FROM employees
          WHERE business_id = ? AND active = 1
          ORDER BY name ASC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    return rows.map(mapEmployeeRow);
  },
  async getPerformanceSnapshots() {
    noStore();
    const businessId = getCurrentBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT
            e.id,
            e.business_id,
            e.name,
            e.role,
            e.phone,
            e.email,
            e.active,
            COUNT(a.id) AS jobs_assigned,
            SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS jobs_completed,
            SUM(CASE WHEN a.status NOT IN ('completed', 'canceled') THEN 1 ELSE 0 END) AS active_jobs,
            SUM(CASE WHEN a.status IN ('dispatched', 'en_route', 'on_site') THEN 1 ELSE 0 END) AS in_progress_jobs,
            SUM(CASE WHEN p.status = 'paid' THEN p.amount_cents ELSE 0 END) AS paid_revenue_cents
            ,
            AVG(
              CASE
                WHEN a.status = 'completed'
                  AND a.completed_at IS NOT NULL
                  AND COALESCE(a.on_site_at, a.en_route_at, a.dispatched_at, a.assigned_at, a.created_at) IS NOT NULL
                THEN
                  (julianday(a.completed_at) - julianday(COALESCE(a.on_site_at, a.en_route_at, a.dispatched_at, a.assigned_at, a.created_at))) * 24 * 60
                ELSE NULL
              END
            ) AS average_completion_duration_minutes
          FROM employees e
          LEFT JOIN appointments a
            ON a.business_id = e.business_id
            AND (
              a.assigned_employee_id = e.id
            OR (a.assigned_employee_id IS NULL AND a.assigned_to = e.name)
            )
          LEFT JOIN payments p
            ON p.id = (
              SELECT p2.id
              FROM payments p2
              WHERE p2.business_id = e.business_id AND p2.appointment_id = a.id
              ORDER BY datetime(p2.updated_at) DESC, datetime(p2.created_at) DESC
              LIMIT 1
            )
          WHERE e.business_id = ?
          GROUP BY e.id, e.name, e.role, e.phone, e.email, e.active
          ORDER BY paid_revenue_cents DESC, jobs_completed DESC, jobs_assigned DESC, e.name ASC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      employee: mapEmployeeRow(row),
      jobsAssigned: Number(row.jobs_assigned ?? 0),
      jobsCompleted: Number(row.jobs_completed ?? 0),
      activeJobs: Number(row.active_jobs ?? 0),
      inProgressJobs: Number(row.in_progress_jobs ?? 0),
      paidRevenueCents: Number(row.paid_revenue_cents ?? 0),
      averageCompletionDurationMinutes:
        row.average_completion_duration_minutes == null
          ? null
          : Math.max(0, Math.round(Number(row.average_completion_duration_minutes))),
      utilizationPercent:
        Number(row.jobs_completed ?? 0) + Number(row.in_progress_jobs ?? 0) === 0
          ? 0
          : Math.round(
              (Number(row.in_progress_jobs ?? 0) /
                (Number(row.jobs_completed ?? 0) + Number(row.in_progress_jobs ?? 0))) *
                100
            )
    }));
  },
  async createEmployee(input) {
    const employee: Employee = {
      id: `emp-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
      name: input.name.trim(),
      role: input.role,
      phone: input.phone.trim(),
      email: input.email?.trim() ? input.email.trim() : undefined,
      active: input.active ?? true
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO employees (id, business_id, name, role, phone, email, active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        employee.id,
        employee.businessId ?? getCurrentBusinessId(),
        employee.name,
        employee.role,
        employee.phone,
        employee.email ?? null,
        employee.active ? 1 : 0
      );

    return employee;
  }
};
