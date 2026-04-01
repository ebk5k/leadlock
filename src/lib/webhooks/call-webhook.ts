import crypto from "node:crypto";

import { resolveCallWebhookSecret } from "@/lib/providers/config";

export interface NormalizedCallWebhookEvent {
  id: string;
  businessId?: string;
  callerName: string;
  callerNumber?: string;
  timestamp: string;
  summary: string;
  transcriptPreview: string;
  callStatus: "queued" | "ringing" | "in_progress" | "completed" | "failed";
  outcome: "answered" | "missed" | "voicemail" | "unknown";
  durationMinutes: number;
}

function normalizeCallStatus(value?: string) {
  switch (value) {
    case "queued":
    case "ringing":
    case "in_progress":
    case "completed":
    case "failed":
      return value;
    default:
      return "completed";
  }
}

function normalizeOutcome(value?: string) {
  switch (value) {
    case "answered":
    case "missed":
    case "voicemail":
      return value;
    default:
      return "unknown";
  }
}

export async function validateCallWebhookSecret(requestSecret?: string, businessId?: string) {
  const configuredSecret = await resolveCallWebhookSecret(businessId);

  if (!configuredSecret) {
    throw new Error("CALL_WEBHOOK_SECRET is not configured.");
  }

  if (!requestSecret) {
    return false;
  }

  const left = Buffer.from(requestSecret);
  const right = Buffer.from(configuredSecret);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function normalizeCallWebhookPayload(payload: Record<string, unknown>): NormalizedCallWebhookEvent {
  return {
    id:
      typeof payload.id === "string"
        ? payload.id
        : `call-${crypto.randomUUID()}`,
    businessId:
      typeof payload.businessId === "string" && payload.businessId.trim().length > 0
        ? payload.businessId
        : typeof payload.business_id === "string" && payload.business_id.trim().length > 0
          ? payload.business_id
          : undefined,
    callerName:
      typeof payload.callerName === "string" && payload.callerName.trim().length > 0
        ? payload.callerName
        : typeof payload.caller_name === "string" && payload.caller_name.trim().length > 0
          ? payload.caller_name
          : "Unknown Caller",
    callerNumber:
      typeof payload.callerNumber === "string"
        ? payload.callerNumber
        : typeof payload.caller_number === "string"
          ? payload.caller_number
          : undefined,
    timestamp:
      typeof payload.timestamp === "string"
        ? payload.timestamp
        : new Date().toISOString(),
    summary:
      typeof payload.summary === "string" && payload.summary.trim().length > 0
        ? payload.summary
        : "Call received via AI receptionist webhook.",
    transcriptPreview:
      typeof payload.transcriptPreview === "string"
        ? payload.transcriptPreview
        : typeof payload.transcript_preview === "string"
          ? payload.transcript_preview
          : "Transcript preview unavailable.",
    callStatus: normalizeCallStatus(
      typeof payload.callStatus === "string"
        ? payload.callStatus
        : typeof payload.call_status === "string"
          ? payload.call_status
          : undefined
    ),
    outcome: normalizeOutcome(
      typeof payload.outcome === "string" ? payload.outcome : undefined
    ),
    durationMinutes:
      typeof payload.durationMinutes === "number"
        ? payload.durationMinutes
        : typeof payload.duration_minutes === "number"
          ? payload.duration_minutes
          : 0
  };
}
