import type {
  CalendarCreateEventInput,
  CalendarDeleteEventInput,
  CalendarProvider,
  CalendarSyncResult,
  CalendarUpdateEventInput
} from "@/lib/calendar/provider";
import type { ResolvedBusinessProviderConfig } from "@/types/domain";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

interface GoogleAccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleCalendarEventResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

interface GoogleCalendarConfig {
  calendarId?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  timeZone: string;
}

interface GoogleCalendarResolvedConfig {
  calendarId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  timeZone: string;
}

function getGoogleCalendarConfig(providerConfig: ResolvedBusinessProviderConfig): GoogleCalendarConfig {
  return {
    calendarId: providerConfig.config.calendarId || process.env.GOOGLE_CALENDAR_ID,
    clientId: providerConfig.config.clientId || process.env.GOOGLE_CLIENT_ID,
    clientSecret:
      providerConfig.secrets.clientSecret ||
      providerConfig.config.clientSecret ||
      process.env.GOOGLE_CLIENT_SECRET,
    refreshToken:
      providerConfig.secrets.refreshToken ||
      providerConfig.config.refreshToken ||
      process.env.GOOGLE_REFRESH_TOKEN,
    timeZone:
      providerConfig.config.timeZone || process.env.GOOGLE_CALENDAR_TIMEZONE || "America/Los_Angeles"
  };
}

function assertGoogleCalendarConfig(providerConfig: ResolvedBusinessProviderConfig): GoogleCalendarResolvedConfig {
  const config = getGoogleCalendarConfig(providerConfig);

  if (!config.calendarId || !config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error(
      "Google Calendar sync is enabled but GOOGLE_CALENDAR_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN is missing."
    );
  }

  return {
    calendarId: config.calendarId,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken,
    timeZone: config.timeZone
  };
}

async function getAccessToken(providerConfig: ResolvedBusinessProviderConfig) {
  const config = assertGoogleCalendarConfig(providerConfig);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token"
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = (await response.json()) as GoogleAccessTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Unable to refresh Google access token.");
  }

  return payload.access_token;
}

function buildEventPayload(
  input: CalendarCreateEventInput | CalendarUpdateEventInput,
  providerConfig: ResolvedBusinessProviderConfig
) {
  const { appointment } = input;
  const { timeZone } = assertGoogleCalendarConfig(providerConfig);
  const start = new Date(appointment.scheduledFor);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    summary: `${appointment.service} for ${appointment.customerName}`,
    description: [
      "Created by LeadLock.",
      `Appointment ID: ${appointment.id}`,
      appointment.notes ? `Notes: ${appointment.notes}` : null
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: start.toISOString(),
      timeZone
    },
    end: {
      dateTime: end.toISOString(),
      timeZone
    },
    extendedProperties: {
      private: {
        leadlockAppointmentId: appointment.id
      }
    }
  };
}

async function createOrUpdateEvent(
  method: "POST" | "PUT",
  path: string,
  input: CalendarCreateEventInput | CalendarUpdateEventInput,
  providerConfig: ResolvedBusinessProviderConfig
) {
  const accessToken = await getAccessToken(providerConfig);
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildEventPayload(input, providerConfig))
  });
  const payload = (await response.json()) as GoogleCalendarEventResponse;

  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? "Google Calendar event sync failed.");
  }

  const result: CalendarSyncResult = {
    status: "synced",
    provider: "google",
    externalEventId: payload.id
  };

  return result;
}

export const googleCalendarProvider: CalendarProvider = {
  name: "google",
  async createEvent(input: CalendarCreateEventInput, providerConfig: ResolvedBusinessProviderConfig) {
    const { calendarId } = assertGoogleCalendarConfig(providerConfig);

    return createOrUpdateEvent(
      "POST",
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      input,
      providerConfig
    );
  },
  async updateEvent(input: CalendarUpdateEventInput, providerConfig: ResolvedBusinessProviderConfig) {
    const { calendarId } = assertGoogleCalendarConfig(providerConfig);

    return createOrUpdateEvent(
      "PUT",
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(input.externalEventId)}`,
      input,
      providerConfig
    );
  },
  async deleteEvent(input: CalendarDeleteEventInput, providerConfig: ResolvedBusinessProviderConfig) {
    const accessToken = await getAccessToken(providerConfig);
    const { calendarId } = assertGoogleCalendarConfig(providerConfig);
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(input.externalEventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error("Google Calendar event delete failed.");
    }
  }
};
