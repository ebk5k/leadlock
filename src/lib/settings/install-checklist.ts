import { getLaunchReadiness } from "@/lib/settings/launch-readiness";
import type { BusinessSettings, InstallChecklistItem, InstallChecklistSnapshot } from "@/types/domain";

export function getInstallChecklist(settings: BusinessSettings): InstallChecklistSnapshot {
  const readiness = getLaunchReadiness(settings);

  const findReady = (key: "services" | "working_hours" | "message_templates" | "calendar_provider" | "payment_provider") =>
    readiness.items.find((item) => item.key === key)?.ready ?? false;

  const findSource = (key: "services" | "working_hours" | "message_templates" | "calendar_provider" | "payment_provider") =>
    readiness.items.find((item) => item.key === key)?.source ?? "automatic";

  const items: InstallChecklistItem[] = [
    {
      key: "onboarding_completed",
      label: "Onboarding completed",
      description: "The guided business setup flow has been finished.",
      ready: settings.onboardingCompleted,
      source: "automatic"
    },
    {
      key: "services_configured",
      label: "Services configured",
      description: "Core services are saved for booking and sales flows.",
      ready: findReady("services"),
      source: findSource("services")
    },
    {
      key: "working_hours_configured",
      label: "Working hours configured",
      description: "Availability blocks are saved for booking and delivery handoff.",
      ready: findReady("working_hours"),
      source: findSource("working_hours")
    },
    {
      key: "calendar_connected",
      label: "Calendar connected",
      description: "Calendar sync is ready or manually verified for launch.",
      ready: findReady("calendar_provider"),
      source: findSource("calendar_provider")
    },
    {
      key: "payment_provider_connected",
      label: "Payment provider connected",
      description: "Payment collection is ready or manually verified for launch.",
      ready: findReady("payment_provider"),
      source: findSource("payment_provider")
    },
    {
      key: "messaging_templates_configured",
      label: "Messaging templates configured",
      description: "Confirmation and reminder templates are saved and usable.",
      ready: findReady("message_templates"),
      source: findSource("message_templates")
    },
    {
      key: "phone_ai_receptionist_verified",
      label: "Phone / AI receptionist verified",
      description: "Internal setup check for phone routing or AI receptionist readiness.",
      ready: settings.installChecklistFlags.phoneAiReceptionistVerified,
      source: "manual"
    },
    {
      key: "test_booking_verified",
      label: "Test booking verified",
      description: "A delivery-side booking test has been confirmed.",
      ready: settings.installChecklistFlags.testBookingVerified,
      source: "manual"
    },
    {
      key: "test_payment_verified",
      label: "Test payment verified",
      description: "A delivery-side payment test has been confirmed.",
      ready: settings.installChecklistFlags.testPaymentVerified,
      source: "manual"
    },
    {
      key: "launch_approved",
      label: "Launch approved",
      description: "Internal signoff is complete and the business is ready to go live.",
      ready: settings.installChecklistFlags.launchApproved,
      source: "manual"
    }
  ];

  return {
    totalItems: items.length,
    readyItems: items.filter((item) => item.ready).length,
    items
  };
}
