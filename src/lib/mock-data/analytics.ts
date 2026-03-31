import type { AnalyticsSnapshot } from "@/types/domain";

export const analyticsSnapshot: AnalyticsSnapshot = {
  totalLeads: 128,
  conversionRate: 34,
  bookedAppointments: 44,
  responseTimeMinutes: 6,
  series: [
    { label: "Mon", leads: 16, bookings: 5 },
    { label: "Tue", leads: 18, bookings: 6 },
    { label: "Wed", leads: 14, bookings: 4 },
    { label: "Thu", leads: 22, bookings: 8 },
    { label: "Fri", leads: 20, bookings: 7 },
    { label: "Sat", leads: 24, bookings: 9 },
    { label: "Sun", leads: 14, bookings: 5 }
  ],
  sources: [
    { source: "Google Ads", value: 48 },
    { source: "Organic Search", value: 34 },
    { source: "Referral", value: 26 },
    { source: "LSA", value: 20 }
  ]
};

