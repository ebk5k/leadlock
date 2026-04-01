import { resolveActiveBusinessContext, resolveAuthorizedSessionContext } from "@/lib/business-context";
import { getPersistenceAdapter } from "@/lib/data/adapter";
import { getPersistedSettingsForBusiness } from "@/lib/settings/store";
import { providerVerificationService } from "@/lib/services/provider-verification-service";
import type {
  InstallWorkflowAssignee,
  InstallWorkflowEvent,
  InstallWorkflowEventType,
  InstallWorkflowSnapshot,
  InstallWorkflowStep,
  InstallWorkflowStepKey,
  InstallWorkflowStepPriority,
  InstallWorkflowStepStatus,
  ProviderIntegrationKind
} from "@/types/domain";

type StoredInstallWorkflowStep = {
  id: string;
  key: InstallWorkflowStepKey;
  status: InstallWorkflowStepStatus;
  notes?: string;
  summary?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority: InstallWorkflowStepPriority;
  lastCompletedAt?: string;
  completedByUserId?: string;
  completedByEmail?: string;
};

const STEP_DEFINITIONS: Array<{
  key: InstallWorkflowStepKey;
  label: string;
  description: string;
  autoManaged: boolean;
}> = [
  {
    key: "provider_config_reviewed",
    label: "Provider config reviewed",
    description: "An operator has reviewed the active business provider setup and confirmed the install path.",
    autoManaged: false
  },
  {
    key: "payments_verified",
    label: "Payments verified",
    description: "Payment provider verification has passed for the active business.",
    autoManaged: true
  },
  {
    key: "calendar_verified",
    label: "Calendar verified",
    description: "Calendar provider verification has passed for the active business.",
    autoManaged: true
  },
  {
    key: "messaging_verified",
    label: "Messaging reviewed / verified",
    description: "Messaging provider verification has passed for the active business.",
    autoManaged: true
  },
  {
    key: "receptionist_verified",
    label: "Receptionist / webhook trust reviewed",
    description: "Receptionist webhook trust verification has passed for the active business.",
    autoManaged: true
  },
  {
    key: "test_booking_verified",
    label: "Test booking verified",
    description: "An operator has confirmed a booking test for this business.",
    autoManaged: false
  },
  {
    key: "test_payment_verified",
    label: "Test payment verified",
    description: "An operator has confirmed a payment test for this business.",
    autoManaged: false
  },
  {
    key: "launch_approved",
    label: "Launch approved",
    description: "Final delivery signoff for this business.",
    autoManaged: false
  }
];

const REQUIRED_APPROVAL_STEPS: InstallWorkflowStepKey[] = [
  "provider_config_reviewed",
  "payments_verified",
  "calendar_verified",
  "messaging_verified",
  "receptionist_verified",
  "test_booking_verified",
  "test_payment_verified"
];

function getStepDefinition(stepKey: InstallWorkflowStepKey) {
  return STEP_DEFINITIONS.find((step) => step.key === stepKey);
}

function normalizeDueDate(value: unknown) {
  if (!value) {
    return undefined;
  }

  const dateValue = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : undefined;
}

function isStepOverdue(step: { status: InstallWorkflowStepStatus; dueDate?: string }) {
  if (step.status === "complete" || !step.dueDate) {
    return false;
  }

  return step.dueDate < new Date().toISOString().slice(0, 10);
}

function getStoredWorkflowSteps(businessId: string) {
  return new Map(
    getPersistenceAdapter().installCoordination.listWorkflowSteps(businessId).map((step) => [step.key, step] as const)
  );
}

function getWorkflowHistoryByStep(businessId: string) {
  const history = new Map<InstallWorkflowStepKey, InstallWorkflowEvent[]>();

  for (const event of getPersistenceAdapter().installCoordination.listWorkflowEvents(businessId)) {
    const existing = history.get(event.stepKey) ?? [];
    existing.push(event);
    history.set(event.stepKey, existing);
  }

  return history;
}

function getAssigneesForBusiness(businessId: string): InstallWorkflowAssignee[] {
  return getPersistenceAdapter().installCoordination.listBusinessAssignees(businessId);
}

function findAssigneeByUserId(businessId: string, userId: string) {
  return getAssigneesForBusiness(businessId).find((assignee) => assignee.userId === userId) ?? null;
}

function upsertWorkflowStep(input: {
  businessId: string;
  key: InstallWorkflowStepKey;
  status: InstallWorkflowStepStatus;
  notes?: string;
  summary?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority: InstallWorkflowStepPriority;
  lastCompletedAt?: string;
  completedByUserId?: string;
  completedByEmail?: string;
}) {
  getPersistenceAdapter().installCoordination.upsertWorkflowStep(input);
}

function appendWorkflowEvent(input: {
  businessId: string;
  stepKey: InstallWorkflowStepKey;
  eventType: InstallWorkflowEventType;
  summary: string;
  notes?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority?: InstallWorkflowStepPriority;
  actorUserId?: string;
  actorEmail?: string;
}) {
  getPersistenceAdapter().installCoordination.appendWorkflowEvent(input);
}

function verificationStepKey(integrationKind: ProviderIntegrationKind): InstallWorkflowStepKey {
  switch (integrationKind) {
    case "payments":
      return "payments_verified";
    case "calendar":
      return "calendar_verified";
    case "messaging":
      return "messaging_verified";
    case "receptionist":
    default:
      return "receptionist_verified";
  }
}

async function syncDerivedSteps(businessId: string) {
  const [providerVerifications, settings] = await Promise.all([
    providerVerificationService.getProviderVerificationsForBusiness(businessId),
    Promise.resolve(getPersistedSettingsForBusiness(businessId))
  ]);

  for (const verification of providerVerifications) {
    const key = verificationStepKey(verification.integrationKind);
    const stored = getStoredWorkflowSteps(businessId).get(key);
    const nextStatus: InstallWorkflowStepStatus = verification.status === "passed" ? "complete" : "open";

    upsertWorkflowStep({
      businessId,
      key,
      status: nextStatus,
      notes: stored?.notes,
      summary: verification.summary,
      ownerUserId: stored?.ownerUserId,
      ownerName: stored?.ownerName,
      ownerEmail: stored?.ownerEmail,
      dueDate: stored?.dueDate,
      priority: stored?.priority ?? "normal",
      lastCompletedAt: verification.status === "passed" ? verification.lastCheckedAt : undefined,
      completedByUserId: verification.status === "passed" ? verification.checkedByUserId : undefined,
      completedByEmail: verification.status === "passed" ? verification.checkedByEmail : undefined
    });
  }

  const legacyMappings: Array<{
    key: InstallWorkflowStepKey;
    complete: boolean;
    summary: string;
  }> = [
    {
      key: "test_booking_verified",
      complete: settings.installChecklistFlags.testBookingVerified,
      summary: "Backfilled from legacy install checklist flag."
    },
    {
      key: "test_payment_verified",
      complete: settings.installChecklistFlags.testPaymentVerified,
      summary: "Backfilled from legacy install checklist flag."
    },
    {
      key: "launch_approved",
      complete: settings.installChecklistFlags.launchApproved,
      summary: "Backfilled from legacy launch approval flag."
    },
    {
      key: "receptionist_verified",
      complete: settings.installChecklistFlags.phoneAiReceptionistVerified,
      summary: "Backfilled from legacy receptionist verification flag."
    }
  ];

  for (const mapping of legacyMappings) {
    const stored = getStoredWorkflowSteps(businessId).get(mapping.key);

    if (!stored && mapping.complete) {
      upsertWorkflowStep({
        businessId,
        key: mapping.key,
        status: "complete",
        summary: mapping.summary,
        priority: "normal",
        lastCompletedAt: settings.onboardingCompletedAt ?? new Date().toISOString()
      });
    }
  }
}

function deriveWorkflowSnapshot(
  businessId: string,
  storedSteps: Map<InstallWorkflowStepKey, StoredInstallWorkflowStep>,
  historyByStep: Map<InstallWorkflowStepKey, InstallWorkflowEvent[]>
) {
  const steps: InstallWorkflowStep[] = STEP_DEFINITIONS.map((definition) => {
    const stored = storedSteps.get(definition.key);
    const baseStep = {
      key: definition.key,
      id: stored?.id ?? `${businessId}:${definition.key}`,
      label: definition.label,
      description: definition.description,
      status: stored?.status ?? "open",
      source: stored?.summary?.includes("Backfilled from legacy")
        ? "legacy"
        : definition.autoManaged
          ? "automatic"
          : "manual",
      autoManaged: definition.autoManaged,
      ownerUserId: stored?.ownerUserId,
      ownerName: stored?.ownerName,
      ownerEmail: stored?.ownerEmail,
      dueDate: stored?.dueDate,
      priority: stored?.priority ?? "normal",
      isOverdue: false,
      lastCompletedAt: stored?.lastCompletedAt,
      completedByUserId: stored?.completedByUserId,
      completedByEmail: stored?.completedByEmail,
      summary: stored?.summary,
      notes: stored?.notes,
      history: (historyByStep.get(definition.key) ?? []).slice(0, 5)
    } satisfies InstallWorkflowStep;

    return {
      ...baseStep,
      isOverdue: isStepOverdue(baseStep)
    };
  });

  const completedSteps = steps.filter((step) => step.status === "complete").length;
  const incompleteRequiredSteps = REQUIRED_APPROVAL_STEPS
    .map((stepKey) => steps.find((step) => step.key === stepKey))
    .filter((step): step is InstallWorkflowStep => Boolean(step))
    .filter((step) => step.status !== "complete");
  const blockedApprovalReasons = incompleteRequiredSteps.map((step) => `${step.label} is still open.`);
  const launchApproved = steps.find((step) => step.key === "launch_approved")?.status === "complete";
  const assignees = getAssigneesForBusiness(businessId);

  return {
    totalSteps: steps.length,
    completedSteps,
    canApproveLaunch: blockedApprovalReasons.length === 0,
    launchApproved,
    prerequisiteLabels: REQUIRED_APPROVAL_STEPS.map((stepKey) => getStepDefinition(stepKey)?.label ?? stepKey),
    blockedApprovalReasons,
    overdueStepCount: steps.filter((step) => step.isOverdue).length,
    unassignedOpenStepCount: steps.filter((step) => step.status !== "complete" && !step.ownerUserId).length,
    availableAssignees: assignees,
    steps
  } satisfies InstallWorkflowSnapshot;
}

export interface InstallWorkflowService {
  getWorkflow(): Promise<InstallWorkflowSnapshot>;
  getWorkflowForBusiness(businessId: string): Promise<InstallWorkflowSnapshot>;
  updateStep(input: {
    stepKey: InstallWorkflowStepKey;
    completed?: boolean;
    notes?: string;
    force?: boolean;
    ownerUserId?: string | null;
    dueDate?: string | null;
    priority?: InstallWorkflowStepPriority;
  }): Promise<InstallWorkflowSnapshot>;
}

export const installWorkflowService: InstallWorkflowService = {
  async getWorkflow() {
    const businessContext = await resolveActiveBusinessContext();
    return this.getWorkflowForBusiness(businessContext.businessId);
  },
  async getWorkflowForBusiness(businessId) {
    await syncDerivedSteps(businessId);
    const storedSteps = getStoredWorkflowSteps(businessId);
    const historyByStep = getWorkflowHistoryByStep(businessId);
    return deriveWorkflowSnapshot(businessId, storedSteps, historyByStep);
  },
  async updateStep(input) {
    const businessContext = await resolveActiveBusinessContext();
    const authorizedContext = await resolveAuthorizedSessionContext();
    const currentWorkflow = await this.getWorkflowForBusiness(businessContext.businessId);
    const currentStep = currentWorkflow.steps.find((step) => step.key === input.stepKey);
    const stepDefinition = getStepDefinition(input.stepKey);

    if (!stepDefinition || !currentStep) {
      throw new Error("Unknown install workflow step.");
    }

    if (stepDefinition.autoManaged && input.completed !== undefined && input.completed !== (currentStep.status === "complete")) {
      throw new Error("This step is driven by provider verification and cannot be completed manually.");
    }

    if (
      input.stepKey === "launch_approved" &&
      input.completed &&
      !currentWorkflow.canApproveLaunch &&
      !input.force
    ) {
      throw new Error("Launch approval is blocked until all required install steps are complete.");
    }

    const user = authorizedContext.session?.user;
    const now = new Date().toISOString();
    const requestedOwnerUserId = input.ownerUserId === undefined ? currentStep.ownerUserId : input.ownerUserId ?? undefined;
    const assignee = requestedOwnerUserId
      ? findAssigneeByUserId(businessContext.businessId, requestedOwnerUserId)
      : null;

    if (requestedOwnerUserId && !assignee) {
      throw new Error("The selected operator is not available for this business.");
    }

    const nextStatus: InstallWorkflowStepStatus =
      input.completed === undefined ? currentStep.status : input.completed ? "complete" : "open";
    const nextNotes = input.notes === undefined ? currentStep.notes : input.notes.trim() || undefined;
    const nextDueDate =
      input.dueDate === undefined
        ? currentStep.dueDate
        : input.dueDate
          ? normalizeDueDate(input.dueDate)
          : undefined;
    const nextPriority = input.priority ?? currentStep.priority;
    const nextOwnerUserId = assignee?.userId;
    const nextOwnerName = assignee?.name;
    const nextOwnerEmail = assignee?.email;
    const summary =
      input.stepKey === "launch_approved" && nextStatus === "complete"
        ? input.force && !currentWorkflow.canApproveLaunch
          ? "Launch approved with explicit manual override."
          : "Launch approved after required install prerequisites were satisfied."
        : currentStep.summary;

    upsertWorkflowStep({
      businessId: businessContext.businessId,
      key: input.stepKey,
      status: nextStatus,
      notes: nextNotes,
      summary,
      ownerUserId: nextOwnerUserId,
      ownerName: nextOwnerName,
      ownerEmail: nextOwnerEmail,
      dueDate: nextDueDate,
      priority: nextPriority,
      lastCompletedAt: nextStatus === "complete" ? now : undefined,
      completedByUserId: nextStatus === "complete" ? user?.id : undefined,
      completedByEmail: nextStatus === "complete" ? user?.email : undefined
    });

    if (currentStep.ownerUserId !== nextOwnerUserId) {
      appendWorkflowEvent({
        businessId: businessContext.businessId,
        stepKey: input.stepKey,
        eventType: nextOwnerUserId ? "assigned" : "unassigned",
        summary: nextOwnerUserId
          ? `Assigned to ${nextOwnerName ?? nextOwnerEmail ?? nextOwnerUserId}.`
          : "Assignment cleared.",
        ownerUserId: nextOwnerUserId,
        ownerName: nextOwnerName,
        ownerEmail: nextOwnerEmail,
        actorUserId: user?.id,
        actorEmail: user?.email
      });
    }

    if (currentStep.dueDate !== nextDueDate) {
      appendWorkflowEvent({
        businessId: businessContext.businessId,
        stepKey: input.stepKey,
        eventType: "due_date_changed",
        summary: nextDueDate ? `Due date set to ${nextDueDate}.` : "Due date cleared.",
        dueDate: nextDueDate,
        actorUserId: user?.id,
        actorEmail: user?.email
      });
    }

    if (currentStep.priority !== nextPriority) {
      appendWorkflowEvent({
        businessId: businessContext.businessId,
        stepKey: input.stepKey,
        eventType: "priority_changed",
        summary: `Priority changed to ${nextPriority}.`,
        priority: nextPriority,
        actorUserId: user?.id,
        actorEmail: user?.email
      });
    }

    if (nextNotes && nextNotes !== currentStep.notes) {
      appendWorkflowEvent({
        businessId: businessContext.businessId,
        stepKey: input.stepKey,
        eventType: "note_added",
        summary: "Install note updated.",
        notes: nextNotes,
        actorUserId: user?.id,
        actorEmail: user?.email
      });
    }

    if (currentStep.status !== nextStatus) {
      appendWorkflowEvent({
        businessId: businessContext.businessId,
        stepKey: input.stepKey,
        eventType:
          input.stepKey === "launch_approved" && nextStatus === "complete" && input.force
            ? "force_approved"
            : nextStatus === "complete"
              ? "marked_complete"
              : "marked_incomplete",
        summary:
          input.stepKey === "launch_approved" && nextStatus === "complete" && input.force
            ? "Launch approved with force override."
            : nextStatus === "complete"
              ? "Step marked complete."
              : "Step reopened.",
        notes: nextNotes,
        ownerUserId: nextOwnerUserId,
        ownerName: nextOwnerName,
        ownerEmail: nextOwnerEmail,
        dueDate: nextDueDate,
        priority: nextPriority,
        actorUserId: user?.id,
        actorEmail: user?.email
      });
    }

    return this.getWorkflowForBusiness(businessContext.businessId);
  }
};
