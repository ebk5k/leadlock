import type { CallLog, ReceptionistInteraction } from "@/types/domain";

export const callLogs: CallLog[] = [
  {
    id: "call-001",
    callerName: "Angela Ruiz",
    outcome: "missed",
    summary: "Customer asked about emergency availability for a burst pipe.",
    transcriptPreview: "Hi, I need someone out today if possible. We have a pipe burst under the kitchen sink and water is spreading fast.",
    timestamp: "2026-03-31T08:12:00.000Z",
    durationMinutes: 2
  },
  {
    id: "call-002",
    callerName: "Trevor Kim",
    outcome: "answered",
    summary: "Booked same-day estimate after receptionist shared pricing range.",
    transcriptPreview: "I wanted to know your estimate range for HVAC repair. If someone can come today, go ahead and put me on the schedule.",
    timestamp: "2026-03-31T07:45:00.000Z",
    durationMinutes: 6
  },
  {
    id: "call-003",
    callerName: "Unknown Caller",
    outcome: "voicemail",
    summary: "Requested a callback for weekend availability.",
    transcriptPreview: "Calling to ask if you have any openings this weekend. Please call me back when you can.",
    timestamp: "2026-03-30T22:10:00.000Z",
    durationMinutes: 1
  }
];

export const receptionistInteractions: ReceptionistInteraction[] = [
  {
    id: "rx-001",
    customerName: "Trevor Kim",
    intent: "Pricing question",
    action: "Shared estimate range and offered booking link",
    timestamp: "2026-03-31T07:48:00.000Z"
  },
  {
    id: "rx-002",
    customerName: "Angela Ruiz",
    intent: "Urgent service",
    action: "Flagged team for rapid callback",
    timestamp: "2026-03-31T08:14:00.000Z"
  },
  {
    id: "rx-003",
    customerName: "Marcus Lane",
    intent: "Reschedule",
    action: "Moved appointment to Thursday afternoon",
    timestamp: "2026-03-30T19:30:00.000Z"
  }
];
