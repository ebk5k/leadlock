import { getDatabase } from "@/lib/data/database";
import { businessSettings as defaultBusinessSettings } from "@/lib/mock-data/settings";
import type { BusinessClient, BusinessSettings } from "@/types/domain";

const SETTINGS_ROW_ID = "default";

function normalizeJsonArray(value: unknown) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value)) as unknown;

    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function normalizeFlags(value: unknown) {
  if (!value) {
    return {
      calendarProviderConfigured: false,
      paymentProviderConfigured: false
    };
  }

  try {
    const parsed = JSON.parse(String(value)) as Record<string, unknown>;

    return {
      calendarProviderConfigured: Boolean(parsed.calendarProviderConfigured),
      paymentProviderConfigured: Boolean(parsed.paymentProviderConfigured)
    };
  } catch {
    return {
      calendarProviderConfigured: false,
      paymentProviderConfigured: false
    };
  }
}

function normalizeInstallChecklistFlags(value: unknown) {
  if (!value) {
    return {
      phoneAiReceptionistVerified: false,
      testBookingVerified: false,
      testPaymentVerified: false,
      launchApproved: false
    };
  }

  try {
    const parsed = JSON.parse(String(value)) as Record<string, unknown>;

    return {
      phoneAiReceptionistVerified: Boolean(parsed.phoneAiReceptionistVerified),
      testBookingVerified: Boolean(parsed.testBookingVerified),
      testPaymentVerified: Boolean(parsed.testPaymentVerified),
      launchApproved: Boolean(parsed.launchApproved)
    };
  } catch {
    return {
      phoneAiReceptionistVerified: false,
      testBookingVerified: false,
      testPaymentVerified: false,
      launchApproved: false
    };
  }
}

function mapSettingsRow(row: Record<string, unknown>): BusinessSettings {
  const businessClient: BusinessClient = {
    id: String(row.business_id ?? defaultBusinessSettings.businessId),
    name: String(row.client_name ?? row.business_name ?? defaultBusinessSettings.businessName),
    status:
      row.client_status === "active" || row.client_status === "inactive" || row.client_status === "launching"
        ? row.client_status
        : defaultBusinessSettings.businessClient.status,
    createdAt: String(row.client_created_at ?? defaultBusinessSettings.businessClient.createdAt)
  };

  return {
    businessId: businessClient.id,
    businessClient,
    businessName: String(row.business_name),
    businessPhone: String(row.business_phone),
    businessEmail: String(row.business_email),
    services: normalizeJsonArray(row.services),
    workingHours: normalizeJsonArray(row.working_hours),
    defaultJobPriceCents: Number(row.default_job_price_cents),
    currency: String(row.currency),
    confirmationMessageTemplate: String(row.confirmation_message_template),
    reminderMessageTemplate: String(row.reminder_message_template),
    onboardingCompleted: Boolean(Number(row.onboarding_completed ?? 0)),
    onboardingCompletedAt:
      row.onboarding_completed_at == null ? undefined : String(row.onboarding_completed_at),
    launchReadinessFlags: normalizeFlags(row.launch_readiness_flags),
    installChecklistFlags: normalizeInstallChecklistFlags(row.install_checklist_flags)
  };
}

export function getPersistedSettings() {
  const row = getDatabase()
    .prepare(
      `
        SELECT
          ss.business_id,
          business_name,
          business_phone,
          business_email,
          bc.name as client_name,
          bc.status as client_status,
          bc.created_at as client_created_at,
          services,
          working_hours,
          default_job_price_cents,
          currency,
          confirmation_message_template,
          reminder_message_template,
          onboarding_completed,
          onboarding_completed_at,
          launch_readiness_flags,
          install_checklist_flags
        FROM system_settings ss
        LEFT JOIN business_clients bc
          ON bc.id = ss.business_id
        WHERE ss.id = ?
        LIMIT 1
      `
    )
    .get(SETTINGS_ROW_ID) as Record<string, unknown> | undefined;

  return row ? mapSettingsRow(row) : defaultBusinessSettings;
}

export function writePersistedSettings(settings: BusinessSettings) {
  getDatabase()
    .prepare(
      `
        INSERT INTO business_clients (id, name, status, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          status = excluded.status
      `
    )
    .run(
      settings.businessId,
      settings.businessClient.name,
      settings.businessClient.status,
      settings.businessClient.createdAt
    );

  getDatabase()
    .prepare(
      `
        INSERT INTO system_settings (
          id,
          business_id,
          business_name,
          business_phone,
          business_email,
          services,
          working_hours,
          default_job_price_cents,
          currency,
          confirmation_message_template,
          reminder_message_template,
          onboarding_completed,
          onboarding_completed_at,
          launch_readiness_flags,
          install_checklist_flags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          business_id = excluded.business_id,
          business_name = excluded.business_name,
          business_phone = excluded.business_phone,
          business_email = excluded.business_email,
          services = excluded.services,
          working_hours = excluded.working_hours,
          default_job_price_cents = excluded.default_job_price_cents,
          currency = excluded.currency,
          confirmation_message_template = excluded.confirmation_message_template,
          reminder_message_template = excluded.reminder_message_template,
          onboarding_completed = excluded.onboarding_completed,
          onboarding_completed_at = excluded.onboarding_completed_at,
          launch_readiness_flags = excluded.launch_readiness_flags,
          install_checklist_flags = excluded.install_checklist_flags
      `
    )
    .run(
      SETTINGS_ROW_ID,
      settings.businessId,
      settings.businessName,
      settings.businessPhone,
      settings.businessEmail,
      JSON.stringify(settings.services),
      JSON.stringify(settings.workingHours),
      settings.defaultJobPriceCents,
      settings.currency,
      settings.confirmationMessageTemplate,
      settings.reminderMessageTemplate,
      settings.onboardingCompleted ? 1 : 0,
      settings.onboardingCompletedAt ?? null,
      JSON.stringify(settings.launchReadinessFlags),
      JSON.stringify(settings.installChecklistFlags)
    );
}

export function getDefaultBusinessSettings() {
  return defaultBusinessSettings;
}

export function getPersistedBusinessClient() {
  return getPersistedSettings().businessClient;
}

export function getCurrentBusinessId() {
  return getPersistedSettings().businessId;
}
