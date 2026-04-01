import type { BusinessSettings } from "@/types/domain";

export const businessSettings: BusinessSettings = {
  businessId: "default-business",
  businessClient: {
    id: "default-business",
    name: "LeadLock Home Services",
    status: "launching",
    createdAt: "2026-01-01T08:00:00.000Z"
  },
  businessName: "LeadLock Home Services",
  businessPhone: "(323) 555-0184",
  businessEmail: "team@leadlock.app",
  services: ["Emergency Plumbing", "Drain Cleaning", "Water Heater Repair", "Leak Detection"],
  workingHours: [
    "Mon-Fri: 7:00 AM - 6:00 PM",
    "Sat: 8:00 AM - 2:00 PM",
    "Sun: Emergency calls only"
  ],
  defaultJobPriceCents: 19000,
  currency: "usd",
  confirmationMessageTemplate:
    "Hi {{customer_name}}, your {{service}} booking is confirmed for {{scheduled_for}}. Reply here if you need to change anything.",
  reminderMessageTemplate:
    "Reminder: your {{service}} appointment is coming up at {{scheduled_for}}. Reply if you need to reschedule.",
  onboardingCompleted: false,
  launchReadinessFlags: {
    calendarProviderConfigured: false,
    paymentProviderConfigured: false
  },
  installChecklistFlags: {
    phoneAiReceptionistVerified: false,
    testBookingVerified: false,
    testPaymentVerified: false,
    launchApproved: false
  }
};
