"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  InstallWorkflowSnapshot,
  InstallWorkflowStep,
  InstallWorkflowStepKey,
  InstallWorkflowStepPriority
} from "@/types/domain";

type StepDraftState = Record<
  InstallWorkflowStepKey,
  {
    notes: string;
    ownerUserId: string;
    dueDate: string;
    priority: InstallWorkflowStepPriority;
  }
>;

function statusBadgeClass(step: InstallWorkflowStep) {
  if (step.status === "complete") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-200";
  }

  if (step.isOverdue) {
    return "border-red-400/20 bg-red-500/15 text-red-200";
  }

  return "border-amber-400/20 bg-amber-500/15 text-amber-200";
}

function buildInitialDraft(workflow: InstallWorkflowSnapshot): StepDraftState {
  return Object.fromEntries(
    workflow.steps.map((step) => [
      step.key,
      {
        notes: step.notes ?? "",
        ownerUserId: step.ownerUserId ?? "",
        dueDate: step.dueDate ?? "",
        priority: step.priority
      }
    ])
  ) as StepDraftState;
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function InstallWorkflowPanel({ workflow }: { workflow: InstallWorkflowSnapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<StepDraftState>(() => buildInitialDraft(workflow));
  const [savingStep, setSavingStep] = useState<InstallWorkflowStepKey | null>(null);

  const completionPercent = useMemo(
    () => Math.round((workflow.completedSteps / workflow.totalSteps) * 100),
    [workflow.completedSteps, workflow.totalSteps]
  );

  function updateDraft(
    stepKey: InstallWorkflowStepKey,
    updater: (current: StepDraftState[InstallWorkflowStepKey]) => StepDraftState[InstallWorkflowStepKey]
  ) {
    setDraft((current) => ({
      ...current,
      [stepKey]: updater(current[stepKey])
    }));
  }

  async function persistStep(
    step: InstallWorkflowStep,
    options?: {
      completed?: boolean;
      force?: boolean;
    }
  ) {
    setErrorMessage(null);
    setSavingStep(step.key);

    try {
      const stepDraft = draft[step.key];
      const response = await fetch("/api/install-workflow", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stepKey: step.key,
          completed: options?.completed,
          notes: stepDraft.notes,
          ownerUserId: stepDraft.ownerUserId,
          dueDate: stepDraft.dueDate,
          priority: stepDraft.priority,
          force: options?.force ?? false
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to update install workflow.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update install workflow.");
    } finally {
      setSavingStep(null);
    }
  }

  return (
    <Card className="rounded-3xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Install workflow</p>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            A business-by-business delivery SOP with ownership, due dates, and auditable operator history for launch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={workflow.launchApproved ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200" : ""}>
            {workflow.completedSteps}/{workflow.totalSteps} complete
          </Badge>
          <Badge className={workflow.overdueStepCount > 0 ? "border-red-400/20 bg-red-500/15 text-red-200" : ""}>
            {workflow.overdueStepCount} overdue
          </Badge>
          <Badge className={workflow.unassignedOpenStepCount > 0 ? "border-amber-400/20 bg-amber-500/15 text-amber-200" : ""}>
            {workflow.unassignedOpenStepCount} unassigned
          </Badge>
          <Badge className={workflow.launchApproved ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200" : "border-amber-400/20 bg-amber-500/15 text-amber-200"}>
            {workflow.launchApproved ? "Launch approved" : "Launch not approved"}
          </Badge>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 transition-all" style={{ width: `${completionPercent}%` }} />
      </div>

      {workflow.blockedApprovalReasons.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">Launch signoff is currently blocked</p>
          <p className="mt-1 text-amber-200/85">{workflow.blockedApprovalReasons.join(" ")}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {workflow.steps.map((step) => {
          const stepDraft = draft[step.key];

          return (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4" key={step.key}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 lg:max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{step.label}</p>
                    <Badge>{step.source}</Badge>
                    <Badge className={statusBadgeClass(step)}>
                      {step.status === "complete" ? "complete" : step.isOverdue ? "overdue" : "open"}
                    </Badge>
                    {step.autoManaged ? <Badge>verification-driven</Badge> : null}
                    {step.priority === "high" ? <Badge className="border-red-400/20 bg-red-500/15 text-red-200">high priority</Badge> : null}
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{step.description}</p>
                  {step.summary ? <p className="text-sm text-slate-200">{step.summary}</p> : null}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Owner: {step.ownerName ?? step.ownerEmail ?? "Unassigned"}</span>
                    <span>Due: {step.dueDate ?? "Not set"}</span>
                    <span>Last completed: {formatTimestamp(step.lastCompletedAt)}</span>
                    {step.completedByEmail ? <span>Completed by: {step.completedByEmail}</span> : null}
                  </div>
                  {step.history.length > 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Recent history
                      </p>
                      <div className="mt-3 space-y-2">
                        {step.history.slice(0, 3).map((event) => (
                          <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm" key={event.id}>
                            <p className="font-medium text-slate-100">{event.summary}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatTimestamp(event.createdAt)}
                              {event.actorEmail ? ` by ${event.actorEmail}` : ""}
                            </p>
                            {event.notes ? <p className="mt-1 text-xs text-slate-300">{event.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="w-full max-w-md space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      onChange={(event) =>
                        updateDraft(step.key, (current) => ({
                          ...current,
                          ownerUserId: event.target.value
                        }))
                      }
                      value={stepDraft.ownerUserId}
                    >
                      <option value="">Unassigned</option>
                      {workflow.availableAssignees.map((assignee) => (
                        <option key={assignee.userId} value={assignee.userId}>
                          {assignee.name} ({assignee.email})
                        </option>
                      ))}
                    </Select>
                    <Input
                      onChange={(event) =>
                        updateDraft(step.key, (current) => ({
                          ...current,
                          dueDate: event.target.value
                        }))
                      }
                      type="date"
                      value={stepDraft.dueDate}
                    />
                  </div>

                  <Select
                    onChange={(event) =>
                      updateDraft(step.key, (current) => ({
                        ...current,
                        priority: event.target.value as InstallWorkflowStepPriority
                      }))
                    }
                    value={stepDraft.priority}
                  >
                    <option value="normal">Normal priority</option>
                    <option value="high">High priority</option>
                  </Select>

                  <Textarea
                    onChange={(event) =>
                      updateDraft(step.key, (current) => ({
                        ...current,
                        notes: event.target.value
                      }))
                    }
                    placeholder="Internal notes for this install step"
                    value={stepDraft.notes}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isPending || savingStep === step.key}
                      onClick={() => persistStep(step)}
                      type="button"
                      variant="outline"
                    >
                      {savingStep === step.key ? "Saving..." : "Save ownership"}
                    </Button>
                    {!step.autoManaged ? (
                      <Button
                        disabled={isPending || savingStep === step.key}
                        onClick={() => persistStep(step, { completed: step.status !== "complete" })}
                        type="button"
                        variant={step.status === "complete" ? "outline" : "primary"}
                      >
                        {savingStep === step.key
                          ? "Saving..."
                          : step.status === "complete"
                            ? "Mark incomplete"
                            : step.key === "launch_approved"
                              ? "Approve launch"
                              : "Mark complete"}
                      </Button>
                    ) : null}
                    {step.key === "launch_approved" && !workflow.canApproveLaunch && step.status !== "complete" ? (
                      <Button
                        disabled={isPending || savingStep === step.key}
                        onClick={() => persistStep(step, { completed: true, force: true })}
                        type="button"
                        variant="outline"
                      >
                        Force approve
                      </Button>
                    ) : null}
                  </div>

                  {step.autoManaged ? (
                    <div className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-400">
                      Status is verification-driven, but ownership, due date, priority, and notes can still be managed here.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
    </Card>
  );
}
