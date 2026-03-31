import type {
  CalendarCreateEventInput,
  CalendarDeleteEventInput,
  CalendarProvider,
  CalendarSyncResult,
  CalendarUpdateEventInput
} from "@/lib/calendar/provider";

function buildSyncedResult(prefix: string): CalendarSyncResult {
  return {
    status: "synced",
    provider: "mock",
    externalEventId: `${prefix}-${crypto.randomUUID()}`
  };
}

export const mockCalendarProvider: CalendarProvider = {
  name: "mock",
  async createEvent(_input: CalendarCreateEventInput) {
    return buildSyncedResult("mock-cal");
  },
  async updateEvent(_input: CalendarUpdateEventInput) {
    return buildSyncedResult("mock-cal");
  },
  async deleteEvent(_input: CalendarDeleteEventInput) {}
};
