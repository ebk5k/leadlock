import { resolveAuthorizedSessionContext } from "@/lib/business-context";
import { getPersistenceAdapter } from "@/lib/data/adapter";
import { installWorkflowService } from "@/lib/services/install-workflow-service";
import { operatorNotificationService } from "@/lib/services/operator-notification-service";
import type {
  InstallReminderEvent,
  InstallReminderSweepResult,
  InstallReminderType,
  InstallReminderSummary,
  InstallWorkflowStep,
  InstallWorkflowStepKey
} from "@/types/domain";

const REMINDER_THROTTLE_MS = 1000 * 60 * 60 * 24;
const UPCOMING_REMINDER_WINDOW_DAYS = 2;

function appendReminderEvent(input: {
  id?: string;
  businessId: string;
  stepId: string;
  stepKey: InstallWorkflowStepKey;
  reminderType: InstallReminderType;
  eventType: InstallReminderEvent["eventType"];
  summary: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  actorUserId?: string;
  actorEmail?: string;
  createdAt?: string;
  acknowledgedAt?: string;
}) {
  const now = input.createdAt ?? new Date().toISOString();
  getPersistenceAdapter().installCoordination.appendReminderEvent({
    id: input.id ?? `${input.businessId}:${input.stepKey}:${input.reminderType}:${input.eventType}:${now}`,
    businessId: input.businessId,
    stepId: input.stepId,
    stepKey: input.stepKey,
    reminderType: input.reminderType,
    eventType: input.eventType,
    summary: input.summary,
    ownerUserId: input.ownerUserId,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail,
    createdAt: now,
    acknowledgedAt: input.acknowledgedAt
  });
}

function getReminderEventsForBusiness(businessId: string) {
  return getPersistenceAdapter().installCoordination.listReminderEvents(businessId);
}

function buildReminderSummary(
  businessId: string,
  step: InstallWorkflowStep,
  events: InstallReminderEvent[]
): InstallReminderSummary {
  const history = events.filter(
    (event) =>
      (event.stepId === step.id || event.stepKey === step.key) &&
      event.reminderType === "overdue"
  );
  const lastReminderAt = history.find((event) => event.eventType === "overdue_generated")?.createdAt;
  const lastAcknowledgedAt =
    history.find((event) => event.eventType === "acknowledged")?.acknowledgedAt ??
    history.find((event) => event.eventType === "acknowledged")?.createdAt;

  return {
    businessId,
    stepId: step.id,
    stepKey: step.key,
    lastReminderAt,
    lastAcknowledgedAt,
    hasOutstandingReminder: lastReminderAt
      ? !lastAcknowledgedAt || lastAcknowledgedAt < lastReminderAt
      : false,
    history: history.slice(0, 5)
  };
}

function shouldGenerateReminder(
  step: InstallWorkflowStep,
  events: InstallReminderEvent[],
  reminderType: InstallReminderType
) {
  if (step.status === "complete" || !step.ownerUserId || !step.dueDate) {
    return false;
  }

  const dueDate = new Date(`${step.dueDate}T23:59:59.999Z`).getTime();
  const now = Date.now();

  const isEligible =
    reminderType === "overdue"
      ? step.isOverdue
      : !step.isOverdue && dueDate >= now && dueDate - now <= UPCOMING_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  if (!isEligible) {
    return false;
  }

  const lastReminderAt = events.find(
    (event) => event.eventType === "overdue_generated" && event.reminderType === reminderType
  )?.createdAt;

  if (!lastReminderAt) {
    return true;
  }

  return now - new Date(lastReminderAt).getTime() >= REMINDER_THROTTLE_MS;
}

export interface InstallReminderService {
  getReminderSummariesForBusiness(businessId: string): Promise<Record<InstallWorkflowStepKey, InstallReminderSummary>>;
  runReminderSweepForBusinesses(input: {
    businessIds: string[];
    includeUpcoming?: boolean;
  }): Promise<InstallReminderSweepResult>;
  acknowledgeReminder(input: { businessId: string; stepKey: InstallWorkflowStepKey }): Promise<void>;
}

export const installReminderService: InstallReminderService = {
  async getReminderSummariesForBusiness(businessId) {
    const events = getReminderEventsForBusiness(businessId);
    const workflow = await installWorkflowService.getWorkflowForBusiness(businessId);

    return Object.fromEntries(
      workflow.steps.map((step) => [step.key, buildReminderSummary(businessId, step, events)])
    ) as Record<InstallWorkflowStepKey, InstallReminderSummary>;
  },

  async runReminderSweepForBusinesses({ businessIds, includeUpcoming = false }) {
    const authorizedContext = await resolveAuthorizedSessionContext();
    const actor = authorizedContext.session?.user;
    const generated: InstallReminderEvent[] = [];
    let overdueGeneratedCount = 0;
    let upcomingGeneratedCount = 0;

    for (const businessId of businessIds) {
      const workflow = await installWorkflowService.getWorkflowForBusiness(businessId);
      const events = getReminderEventsForBusiness(businessId);

      for (const step of workflow.steps) {
        const stepEvents = events.filter(
          (event) => event.stepId === step.id || event.stepKey === step.key
        );
        const reminderTypes: InstallReminderType[] = includeUpcoming ? ["overdue", "upcoming"] : ["overdue"];

        for (const reminderType of reminderTypes) {
          if (!shouldGenerateReminder(step, stepEvents, reminderType)) {
            continue;
          }

          const summary =
            reminderType === "overdue"
              ? `Overdue reminder generated for ${step.label}.`
              : `Upcoming due-date reminder generated for ${step.label}.`;
          const createdAt = new Date().toISOString();
          const reminderEvent: InstallReminderEvent = {
            id: `${businessId}:${step.key}:${reminderType}:overdue_generated:${createdAt}`,
            businessId,
            stepId: step.id,
            stepKey: step.key,
            reminderType,
            eventType: "overdue_generated",
            summary,
            ownerUserId: step.ownerUserId,
            ownerName: step.ownerName,
            ownerEmail: step.ownerEmail,
            actorUserId: actor?.id,
            actorEmail: actor?.email,
            createdAt
          };

          appendReminderEvent({
            ...reminderEvent
          });
          generated.push(reminderEvent);
          events.unshift(reminderEvent);

          if (reminderType === "overdue") {
            overdueGeneratedCount += 1;
          } else {
            upcomingGeneratedCount += 1;
          }
        }
      }
    }

    await operatorNotificationService.createDeliveriesForReminderEvents(generated);

    return {
      remindersGenerated: generated,
      overdueGeneratedCount,
      upcomingGeneratedCount
    };
  },

  async acknowledgeReminder(input) {
    const authorizedContext = await resolveAuthorizedSessionContext();
    const actor = authorizedContext.session?.user;
    const workflow = await installWorkflowService.getWorkflowForBusiness(input.businessId);
    const step = workflow.steps.find((item) => item.key === input.stepKey);

    if (!step) {
      throw new Error("Unknown install workflow step.");
    }

    appendReminderEvent({
      id: `${input.businessId}:${input.stepKey}:overdue:acknowledged:${new Date().toISOString()}`,
      businessId: input.businessId,
      stepId: step.id,
      stepKey: input.stepKey,
      reminderType: "overdue",
      eventType: "acknowledged",
      summary: `Reminder acknowledged for ${step.label}.`,
      ownerUserId: step.ownerUserId,
      ownerName: step.ownerName,
      ownerEmail: step.ownerEmail,
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      createdAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString()
    });
  }
};
