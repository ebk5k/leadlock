import { NextResponse } from "next/server";

import { installWorkflowService } from "@/lib/services/install-workflow-service";
import type { InstallWorkflowStepKey, InstallWorkflowStepPriority } from "@/types/domain";

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

function isPriority(value: unknown): value is InstallWorkflowStepPriority {
  return value === "normal" || value === "high";
}

export async function GET() {
  const workflow = await installWorkflowService.getWorkflow();
  return NextResponse.json({ success: true, workflow });
}

export async function PUT(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;

  if (!isWorkflowStepKey(payload.stepKey)) {
    return NextResponse.json(
      { success: false, message: "A valid workflow step key is required." },
      { status: 400 }
    );
  }

  try {
    const workflow = await installWorkflowService.updateStep({
      stepKey: payload.stepKey,
      completed: payload.completed == null ? undefined : Boolean(payload.completed),
      notes: payload.notes == null ? undefined : String(payload.notes),
      ownerUserId:
        payload.ownerUserId == null || payload.ownerUserId === ""
          ? null
          : String(payload.ownerUserId),
      dueDate:
        payload.dueDate == null || payload.dueDate === ""
          ? null
          : String(payload.dueDate),
      priority: isPriority(payload.priority) ? payload.priority : undefined,
      force: Boolean(payload.force)
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update install workflow."
      },
      { status: 400 }
    );
  }
}
