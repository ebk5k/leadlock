import { NextResponse } from "next/server";

import { operatorNotificationService } from "@/lib/services/operator-notification-service";

export async function PUT(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const notificationId = payload.notificationId == null ? "" : String(payload.notificationId).trim();

  if (!notificationId) {
    return NextResponse.json(
      { success: false, message: "A notification id is required." },
      { status: 400 }
    );
  }

  try {
    await operatorNotificationService.markAsRead(notificationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update notification."
      },
      { status: 400 }
    );
  }
}
