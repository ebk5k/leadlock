import { getDatabase } from "@/lib/data/database";
import { googleCalendarProvider } from "@/lib/calendar/google-provider";
import { mockCalendarProvider } from "@/lib/calendar/mock-provider";
import type { CalendarProvider } from "@/lib/calendar/provider";
import type { Appointment } from "@/types/domain";

function getCalendarProvider(): CalendarProvider {
  const provider = process.env.CALENDAR_PROVIDER ?? "mock";

  switch (provider) {
    case "google":
      return googleCalendarProvider;
    case "mock":
    default:
      return mockCalendarProvider;
  }
}

function updateAppointmentCalendarState(appointmentId: string, input: {
  externalCalendarEventId?: string;
  calendarProvider: string;
  calendarSyncError?: string;
  calendarSyncStatus: Appointment["calendarSyncStatus"];
}) {
  getDatabase()
    .prepare(
      `
        UPDATE appointments
        SET external_calendar_event_id = ?,
            calendar_sync_status = ?,
            calendar_provider = ?,
            calendar_sync_error = ?
        WHERE id = ?
      `
    )
    .run(
      input.externalCalendarEventId ?? null,
      input.calendarSyncStatus,
      input.calendarProvider,
      input.calendarSyncError ?? null,
      appointmentId
    );
}

export interface CalendarService {
  syncAppointmentCreated(appointment: Appointment): Promise<Appointment>;
}

export const calendarService: CalendarService = {
  async syncAppointmentCreated(appointment) {
    const provider = getCalendarProvider();

    try {
      const result = await provider.createEvent({ appointment });
      const syncedAppointment: Appointment = {
        ...appointment,
        calendarProvider: result.provider,
        calendarSyncError: undefined,
        calendarSyncStatus: result.status,
        externalCalendarEventId: result.externalEventId
      };

      updateAppointmentCalendarState(appointment.id, {
        externalCalendarEventId: result.externalEventId,
        calendarProvider: result.provider,
        calendarSyncStatus: result.status
      });

      return syncedAppointment;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Calendar sync failed.";
      const failedAppointment: Appointment = {
        ...appointment,
        calendarProvider: provider.name,
        calendarSyncError: message,
        calendarSyncStatus: "failed",
        externalCalendarEventId: undefined
      };

      updateAppointmentCalendarState(appointment.id, {
        calendarProvider: provider.name,
        calendarSyncError: message,
        calendarSyncStatus: "failed"
      });

      return failedAppointment;
    }
  }
};
