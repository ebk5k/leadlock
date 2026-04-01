import { resolveActiveBusinessContext, resolveAuthorizedSessionContext } from "@/lib/business-context";
import { getDatabase } from "@/lib/data/database";
import { getLaunchReadiness } from "@/lib/settings/launch-readiness";
import { installReminderService } from "@/lib/services/install-reminder-service";
import { installWorkflowService } from "@/lib/services/install-workflow-service";
import { operatorNotificationService } from "@/lib/services/operator-notification-service";
import { operatorWorkloadService } from "@/lib/services/operator-workload-service";
import { providerConfigService } from "@/lib/services/provider-config-service";
import { providerVerificationService } from "@/lib/services/provider-verification-service";
import { settingsService } from "@/lib/services/settings-service";
import type {
  BusinessOpsRecentActivity,
  BusinessOpsSummary,
  ClientOpsDashboardSnapshot
} from "@/types/domain";

function getRecentActivityForBusiness(businessId: string): BusinessOpsRecentActivity {
  const row = getDatabase()
    .prepare(
      `
        SELECT source, activity_at
        FROM (
          SELECT 'Provider config updated' AS source, MAX(updated_at) AS activity_at
          FROM business_provider_configs
          WHERE business_id = ?

          UNION ALL

          SELECT 'Provider verification run' AS source, MAX(last_checked_at) AS activity_at
          FROM provider_verifications
          WHERE business_id = ?

          UNION ALL

          SELECT 'Install workflow updated' AS source, MAX(updated_at) AS activity_at
          FROM install_workflow_steps
          WHERE business_id = ?

          UNION ALL

          SELECT 'Appointment updated' AS source, MAX(updated_at) AS activity_at
          FROM appointments
          WHERE business_id = ?

          UNION ALL

          SELECT 'Payment updated' AS source, MAX(updated_at) AS activity_at
          FROM payments
          WHERE business_id = ?

          UNION ALL

          SELECT 'Call activity recorded' AS source, MAX(timestamp) AS activity_at
          FROM calls
          WHERE business_id = ?

          UNION ALL

          SELECT 'Lead captured' AS source, MAX(requested_at) AS activity_at
          FROM leads
          WHERE business_id = ?

          UNION ALL

          SELECT 'Follow-up recorded' AS source, MAX(created_at) AS activity_at
          FROM outbound_messages
          WHERE business_id = ?
        )
        WHERE activity_at IS NOT NULL AND activity_at != ''
        ORDER BY activity_at DESC
        LIMIT 1
      `
    )
    .get(
      businessId,
      businessId,
      businessId,
      businessId,
      businessId,
      businessId,
      businessId,
      businessId
    ) as { source?: string; activity_at?: string } | undefined;

  return {
    label: row?.source ?? "No recent activity yet",
    timestamp: row?.activity_at
  };
}

export interface ClientOpsService {
  getDashboardSnapshot(): Promise<ClientOpsDashboardSnapshot>;
}

export const clientOpsService: ClientOpsService = {
  async getDashboardSnapshot() {
    const [authorizedContext, activeBusinessContext] = await Promise.all([
      resolveAuthorizedSessionContext(),
      resolveActiveBusinessContext()
    ]);

    const allowedBusinessIds = authorizedContext.allowedBusinessClients.map((business) => business.id);
    const [workload, unreadNotificationsByBusiness] = await Promise.all([
      operatorWorkloadService.getWorkloadSnapshot(),
      operatorNotificationService.getUnreadCountByBusinessIds(allowedBusinessIds)
    ]);

    const businesses = await Promise.all(
      authorizedContext.allowedBusinessClients.map(async (businessClient) => {
        const [settings, providerConfigs, providerVerifications, installWorkflow, reminderSummaries] = await Promise.all([
          settingsService.getSettingsForBusiness(businessClient.id),
          providerConfigService.getProviderConfigsForBusiness(businessClient.id),
          providerVerificationService.getProviderVerificationsForBusiness(businessClient.id),
          installWorkflowService.getWorkflowForBusiness(businessClient.id),
          installReminderService.getReminderSummariesForBusiness(businessClient.id)
        ]);
        const launchReadiness = getLaunchReadiness(settings);
        const membership = authorizedContext.memberships.find(
          (item) => item.businessId === businessClient.id
        );

        const providerConfigSummary = {
          configuredCount: providerConfigs.filter((config) => config.isConfigured).length,
          totalCount: providerConfigs.length,
          usingFallbackCount: providerConfigs.filter((config) => config.source !== "business").length
        };
        const providerVerificationSummary = {
          passedCount: providerVerifications.filter((item) => item.status === "passed").length,
          failedCount: providerVerifications.filter((item) => item.status === "failed").length,
          pendingCount: providerVerifications.filter((item) => item.status === "pending").length,
          totalCount: providerVerifications.length,
          lastCheckedAt: providerVerifications
            .map((item) => item.lastCheckedAt)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => right.localeCompare(left))[0]
        };
        const nextBlockingStep = installWorkflow.steps.find((step) => step.status !== "complete");

        return {
          businessClient,
          membershipRole: membership?.role,
          isActiveBusiness: activeBusinessContext.businessId === businessClient.id,
          providerConfigSummary,
          providerVerificationSummary,
          installWorkflow,
          launchReadiness,
          coordination: {
            overdueStepCount: installWorkflow.overdueStepCount,
            unassignedOpenStepCount: installWorkflow.unassignedOpenStepCount,
            nextBlockingStepLabel: nextBlockingStep?.label,
            nextBlockingStepOwner: nextBlockingStep?.ownerName ?? nextBlockingStep?.ownerEmail,
            outstandingReminderCount: installWorkflow.steps.filter(
              (step) => reminderSummaries[step.key]?.hasOutstandingReminder
            ).length,
            notificationCount: unreadNotificationsByBusiness[businessClient.id] ?? 0
          },
          recentActivity: getRecentActivityForBusiness(businessClient.id)
        } satisfies BusinessOpsSummary;
      })
    );

    return {
      businesses,
      workload,
      totals: {
        totalBusinesses: businesses.length,
        launchApprovedCount: businesses.filter((business) => business.installWorkflow.launchApproved).length,
        blockedCount: businesses.filter(
          (business) => !business.installWorkflow.launchApproved && !business.installWorkflow.canApproveLaunch
        ).length,
        readyForApprovalCount: businesses.filter(
          (business) => !business.installWorkflow.launchApproved && business.installWorkflow.canApproveLaunch
        ).length,
        verificationAttentionCount: businesses.filter(
          (business) => business.providerVerificationSummary.failedCount > 0
        ).length,
        overdueBusinessesCount: businesses.filter((business) => business.coordination.overdueStepCount > 0).length,
        unassignedBusinessesCount: businesses.filter(
          (business) => business.coordination.unassignedOpenStepCount > 0
        ).length,
        businessesWithOutstandingRemindersCount: businesses.filter(
          (business) => business.coordination.outstandingReminderCount > 0
        ).length,
        unreadNotificationCount: workload.inbox.unreadCount
      }
    };
  }
};
