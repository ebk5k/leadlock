import { resolveAuthorizedSessionContext } from "@/lib/business-context";
import { getPersistenceAdapter } from "@/lib/data/adapter";
import { installWorkflowService } from "@/lib/services/install-workflow-service";
import type { InstallReminderEvent, OperatorInboxSnapshot } from "@/types/domain";

export interface OperatorNotificationService {
  createDeliveriesForReminderEvents(reminderEvents: InstallReminderEvent[]): Promise<number>;
  getInboxSnapshot(): Promise<OperatorInboxSnapshot>;
  getUnreadCountByBusinessIds(businessIds: string[]): Promise<Record<string, number>>;
  markAsRead(notificationId: string): Promise<void>;
}

export const operatorNotificationService: OperatorNotificationService = {
  async createDeliveriesForReminderEvents(reminderEvents) {
    let createdCount = 0;

    for (const event of reminderEvents) {
      if (!event.ownerUserId || !event.stepId) {
        continue;
      }

      const existing = getPersistenceAdapter().installCoordination.findOperatorNotificationByReminder(
        event.id,
        event.ownerUserId
      );

      if (existing?.id) {
        continue;
      }

      const workflow = await installWorkflowService.getWorkflowForBusiness(event.businessId);
      const step = workflow.steps.find((item) => item.id === event.stepId || item.key === event.stepKey);

      if (!step) {
        continue;
      }

      getPersistenceAdapter().installCoordination.createOperatorNotification({
        id: `${event.id}:${event.ownerUserId}`,
        businessId: event.businessId,
        stepId: event.stepId,
        stepKey: event.stepKey,
        stepLabel: step.label,
        operatorUserId: event.ownerUserId,
        operatorName: event.ownerName,
        operatorEmail: event.ownerEmail,
        reminderEventId: event.id,
        reminderType: event.reminderType,
        status: "unread",
        summary: event.summary,
        createdAt: event.createdAt
      });

      createdCount += 1;
    }

    return createdCount;
  },

  async getInboxSnapshot() {
    const authorizedContext = await resolveAuthorizedSessionContext();
    const operatorUserId = authorizedContext.session?.user.id;
    const allowedBusinessIds = authorizedContext.allowedBusinessClients.map((business) => business.id);

    if (!operatorUserId || allowedBusinessIds.length === 0) {
      return {
        notifications: [],
        unreadCount: 0
      };
    }

    const notifications = getPersistenceAdapter().installCoordination.listOperatorNotificationsForOperator(
      operatorUserId,
      allowedBusinessIds
    );

    return {
      notifications,
      unreadCount: notifications.filter((row) => row.status === "unread").length
    };
  },

  async getUnreadCountByBusinessIds(businessIds) {
    return getPersistenceAdapter().installCoordination.countUnreadNotificationsByBusinessIds(businessIds);
  },

  async markAsRead(notificationId) {
    const authorizedContext = await resolveAuthorizedSessionContext();
    const operatorUserId = authorizedContext.session?.user.id;

    if (!operatorUserId) {
      throw new Error("No authenticated operator session was found.");
    }

    const notification = getPersistenceAdapter().installCoordination.findOperatorNotificationAccessRecord(notificationId);

    if (!notification?.businessId || notification.operatorUserId !== operatorUserId) {
      throw new Error("That notification is not available for this operator.");
    }

    const allowedBusinessIds = new Set(authorizedContext.allowedBusinessClients.map((business) => business.id));

    if (!allowedBusinessIds.has(notification.businessId)) {
      throw new Error("That business is not available for this session.");
    }

    getPersistenceAdapter().installCoordination.markOperatorNotificationRead(notificationId, new Date().toISOString());
  }
};
