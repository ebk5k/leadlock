import { NextResponse } from "next/server";

import { settingsService } from "@/lib/services/settings-service";

export async function GET() {
  const settings = await settingsService.getSettings();

  return NextResponse.json({ success: true, settings });
}

export async function PUT(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const currentSettings = await settingsService.getSettings();

  try {
    const settings = await settingsService.updateSettings({
      businessId: currentSettings.businessId,
      businessClient: currentSettings.businessClient,
      businessName: String(payload.businessName ?? currentSettings.businessName),
      businessPhone: String(payload.businessPhone ?? currentSettings.businessPhone),
      businessEmail: String(payload.businessEmail ?? currentSettings.businessEmail),
      services: Array.isArray(payload.services)
        ? payload.services.map((item) => String(item))
        : currentSettings.services,
      workingHours: Array.isArray(payload.workingHours)
        ? payload.workingHours.map((item) => String(item))
        : currentSettings.workingHours,
      defaultJobPriceCents: Number(payload.defaultJobPriceCents ?? currentSettings.defaultJobPriceCents),
      currency: String(payload.currency ?? currentSettings.currency),
      confirmationMessageTemplate: String(
        payload.confirmationMessageTemplate ?? currentSettings.confirmationMessageTemplate
      ),
      reminderMessageTemplate: String(
        payload.reminderMessageTemplate ?? currentSettings.reminderMessageTemplate
      ),
      onboardingCompleted:
        payload.onboardingCompleted == null
          ? currentSettings.onboardingCompleted
          : Boolean(payload.onboardingCompleted),
      onboardingCompletedAt:
        payload.onboardingCompletedAt == null
          ? currentSettings.onboardingCompletedAt
          : String(payload.onboardingCompletedAt),
      launchReadinessFlags:
        payload.launchReadinessFlags &&
        typeof payload.launchReadinessFlags === "object" &&
        !Array.isArray(payload.launchReadinessFlags)
          ? {
              calendarProviderConfigured: Boolean(
                (payload.launchReadinessFlags as Record<string, unknown>).calendarProviderConfigured
              ),
              paymentProviderConfigured: Boolean(
                (payload.launchReadinessFlags as Record<string, unknown>).paymentProviderConfigured
              )
            }
          : currentSettings.launchReadinessFlags,
      installChecklistFlags:
        payload.installChecklistFlags &&
        typeof payload.installChecklistFlags === "object" &&
        !Array.isArray(payload.installChecklistFlags)
          ? {
              phoneAiReceptionistVerified: Boolean(
                (payload.installChecklistFlags as Record<string, unknown>).phoneAiReceptionistVerified
              ),
              testBookingVerified: Boolean(
                (payload.installChecklistFlags as Record<string, unknown>).testBookingVerified
              ),
              testPaymentVerified: Boolean(
                (payload.installChecklistFlags as Record<string, unknown>).testPaymentVerified
              ),
              launchApproved: Boolean(
                (payload.installChecklistFlags as Record<string, unknown>).launchApproved
              )
            }
          : currentSettings.installChecklistFlags
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update settings."
      },
      { status: 400 }
    );
  }
}
