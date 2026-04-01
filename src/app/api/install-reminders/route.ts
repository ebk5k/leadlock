import { NextResponse } from "next/server";

import { resolveAuthorizedSessionContext } from "@/lib/business-context";
import { installReminderService } from "@/lib/services/install-reminder-service";
import type { InstallWorkflowStepKey } from "@/types/domain";

function isWorkflowStepKey(value: unknown): value is InstallWorkflowStepKey {
  return (
    value === "provider_config_reviewed" ||
    value === "payments_verified" ||
    value === "calendar_verified" ||
    value === "messaging_verified" ||
    value === "receptionist_verified" ||
    value === "test_booking_verified" ||
    value === "test_payment_verified" ||
    value === "launch_approved"
  );
}

export async function POST(request: Request) {
  const authorizedContext = await resolveAuthorizedSessionContext();
  const businessIds = authorizedContext.allowedBusinessClients.map((business) => business.id);
  const payload = (await request.json().catch(() => ({}))) as { includeUpcoming?: boolean } | null;
  const sweep = await installReminderService.runReminderSweepForBusinesses({
    businessIds,
    includeUpcoming: payload?.includeUpcoming ?? false
  });

  return NextResponse.json({
    success: true,
    generatedCount: sweep.remindersGenerated.length,
    overdueGeneratedCount: sweep.overdueGeneratedCount,
    upcomingGeneratedCount: sweep.upcomingGeneratedCount
  });
}

export async function PUT(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const businessId = payload.businessId == null ? "" : String(payload.businessId).trim();

  if (!businessId || !isWorkflowStepKey(payload.stepKey)) {
    return NextResponse.json(
      { success: false, message: "A valid business and workflow step are required." },
      { status: 400 }
    );
  }

  const authorizedContext = await resolveAuthorizedSessionContext();
  const allowedBusinessIds = new Set(authorizedContext.allowedBusinessClients.map((business) => business.id));

  if (!allowedBusinessIds.has(businessId)) {
    return NextResponse.json(
      { success: false, message: "That business is not available for this session." },
      { status: 403 }
    );
  }

  await installReminderService.acknowledgeReminder({
    businessId,
    stepKey: payload.stepKey
  });

  return NextResponse.json({ success: true });
}
