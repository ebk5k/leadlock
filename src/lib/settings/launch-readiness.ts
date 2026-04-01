import type { BusinessSettings, LaunchReadinessItem, LaunchReadinessSnapshot } from "@/types/domain";

function isCalendarProviderAutoConfigured() {
  const provider = process.env.CALENDAR_PROVIDER ?? "mock";

  if (provider === "mock") {
    return true;
  }

  if (provider === "google") {
    return Boolean(
      process.env.GOOGLE_CALENDAR_ID &&
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN
    );
  }

  return false;
}

function isPaymentProviderAutoConfigured() {
  const provider = process.env.PAYMENT_PROVIDER ?? "mock";

  if (provider === "mock") {
    return true;
  }

  if (provider === "stripe") {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }

  return false;
}

export function getLaunchReadiness(settings: BusinessSettings): LaunchReadinessSnapshot {
  const items: LaunchReadinessItem[] = [
    {
      key: "business_info",
      label: "Business info",
      description: "Business name, phone, and email are saved.",
      ready: Boolean(settings.businessName && settings.businessPhone && settings.businessEmail),
      source: "automatic"
    },
    {
      key: "services",
      label: "Services configured",
      description: "The booking and sales flow have a saved service list to use.",
      ready: settings.services.length > 0,
      source: "automatic"
    },
    {
      key: "working_hours",
      label: "Working hours configured",
      description: "Availability blocks are ready for booking and follow-up messaging.",
      ready: settings.workingHours.length > 0,
      source: "automatic"
    },
    {
      key: "message_templates",
      label: "Message templates configured",
      description: "Confirmation and reminder templates are saved.",
      ready: Boolean(settings.confirmationMessageTemplate && settings.reminderMessageTemplate),
      source: "automatic"
    },
    {
      key: "calendar_provider",
      label: "Calendar provider configured",
      description: "Calendar sync is either auto-detected or manually marked ready for launch.",
      ready:
        isCalendarProviderAutoConfigured() || settings.launchReadinessFlags.calendarProviderConfigured,
      source: isCalendarProviderAutoConfigured() ? "automatic" : "manual"
    },
    {
      key: "payment_provider",
      label: "Payment provider configured",
      description: "Payment collection is either auto-detected or manually marked ready for launch.",
      ready:
        isPaymentProviderAutoConfigured() || settings.launchReadinessFlags.paymentProviderConfigured,
      source: isPaymentProviderAutoConfigured() ? "automatic" : "manual"
    }
  ];

  return {
    totalItems: items.length,
    readyItems: items.filter((item) => item.ready).length,
    items
  };
}
