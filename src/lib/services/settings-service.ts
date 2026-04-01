import { getInstallChecklist } from "@/lib/settings/install-checklist";
import { getLaunchReadiness } from "@/lib/settings/launch-readiness";
import {
  getPersistedSettings,
  getPersistedSettingsForBusiness,
  writePersistedSettings
} from "@/lib/settings/store";
import { providerConfigService } from "@/lib/services/provider-config-service";
import { installWorkflowService } from "@/lib/services/install-workflow-service";
import { providerVerificationService } from "@/lib/services/provider-verification-service";
import { messagingService } from "@/lib/services/messaging-service";
import type {
  BusinessClient,
  BusinessSettings,
  FollowUpEvent,
  InstallChecklistSnapshot,
  InstallWorkflowSnapshot,
  LaunchReadinessSnapshot,
  ProviderConfigView,
  ProviderVerification
} from "@/types/domain";

export interface SettingsService {
  getSettings(): Promise<BusinessSettings>;
  getSettingsForBusiness(businessId: string): Promise<BusinessSettings>;
  getBusinessClient(): Promise<BusinessClient>;
  updateSettings(settings: BusinessSettings): Promise<BusinessSettings>;
  getFollowUps(): Promise<FollowUpEvent[]>;
  getLaunchReadiness(): Promise<LaunchReadinessSnapshot>;
  getInstallChecklist(): Promise<InstallChecklistSnapshot>;
  getProviderConfigs(): Promise<ProviderConfigView[]>;
  getProviderVerifications(): Promise<ProviderVerification[]>;
  getInstallWorkflow(): Promise<InstallWorkflowSnapshot>;
}

export const settingsService: SettingsService = {
  async getSettings() {
    return Promise.resolve(getPersistedSettings());
  },
  async getSettingsForBusiness(businessId) {
    return Promise.resolve(getPersistedSettingsForBusiness(businessId));
  },
  async getBusinessClient() {
    return Promise.resolve(getPersistedSettings().businessClient);
  },
  async updateSettings(settings) {
    const existingSettings = getPersistedSettings();
    const onboardingCompleted = Boolean(settings.onboardingCompleted);
    const normalizedSettings: BusinessSettings = {
      businessId: existingSettings.businessId,
      businessClient: {
        id: existingSettings.businessId,
        name: settings.businessName.trim(),
        status: existingSettings.businessClient.status,
        createdAt: existingSettings.businessClient.createdAt
      },
      businessName: settings.businessName.trim(),
      businessPhone: settings.businessPhone.trim(),
      businessEmail: settings.businessEmail.trim(),
      services: settings.services.map((item) => item.trim()).filter(Boolean),
      workingHours: settings.workingHours.map((item) => item.trim()).filter(Boolean),
      defaultJobPriceCents: Number(settings.defaultJobPriceCents),
      currency: settings.currency.trim().toLowerCase(),
      confirmationMessageTemplate: settings.confirmationMessageTemplate.trim(),
      reminderMessageTemplate: settings.reminderMessageTemplate.trim(),
      onboardingCompleted,
      onboardingCompletedAt: onboardingCompleted
        ? settings.onboardingCompletedAt ?? existingSettings.onboardingCompletedAt ?? new Date().toISOString()
        : undefined,
      launchReadinessFlags: {
        calendarProviderConfigured: Boolean(settings.launchReadinessFlags.calendarProviderConfigured),
        paymentProviderConfigured: Boolean(settings.launchReadinessFlags.paymentProviderConfigured)
      },
      installChecklistFlags: {
        phoneAiReceptionistVerified: Boolean(settings.installChecklistFlags.phoneAiReceptionistVerified),
        testBookingVerified: Boolean(settings.installChecklistFlags.testBookingVerified),
        testPaymentVerified: Boolean(settings.installChecklistFlags.testPaymentVerified),
        launchApproved: Boolean(settings.installChecklistFlags.launchApproved)
      }
    };

    if (
      !normalizedSettings.businessName ||
      !normalizedSettings.businessPhone ||
      !normalizedSettings.businessEmail ||
      !normalizedSettings.currency ||
      !normalizedSettings.confirmationMessageTemplate ||
      !normalizedSettings.reminderMessageTemplate ||
      Number.isNaN(normalizedSettings.defaultJobPriceCents)
    ) {
      throw new Error("Settings are missing required values.");
    }

    writePersistedSettings(normalizedSettings);

    return normalizedSettings;
  },
  async getFollowUps() {
    return messagingService.getFollowUps();
  },
  async getLaunchReadiness() {
    return getLaunchReadiness(getPersistedSettings());
  },
  async getInstallChecklist() {
    return getInstallChecklist(getPersistedSettings());
  },
  async getProviderConfigs() {
    return providerConfigService.getProviderConfigs();
  },
  async getProviderVerifications() {
    return providerVerificationService.getProviderVerifications();
  },
  async getInstallWorkflow() {
    return installWorkflowService.getWorkflow();
  }
};
