import { NextResponse } from "next/server";

import { providerVerificationService } from "@/lib/services/provider-verification-service";
import type { ProviderIntegrationKind } from "@/types/domain";

function isIntegrationKind(value: unknown): value is ProviderIntegrationKind {
  return value === "payments" || value === "calendar" || value === "messaging" || value === "receptionist";
}

export async function GET() {
  const providerVerifications = await providerVerificationService.getProviderVerifications();
  return NextResponse.json({ success: true, providerVerifications });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;

  if (!isIntegrationKind(payload.integrationKind)) {
    return NextResponse.json(
      { success: false, message: "A valid integration kind is required." },
      { status: 400 }
    );
  }

  try {
    const providerVerification = await providerVerificationService.runVerification(payload.integrationKind);
    return NextResponse.json({ success: true, providerVerification });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to run provider verification."
      },
      { status: 400 }
    );
  }
}
