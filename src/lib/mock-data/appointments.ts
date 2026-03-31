import type { Appointment } from "@/types/domain";

export const appointments: Appointment[] = [
  {
    id: "appt-001",
    customerName: "Sofia Patel",
    service: "Deep Cleaning",
    scheduledFor: "2026-04-01T18:00:00.000Z",
    status: "confirmed",
    assignedTo: "Mike",
    calendarProvider: "mock",
    calendarSyncStatus: "synced",
    externalCalendarEventId: "mock-cal-001"
  },
  {
    id: "appt-002",
    customerName: "Chris Walton",
    service: "HVAC Repair",
    scheduledFor: "2026-04-01T20:30:00.000Z",
    status: "pending",
    assignedTo: "Sarah",
    calendarSyncStatus: "pending"
  },
  {
    id: "appt-003",
    customerName: "Marcus Lane",
    service: "Drain Inspection",
    scheduledFor: "2026-04-02T16:00:00.000Z",
    status: "confirmed",
    assignedTo: "Field Team",
    calendarProvider: "mock",
    calendarSyncStatus: "synced",
    externalCalendarEventId: "mock-cal-003"
  }
];
