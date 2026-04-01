import type { BusinessSettings } from "@/types/domain";

export interface SettingsFormValues {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  services: string;
  workingHours: string;
  defaultJobPriceCents: string;
  currency: string;
  confirmationMessageTemplate: string;
  reminderMessageTemplate: string;
  calendarProviderConfigured: string;
  paymentProviderConfigured: string;
  phoneAiReceptionistVerified: string;
  testBookingVerified: string;
  testPaymentVerified: string;
  launchApproved: string;
}

export function joinLines(values: string[]) {
  return values.join("\n");
}

export function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getSettingsFormValues(settings: BusinessSettings): SettingsFormValues {
  return {
    businessName: settings.businessName,
    businessPhone: settings.businessPhone,
    businessEmail: settings.businessEmail,
    services: joinLines(settings.services),
    workingHours: joinLines(settings.workingHours),
    defaultJobPriceCents: String(settings.defaultJobPriceCents),
    currency: settings.currency,
    confirmationMessageTemplate: settings.confirmationMessageTemplate,
    reminderMessageTemplate: settings.reminderMessageTemplate,
    calendarProviderConfigured: settings.launchReadinessFlags.calendarProviderConfigured ? "ready" : "not_ready",
    paymentProviderConfigured: settings.launchReadinessFlags.paymentProviderConfigured ? "ready" : "not_ready",
    phoneAiReceptionistVerified: settings.installChecklistFlags.phoneAiReceptionistVerified ? "ready" : "not_ready",
    testBookingVerified: settings.installChecklistFlags.testBookingVerified ? "ready" : "not_ready",
    testPaymentVerified: settings.installChecklistFlags.testPaymentVerified ? "ready" : "not_ready",
    launchApproved: settings.installChecklistFlags.launchApproved ? "ready" : "not_ready"
  };
}

export function getSettingsPayload(
  form: SettingsFormValues,
  settings: Pick<BusinessSettings, "onboardingCompleted" | "onboardingCompletedAt">
) {
  return {
    businessName: form.businessName,
    businessPhone: form.businessPhone,
    businessEmail: form.businessEmail,
    services: splitLines(form.services),
    workingHours: splitLines(form.workingHours),
    defaultJobPriceCents: Number(form.defaultJobPriceCents),
    currency: form.currency,
    confirmationMessageTemplate: form.confirmationMessageTemplate,
    reminderMessageTemplate: form.reminderMessageTemplate,
    onboardingCompleted: settings.onboardingCompleted,
    onboardingCompletedAt: settings.onboardingCompletedAt ?? null,
    launchReadinessFlags: {
      calendarProviderConfigured: form.calendarProviderConfigured === "ready",
      paymentProviderConfigured: form.paymentProviderConfigured === "ready"
    },
    installChecklistFlags: {
      phoneAiReceptionistVerified: form.phoneAiReceptionistVerified === "ready",
      testBookingVerified: form.testBookingVerified === "ready",
      testPaymentVerified: form.testPaymentVerified === "ready",
      launchApproved: form.launchApproved === "ready"
    }
  };
}
