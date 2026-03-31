import type { BusinessSettings } from "@/types/domain";

export const businessSettings: BusinessSettings = {
  businessName: "LeadLock Home Services",
  ownerName: "Jordan Lee",
  phone: "(323) 555-0184",
  email: "team@leadlock.app",
  timezone: "America/Los_Angeles",
  businessHours: [
    "Mon-Fri: 7:00 AM - 6:00 PM",
    "Sat: 8:00 AM - 2:00 PM",
    "Sun: Emergency calls only"
  ],
  services: ["Emergency Plumbing", "Drain Cleaning", "Water Heater Repair", "Leak Detection"],
  aiScriptNotes:
    "Prioritize urgent plumbing language, offer same-day estimate windows, and reassure callers that a real team member can follow up quickly for emergency jobs.",
  receptionistTone: "Helpful, calm, and fast-moving",
  followUpEnabled: true
};
