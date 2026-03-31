import type { FollowUpEvent } from "@/types/domain";

export const followUps: FollowUpEvent[] = [
  {
    id: "fu-001",
    leadName: "Angela Ruiz",
    channel: "call",
    status: "pending",
    outcome: "Callback queued for dispatch",
    timestamp: "2026-03-31T08:20:00.000Z"
  },
  {
    id: "fu-002",
    leadName: "Chris Walton",
    channel: "sms",
    status: "sent",
    outcome: "Estimate reminder sent",
    timestamp: "2026-03-31T07:30:00.000Z"
  },
  {
    id: "fu-003",
    leadName: "Sofia Patel",
    channel: "email",
    status: "sent",
    outcome: "Booking confirmation delivered",
    timestamp: "2026-03-30T18:10:00.000Z"
  }
];
