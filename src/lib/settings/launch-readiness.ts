import { isBusinessProviderConfiguredSync } from "@/lib/providers/config";
import { hasPassedProviderVerificationSync } from "@/lib/services/provider-verification-service";
import type { BusinessSettings, LaunchReadinessItem, LaunchReadinessSnapshot } from "@/types/domain";

function isProviderReady(businessId: string, integrationKind: "payments" | "calendar" | "messaging" | "receptionist") {
  const configured = isBusinessProviderConfiguredSync({
    businessId,
    integrationKind
  });
  const verified = hasPassedProviderVerificationSync(businessId, integrationKind);
  return { configured, verified, ready: configured && verified };
}

export function getLaunchReadiness(settings: BusinessSettings): LaunchReadinessSnapshot {
  const calendarProvider = isProviderReady(settings.businessId, "calendar");
  const paymentProvider = isProviderReady(settings.businessId, "payments");
  const messagingProvider = isProviderReady(settings.businessId, "messaging");
  const receptionistProvider = isProviderReady(settings.businessId, "receptionist");
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
      label: "Calendar provider ready",
      description: "Calendar config is saved and a verification check has passed, or the install is manually marked ready.",
      ready: calendarProvider.ready || settings.launchReadinessFlags.calendarProviderConfigured,
      source: calendarProvider.ready ? "automatic" : "manual"
    },
    {
      key: "payment_provider",
      label: "Payment provider ready",
      description: "Payment config is saved and a verification check has passed, or the install is manually marked ready.",
      ready: paymentProvider.ready || settings.launchReadinessFlags.paymentProviderConfigured,
      source: paymentProvider.ready ? "automatic" : "manual"
    },
    {
      key: "messaging_provider",
      label: "Messaging provider ready",
      description: "Messaging config is saved and the latest verification check passed.",
      ready: messagingProvider.ready,
      source: "automatic"
    },
    {
      key: "receptionist_provider",
      label: "Receptionist / webhook trust ready",
      description: "Inbound receptionist webhook trust is configured and the latest verification check passed.",
      ready: receptionistProvider.ready,
      source: "automatic"
    }
  ];

  return {
    totalItems: items.length,
    readyItems: items.filter((item) => item.ready).length,
    items
  };
}
