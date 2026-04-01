import type {
  Appointment,
  CalendarSyncStatus,
  ResolvedBusinessProviderConfig
} from "@/types/domain";

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
  createEvent(input: CalendarCreateEventInput, config: ResolvedBusinessProviderConfig): Promise<CalendarSyncResult>;
  updateEvent(input: CalendarUpdateEventInput, config: ResolvedBusinessProviderConfig): Promise<CalendarSyncResult>;
  deleteEvent(input: CalendarDeleteEventInput, config: ResolvedBusinessProviderConfig): Promise<void>;
}
