import crypto from "node:crypto";

import type { NormalizedCallWebhookEvent } from "@/lib/webhooks/call-webhook";

interface RetellCallPayload {
  event: string;
  call: {
    call_id?: string;
    from_number?: string;
    to_number?: string;
    call_status?: string;
    start_timestamp?: number;
    end_timestamp?: number;
    transcript?: string;
    call_analysis?: {
      call_summary?: string;
      call_successful?: boolean;
    };
    disconnection_reason?: string;
    duration_ms?: number;
  };
}

function mapRetellCallStatus(
  status?: string
): NormalizedCallWebhookEvent["callStatus"] {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "ended":
      return "completed";
    case "error":
      return "failed";
    default:
      return "completed";
  }
}

function mapRetellOutcome(
  disconnectionReason?: string,
  callSuccessful?: boolean
): NormalizedCallWebhookEvent["outcome"] {
  if (disconnectionReason === "voicemail_reached") return "voicemail";
  if (disconnectionReason === "user_hangup" || callSuccessful) return "answered";
  if (
    disconnectionReason?.startsWith("error_") ||
    disconnectionReason === "inactivity" ||
    disconnectionReason === "machine_detected"
  ) {
    return "missed";
  }
  return "unknown";
}

export function normalizeRetellWebhookPayload(
  payload: Record<string, unknown>
): NormalizedCallWebhookEvent {
  const p = payload as unknown as RetellCallPayload;
  const call = p.call ?? {};
  const analysis = call.call_analysis ?? {};

  const durationMinutes =
    typeof call.duration_ms === "number"
      ? Math.round(call.duration_ms / 60000)
      : call.end_timestamp && call.start_timestamp
        ? Math.round((call.end_timestamp - call.start_timestamp) / 60000)
        : 0;

  const transcript = typeof call.transcript === "string" ? call.transcript : "";

  return {
    id: typeof call.call_id === "string" && call.call_id.trim()
      ? call.call_id
      : `retell-${crypto.randomUUID()}`,
    callerName: "Unknown Caller",
    callerNumber:
      typeof call.from_number === "string" && call.from_number.trim()
        ? call.from_number
        : undefined,
    timestamp:
      typeof call.end_timestamp === "number"
        ? new Date(call.end_timestamp).toISOString()
        : new Date().toISOString(),
    summary:
      typeof analysis.call_summary === "string" && analysis.call_summary.trim()
        ? analysis.call_summary
        : "Call received via Retell AI receptionist.",
    transcriptPreview: transcript.slice(0, 500) || "Transcript unavailable.",
    callStatus: mapRetellCallStatus(call.call_status),
    outcome: mapRetellOutcome(call.disconnection_reason, analysis.call_successful),
    durationMinutes
  };
}

export function verifyRetellWebhookSignature(
  rawBody: string,
  signature: string,
  apiKey: string
): boolean {
  if (!apiKey || !signature) return false;
  const expected = crypto
    .createHmac("sha256", apiKey)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function buildRetellBookingToolDefinition(bookingEndpointUrl: string) {
  return {
    type: "custom",
    name: "book_appointment",
    description:
      "Book a service appointment for the caller. Call this once you have the customer's name, desired service, and preferred date.",
    speak_during_execution: true,
    speak_after_execution: true,
    url: bookingEndpointUrl,
    timeout_ms: 10000,
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Customer full name"
        },
        service: {
          type: "string",
          description: "The service being requested (e.g. Plumbing Repair, HVAC Tune-Up)"
        },
        date: {
          type: "string",
          description: "Preferred appointment date and time in ISO 8601 format"
        },
        notes: {
          type: "string",
          description: "Any additional details about the job (optional)"
        }
      },
      required: ["name", "service", "date"]
    }
  };
}
