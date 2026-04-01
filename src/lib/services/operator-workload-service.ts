import { resolveAuthorizedSessionContext } from "@/lib/business-context";
import { operatorNotificationService } from "@/lib/services/operator-notification-service";
import { installReminderService } from "@/lib/services/install-reminder-service";
import { installWorkflowService } from "@/lib/services/install-workflow-service";
import type {
  OperatorWorkloadGroup,
  OperatorWorkloadSnapshot,
  OperatorWorkloadStep
} from "@/types/domain";

function compareSteps(left: OperatorWorkloadStep, right: OperatorWorkloadStep) {
  if (left.isOverdue !== right.isOverdue) {
    return left.isOverdue ? -1 : 1;
  }

  if (left.priority !== right.priority) {
    return left.priority === "high" ? -1 : 1;
  }

  return (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31");
}

export interface OperatorWorkloadService {
  getWorkloadSnapshot(): Promise<OperatorWorkloadSnapshot>;
}

export const operatorWorkloadService: OperatorWorkloadService = {
  async getWorkloadSnapshot() {
    const authorizedContext = await resolveAuthorizedSessionContext();
    const workloadMap = new Map<string, OperatorWorkloadGroup>();
    const currentOperatorUserId = authorizedContext.session?.user.id;
    const inbox = await operatorNotificationService.getInboxSnapshot();

    for (const businessClient of authorizedContext.allowedBusinessClients) {
      const [workflow, reminderSummaries] = await Promise.all([
        installWorkflowService.getWorkflowForBusiness(businessClient.id),
        installReminderService.getReminderSummariesForBusiness(businessClient.id)
      ]);
      const blockingStep = workflow.steps.find((step) => step.status !== "complete");

      for (const step of workflow.steps) {
        if (step.status === "complete") {
          continue;
        }

        const groupKey = step.ownerUserId ?? "unassigned";
        const existingGroup =
          workloadMap.get(groupKey) ??
          {
            operatorUserId: step.ownerUserId,
            operatorName: step.ownerName ?? "Unassigned work",
            operatorEmail: step.ownerEmail,
            assignedBusinessesCount: 0,
            overdueStepsCount: 0,
            outstandingReminderCount: 0,
            steps: []
          };
        const reminder = reminderSummaries[step.key];
        const workloadStep: OperatorWorkloadStep = {
          businessId: businessClient.id,
          businessName: businessClient.name,
          stepKey: step.key,
          stepLabel: step.label,
          status: step.status,
          dueDate: step.dueDate,
          isOverdue: step.isOverdue,
          priority: step.priority,
          isBlockingStep: blockingStep?.key === step.key,
          blockingContext: blockingStep?.key === step.key ? "Current blocking install step" : undefined,
          reminder
        };

        existingGroup.steps.push(workloadStep);
        existingGroup.assignedBusinessesCount = new Set(
          existingGroup.steps.map((item) => item.businessId)
        ).size;
        existingGroup.overdueStepsCount = existingGroup.steps.filter((item) => item.isOverdue).length;
        existingGroup.outstandingReminderCount = existingGroup.steps.filter(
          (item) => item.reminder.hasOutstandingReminder
        ).length;
        workloadMap.set(groupKey, existingGroup);
      }
    }

    const groups = Array.from(workloadMap.values())
      .map((group) => ({
        ...group,
        steps: group.steps.sort(compareSteps)
      }))
      .sort((left, right) => {
        if (left.overdueStepsCount !== right.overdueStepsCount) {
          return right.overdueStepsCount - left.overdueStepsCount;
        }

        if (left.outstandingReminderCount !== right.outstandingReminderCount) {
          return right.outstandingReminderCount - left.outstandingReminderCount;
        }

        return left.operatorName.localeCompare(right.operatorName);
      });

    return {
      currentOperatorUserId,
      myTasks: currentOperatorUserId
        ? groups.find((group) => group.operatorUserId === currentOperatorUserId)?.steps ?? []
        : [],
      groups,
      inbox,
      totals: {
        totalAssignedSteps: groups.reduce((total, group) => total + group.steps.length, 0),
        overdueStepsCount: groups.reduce((total, group) => total + group.overdueStepsCount, 0),
        outstandingReminderCount: groups.reduce(
          (total, group) => total + group.outstandingReminderCount,
          0
        ),
        operatorsWithAssignments: groups.filter((group) => group.operatorUserId).length
      }
    };
  }
};
