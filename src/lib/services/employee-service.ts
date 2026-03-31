import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import type { Employee, EmployeeRole } from "@/types/domain";

function mapEmployeeRow(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
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

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, name, role, phone, email, active
          FROM employees
          ORDER BY active DESC, name ASC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map(mapEmployeeRow);
  },
  async getActiveEmployees() {
    noStore();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, name, role, phone, email, active
          FROM employees
          WHERE active = 1
          ORDER BY name ASC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map(mapEmployeeRow);
  },
  async createEmployee(input) {
    const employee: Employee = {
      id: `emp-${crypto.randomUUID()}`,
      name: input.name.trim(),
      role: input.role,
      phone: input.phone.trim(),
      email: input.email?.trim() ? input.email.trim() : undefined,
      active: input.active ?? true
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO employees (id, name, role, phone, email, active)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        employee.id,
        employee.name,
        employee.role,
        employee.phone,
        employee.email ?? null,
        employee.active ? 1 : 0
      );

    return employee;
  }
};
