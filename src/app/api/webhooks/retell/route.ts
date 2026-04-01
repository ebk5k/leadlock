import { NextResponse } from "next/server";

import { resolveBusinessProviderConfig } from "@/lib/providers/config";
import {
  normalizeRetellWebhookPayload,
  verifyRetellWebhookSignature
} from "@/lib/providers/receptionist/retell-provider";
import { receptionistService } from "@/lib/services/receptionist-service";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-retell-signature") ?? "";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  const config = await resolveBusinessProviderConfig({ integrationKind: "receptionist" });
  const apiKey = config.secrets.apiKey ?? "";

  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "Retell API key is not configured." },
      { status: 500 }
    );
  }

  if (!verifyRetellWebhookSignature(rawBody, signature, apiKey)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized webhook request." },
      { status: 401 }
    );
  }

  // Only process end-of-call events
  const event = typeof payload.event === "string" ? payload.event : "";
  if (event !== "call_ended" && event !== "call_analyzed") {
    return NextResponse.json({ success: true, message: "Event ignored." });
  }

  const normalizedCall = normalizeRetellWebhookPayload(payload);
  const call = await receptionistService.createCall(normalizedCall);

  return NextResponse.json({ success: true, call });
}
