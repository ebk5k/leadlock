import type { Lead } from "@/types/domain";

export const leads: Lead[] = [
  {
    id: "lead-001",
    name: "Angela Ruiz",
    service: "Emergency Plumbing",
    source: "Google Ads",
    status: "new",
    location: "Pasadena, CA",
    requestedAt: "2026-03-31T08:30:00.000Z",
    value: 420
  },
  {
    id: "lead-002",
    name: "Chris Walton",
    service: "HVAC Repair",
    source: "Organic Search",
    status: "qualified",
    location: "Burbank, CA",
    requestedAt: "2026-03-31T06:15:00.000Z",
    value: 790
  },
  {
    id: "lead-003",
    name: "Sofia Patel",
    service: "Deep Cleaning",
    source: "Referral",
    status: "booked",
    location: "Glendale, CA",
    requestedAt: "2026-03-30T17:20:00.000Z",
    value: 240
  }
];

