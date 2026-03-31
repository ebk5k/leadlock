import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { calendarService } from "@/lib/services/calendar-service";
import { messagingService } from "@/lib/services/messaging-service";
import type { Appointment } from "@/types/domain";

export interface AppointmentService {
  getAppointments(): Promise<Appointment[]>;
  createAppointment(input: {
    customerName: string;
    service: string;
    scheduledFor: string;
    notes?: string;
  }): Promise<Appointment>;
}

export const appointmentService: AppointmentService = {
  async getAppointments() {
    noStore();

    const rows = getDatabase()
      .prepare(
        `
          SELECT
            id,
            customer_name,
            service,
            scheduled_for,
            status,
            assigned_to,
            notes,
            external_calendar_event_id,
            calendar_sync_status,
            calendar_provider,
            calendar_sync_error
          FROM appointments
          ORDER BY datetime(scheduled_for) ASC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      customerName: String(row.customer_name),
      service: String(row.service),
      scheduledFor: String(row.scheduled_for),
      status: row.status as Appointment["status"],
      assignedTo: String(row.assigned_to),
      notes: row.notes ? String(row.notes) : undefined,
      externalCalendarEventId: row.external_calendar_event_id
        ? String(row.external_calendar_event_id)
        : undefined,
      calendarProvider: row.calendar_provider ? String(row.calendar_provider) : undefined,
      calendarSyncError: row.calendar_sync_error ? String(row.calendar_sync_error) : undefined,
      calendarSyncStatus: (row.calendar_sync_status as Appointment["calendarSyncStatus"]) ?? "pending"
    }));
  },
  async createAppointment(input) {
    const appointment: Appointment = {
      id: `appt-${crypto.randomUUID()}`,
      customerName: input.customerName,
      service: input.service,
      scheduledFor: input.scheduledFor,
      status: "pending",
      assignedTo: "Dispatch Review",
      notes: input.notes,
      calendarSyncStatus: "pending"
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO appointments (
            id, customer_name, service, scheduled_for, status, assigned_to, notes, external_calendar_event_id, calendar_sync_status, calendar_provider, calendar_sync_error
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        appointment.id,
        appointment.customerName,
        appointment.service,
        appointment.scheduledFor,
        appointment.status,
        appointment.assignedTo,
        appointment.notes ?? null,
        appointment.externalCalendarEventId ?? null,
        appointment.calendarSyncStatus,
        appointment.calendarProvider ?? null,
        appointment.calendarSyncError ?? null
      );

    const syncedAppointment = await calendarService.syncAppointmentCreated(appointment);
    await messagingService.triggerBookingConfirmation({ appointment: syncedAppointment });

    return syncedAppointment;
  }
};
