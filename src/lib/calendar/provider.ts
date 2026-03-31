import type { Appointment, CalendarSyncStatus } from "@/types/domain";

export interface CalendarCreateEventInput {
  appointment: Appointment;
}

export interface CalendarUpdateEventInput {
  appointment: Appointment;
  externalEventId: string;
}

export interface CalendarDeleteEventInput {
  externalEventId: string;
}

export interface CalendarSyncResult {
  status: CalendarSyncStatus;
  provider: string;
  externalEventId?: string;
  error?: string;
}

export interface CalendarProvider {
  name: string;
  createEvent(input: CalendarCreateEventInput): Promise<CalendarSyncResult>;
  updateEvent(input: CalendarUpdateEventInput): Promise<CalendarSyncResult>;
  deleteEvent(input: CalendarDeleteEventInput): Promise<void>;
}
