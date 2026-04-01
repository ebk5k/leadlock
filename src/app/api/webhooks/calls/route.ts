import { NextResponse } from "next/server";

import {
  normalizeCallWebhookPayload,
  validateCallWebhookSecret
} from "@/lib/webhooks/call-webhook";
import { receptionistService } from "@/lib/services/receptionist-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const normalizedCall = normalizeCallWebhookPayload(payload);
  const secret =
    request.headers.get("x-leadlock-webhook-secret") ??
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  try {
    const valid = await validateCallWebhookSecret(secret ?? undefined, normalizedCall.businessId);

    if (!valid) {
      return NextResponse.json({ success: false, message: "Unauthorized webhook request." }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Webhook secret is not configured." },
      { status: 500 }
    );
  }
  const call = await receptionistService.createCall(normalizedCall);

  return NextResponse.json({ success: true, call });
}
