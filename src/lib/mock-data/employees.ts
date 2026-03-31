import type { Employee } from "@/types/domain";

export const employees: Employee[] = [
  {
    id: "emp-001",
    name: "Mike Alvarez",
    role: "technician",
    phone: "(415) 555-0182",
    email: "mike@leadlock.app",
    active: true
  },
  {
    id: "emp-002",
    name: "Sarah Chen",
    role: "dispatcher",
    phone: "(415) 555-0174",
    email: "sarah@leadlock.app",
    active: true
  },
  {
    id: "emp-003",
    name: "Marcus Field",
    role: "technician",
    phone: "(415) 555-0190",
    active: true
  }
];
