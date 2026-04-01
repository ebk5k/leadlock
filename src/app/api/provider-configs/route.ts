import { NextResponse } from "next/server";

import { providerConfigService } from "@/lib/services/provider-config-service";
import type { ProviderIntegrationKind } from "@/types/domain";

function normalizeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, recordValue]) => [
      key,
      String(recordValue ?? "")
    ])
  );
}

function isIntegrationKind(value: unknown): value is ProviderIntegrationKind {
  return value === "payments" || value === "calendar" || value === "messaging" || value === "receptionist";
}

export async function GET() {
  const providerConfigs = await providerConfigService.getProviderConfigs();
  return NextResponse.json({ success: true, providerConfigs });
}

export async function PUT(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;

  if (!isIntegrationKind(payload.integrationKind)) {
    return NextResponse.json(
      { success: false, message: "A valid integration kind is required." },
      { status: 400 }
    );
  }

  try {
    const providerConfig = await providerConfigService.updateProviderConfig({
      integrationKind: payload.integrationKind,
      providerName: String(payload.providerName ?? "").trim(),
      status: payload.status === "inactive" ? "inactive" : "active",
      config: normalizeRecord(payload.config),
      secrets: normalizeRecord(payload.secrets),
      metadata: normalizeRecord(payload.metadata)
    });

    return NextResponse.json({ success: true, providerConfig });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update provider config."
      },
      { status: 400 }
    );
  }
}
