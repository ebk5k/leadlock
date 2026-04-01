"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { BusinessOpsSummary, ClientOpsDashboardSnapshot } from "@/types/domain";

type FilterValue = "all" | "blocked" | "ready" | "approved" | "inactive";
type SortValue = "name" | "readiness" | "activity";

function formatTimestamp(value?: string) {
  if (!value) {
    return "No recent activity";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getBusinessStateLabel(business: BusinessOpsSummary) {
  if (business.installWorkflow.launchApproved) {
    return "Launch approved";
  }

  if (business.installWorkflow.canApproveLaunch) {
    return "Ready for approval";
  }

  return "Blocked";
}

function getBusinessStateStyles(business: BusinessOpsSummary) {
  if (business.installWorkflow.launchApproved) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (business.installWorkflow.canApproveLaunch) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-amber-100 text-amber-800";
}

export function ClientOpsDashboard({
  snapshot
}: {
  snapshot: ClientOpsDashboardSnapshot;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("activity");
  const [isPending, startTransition] = useTransition();
  const [switchingBusinessId, setSwitchingBusinessId] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [reminderBusyKey, setReminderBusyKey] = useState<string | null>(null);

  const filteredBusinesses = snapshot.businesses
    .filter((business) => {
      switch (filter) {
        case "blocked":
          return !business.installWorkflow.launchApproved && !business.installWorkflow.canApproveLaunch;
        case "ready":
          return !business.installWorkflow.launchApproved && business.installWorkflow.canApproveLaunch;
        case "approved":
          return business.installWorkflow.launchApproved;
        case "inactive":
          return business.businessClient.status === "inactive";
        case "all":
        default:
          return true;
      }
    })
    .sort((left, right) => {
      if (sort === "name") {
        return left.businessClient.name.localeCompare(right.businessClient.name);
      }

      if (sort === "readiness") {
        const leftScore = left.launchReadiness.readyItems / Math.max(left.launchReadiness.totalItems, 1);
        const rightScore = right.launchReadiness.readyItems / Math.max(right.launchReadiness.totalItems, 1);
        return rightScore - leftScore;
      }

      const leftTimestamp = left.recentActivity.timestamp ?? "";
      const rightTimestamp = right.recentActivity.timestamp ?? "";
      return rightTimestamp.localeCompare(leftTimestamp);
    });

  async function handleOpenBusiness(business: BusinessOpsSummary) {
    if (business.isActiveBusiness) {
      router.push("/app/settings");
      return;
    }

    setSwitchingBusinessId(business.businessClient.id);

    try {
      const response = await fetch("/api/auth/switch-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId: business.businessClient.id })
      });

      if (!response.ok) {
        return;
      }

      startTransition(() => {
        router.push("/app/settings");
        router.refresh();
      });
    } finally {
      setSwitchingBusinessId(null);
    }
  }

  async function handleGenerateReminders() {
    setReminderMessage(null);
    setReminderBusyKey("generate");

    try {
      const response = await fetch("/api/install-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ includeUpcoming: true })
      });

      if (!response.ok) {
        throw new Error("Unable to run reminder sweep.");
      }

      const payload = (await response.json()) as {
        generatedCount?: number;
        overdueGeneratedCount?: number;
        upcomingGeneratedCount?: number;
      };
      setReminderMessage(
        payload.generatedCount && payload.generatedCount > 0
          ? `Generated ${payload.generatedCount} reminder${payload.generatedCount === 1 ? "" : "s"}: ${payload.overdueGeneratedCount ?? 0} overdue and ${payload.upcomingGeneratedCount ?? 0} upcoming.`
          : "No new overdue or upcoming reminders were needed."
      );
      startTransition(() => router.refresh());
    } catch (error) {
      setReminderMessage(error instanceof Error ? error.message : "Unable to run reminder sweep.");
    } finally {
      setReminderBusyKey(null);
    }
  }

  async function handleAcknowledgeReminder(businessId: string, stepKey: string) {
    setReminderMessage(null);
    const busyKey = `${businessId}:${stepKey}`;
    setReminderBusyKey(busyKey);

    try {
      const response = await fetch("/api/install-reminders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId, stepKey })
      });

      if (!response.ok) {
        throw new Error("Unable to acknowledge reminder.");
      }

      setReminderMessage("Reminder acknowledged.");
      startTransition(() => router.refresh());
    } catch (error) {
      setReminderMessage(error instanceof Error ? error.message : "Unable to acknowledge reminder.");
    } finally {
      setReminderBusyKey(null);
    }
  }

  async function handleMarkNotificationRead(notificationId: string) {
    setReminderMessage(null);
    const busyKey = `notification:${notificationId}`;
    setReminderBusyKey(busyKey);

    try {
      const response = await fetch("/api/operator-notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setReminderMessage(error instanceof Error ? error.message : "Unable to mark notification as read.");
    } finally {
      setReminderBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Allowed businesses</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.totalBusinesses}</p>
          <p className="mt-2 text-sm text-slate-300">All client workspaces available to this operator session.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Blocked installs</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.blockedCount}</p>
          <p className="mt-2 text-sm text-slate-300">Businesses that still have launch blockers in the install loop.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ready for signoff</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.readyForApprovalCount}</p>
          <p className="mt-2 text-sm text-slate-300">Businesses that have completed prerequisites and can be approved.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Launch approved</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.launchApprovedCount}</p>
          <p className="mt-2 text-sm text-slate-300">Businesses with structured launch signoff already recorded.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Overdue installs</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.overdueBusinessesCount}</p>
          <p className="mt-2 text-sm text-slate-300">Businesses with at least one overdue install step needing action.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Unassigned work</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.unassignedBusinessesCount}</p>
          <p className="mt-2 text-sm text-slate-300">Businesses with open install steps that do not yet have an owner.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verification attention</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.verificationAttentionCount}</p>
          <p className="mt-2 text-sm text-slate-300">Businesses with failed provider verification checks to resolve.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reminder pressure</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {snapshot.totals.businessesWithOutstandingRemindersCount}
          </p>
          <p className="mt-2 text-sm text-slate-300">Businesses with outstanding overdue install reminders still open.</p>
        </Card>
        <Card className="rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Unread notifications</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.totals.unreadNotificationCount}</p>
          <p className="mt-2 text-sm text-slate-300">Operator inbox items generated by install reminder sweeps.</p>
        </Card>
      </div>

      <Card className="rounded-3xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Client ops queue</p>
            <p className="mt-1 text-sm text-slate-300">
              Filter install blockers, verification gaps, and launch-ready businesses across every allowed client.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select onChange={(event) => setFilter(event.target.value as FilterValue)} value={filter}>
              <option value="all">All businesses</option>
              <option value="blocked">Blocked installs</option>
              <option value="ready">Ready for approval</option>
              <option value="approved">Launch approved</option>
              <option value="inactive">Inactive businesses</option>
            </Select>
            <Select onChange={(event) => setSort(event.target.value as SortValue)} value={sort}>
              <option value="activity">Sort by recent activity</option>
              <option value="readiness">Sort by readiness</option>
              <option value="name">Sort by name</option>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredBusinesses.map((business) => (
          <Card className="rounded-3xl p-5" key={business.businessClient.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-white">{business.businessClient.name}</p>
                  {business.isActiveBusiness ? <Badge className="bg-slate-950 text-white">Active workspace</Badge> : null}
                  <Badge className={getBusinessStateStyles(business)}>{getBusinessStateLabel(business)}</Badge>
                  <Badge>{business.businessClient.status}</Badge>
                  {business.membershipRole ? <Badge>{business.membershipRole}</Badge> : null}
                  {business.coordination.overdueStepCount > 0 ? (
                    <Badge className="bg-red-100 text-red-700">{business.coordination.overdueStepCount} overdue</Badge>
                  ) : null}
                  {business.coordination.unassignedOpenStepCount > 0 ? (
                    <Badge className="bg-amber-100 text-amber-800">
                      {business.coordination.unassignedOpenStepCount} unassigned
                    </Badge>
                  ) : null}
                  {business.coordination.outstandingReminderCount > 0 ? (
                    <Badge className="bg-amber-100 text-amber-800">
                      {business.coordination.outstandingReminderCount} reminders
                    </Badge>
                  ) : null}
                  {business.coordination.notificationCount > 0 ? (
                    <Badge className="bg-blue-100 text-blue-700">
                      {business.coordination.notificationCount} unread notifications
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-slate-300">
                  {business.recentActivity.label}: {formatTimestamp(business.recentActivity.timestamp)}
                </p>
                {business.coordination.nextBlockingStepLabel ? (
                  <p className="text-sm text-slate-200">
                    Next blocking step: {business.coordination.nextBlockingStepLabel}
                    {business.coordination.nextBlockingStepOwner
                      ? ` · owner ${business.coordination.nextBlockingStepOwner}`
                      : " · owner not assigned"}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={isPending || switchingBusinessId === business.businessClient.id}
                  onClick={() => handleOpenBusiness(business)}
                  size="sm"
                  variant={business.isActiveBusiness ? "outline" : "primary"}
                >
                  {business.isActiveBusiness ? "Open settings" : "Switch + open setup"}
                </Button>
                {business.isActiveBusiness ? (
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                    href="/app/onboarding"
                  >
                    Open onboarding
                  </Link>
                ) : null}
              </div>
            </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Provider config</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {business.providerConfigSummary.configuredCount}/{business.providerConfigSummary.totalCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {business.providerConfigSummary.usingFallbackCount} using fallback config
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verification</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {business.providerVerificationSummary.passedCount}/{business.providerVerificationSummary.totalCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {business.providerVerificationSummary.failedCount} failed, {business.providerVerificationSummary.pendingCount} pending
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Install workflow</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {business.installWorkflow.completedSteps}/{business.installWorkflow.totalSteps}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {business.installWorkflow.canApproveLaunch ? "Ready to approve" : `${business.installWorkflow.blockedApprovalReasons.length} blockers`}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Launch readiness</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {business.launchReadiness.readyItems}/{business.launchReadiness.totalItems}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {business.installWorkflow.launchApproved ? "Signoff complete" : "Still in install flow"}
                </p>
              </div>
            </div>

            {!business.installWorkflow.canApproveLaunch && !business.installWorkflow.launchApproved ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                <p className="text-sm font-semibold text-amber-100">Current blockers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {business.installWorkflow.blockedApprovalReasons.slice(0, 3).map((reason) => (
                    <Badge className="border-amber-300/20 bg-white/10 text-amber-50" key={reason}>
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Operator workload</p>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">
              Grouped install work by owner so operators can see overdue steps, blocking work, and reminder follow-through in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{snapshot.workload.totals.totalAssignedSteps} open steps</Badge>
            <Badge className={snapshot.workload.totals.overdueStepsCount > 0 ? "bg-red-100 text-red-700" : ""}>
              {snapshot.workload.totals.overdueStepsCount} overdue
            </Badge>
            <Badge
              className={
                snapshot.workload.totals.outstandingReminderCount > 0
                  ? "bg-amber-100 text-amber-800"
                  : ""
              }
            >
              {snapshot.workload.totals.outstandingReminderCount} outstanding reminders
            </Badge>
            <Button
              disabled={isPending || reminderBusyKey === "generate"}
              onClick={handleGenerateReminders}
              size="sm"
              variant="outline"
            >
              {reminderBusyKey === "generate" ? "Running..." : "Run reminder sweep"}
            </Button>
          </div>
        </div>

        {reminderMessage ? <p className="mt-4 text-sm text-slate-300">{reminderMessage}</p> : null}

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Operator inbox</p>
              <p className="mt-1 text-sm text-slate-300">
                Reminder deliveries created for the current operator from overdue and upcoming install sweeps.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{snapshot.workload.inbox.notifications.length} recent</Badge>
              <Badge className={snapshot.workload.inbox.unreadCount > 0 ? "bg-blue-100 text-blue-700" : ""}>
                {snapshot.workload.inbox.unreadCount} unread
              </Badge>
            </div>
          </div>

          {snapshot.workload.inbox.notifications.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {snapshot.workload.inbox.notifications.slice(0, 6).map((notification) => (
                <div className="rounded-2xl border border-white/10 bg-white/4 p-4" key={notification.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{notification.summary}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {notification.businessName} · {notification.stepLabel}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatTimestamp(notification.createdAt)}
                        {notification.readAt ? ` · read ${formatTimestamp(notification.readAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={notification.reminderType === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>
                        {notification.reminderType}
                      </Badge>
                      <Badge>{notification.status}</Badge>
                      {notification.status === "unread" ? (
                        <Button
                          disabled={isPending || reminderBusyKey === `notification:${notification.id}`}
                          onClick={() => handleMarkNotificationRead(notification.id)}
                          size="sm"
                          variant="outline"
                        >
                          {reminderBusyKey === `notification:${notification.id}` ? "Saving..." : "Mark read"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              No reminder deliveries have been created for this operator yet.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">My tasks</p>
              <p className="mt-1 text-sm text-slate-300">
                The current operator’s assigned install work, sorted with overdue and high-priority steps first.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{snapshot.workload.myTasks.length} assigned</Badge>
              <Badge
                className={
                  snapshot.workload.myTasks.some((step) => step.isOverdue)
                    ? "bg-red-100 text-red-700"
                    : ""
                }
              >
                {snapshot.workload.myTasks.filter((step) => step.isOverdue).length} overdue
              </Badge>
            </div>
          </div>

          {snapshot.workload.myTasks.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {snapshot.workload.myTasks.slice(0, 4).map((step) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/4 p-4"
                  key={`my-task:${step.businessId}:${step.stepKey}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {step.businessName} · {step.stepLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Due {step.dueDate ?? "not set"} · {step.priority} priority
                        {step.blockingContext ? ` · ${step.blockingContext}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {step.isOverdue ? (
                        <Badge className="bg-red-100 text-red-700">overdue</Badge>
                      ) : (
                        <Badge>open</Badge>
                      )}
                      {step.reminder.hasOutstandingReminder ? (
                        <Badge className="bg-amber-100 text-amber-800">reminder open</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              No install steps are currently assigned to this operator.
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {snapshot.workload.groups.map((group) => (
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4" key={group.operatorUserId ?? group.operatorName}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{group.operatorName}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {group.operatorEmail ?? "Unassigned install work queue"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{group.assignedBusinessesCount} businesses</Badge>
                  <Badge className={group.overdueStepsCount > 0 ? "bg-red-100 text-red-700" : ""}>
                    {group.overdueStepsCount} overdue
                  </Badge>
                  <Badge
                    className={
                      group.outstandingReminderCount > 0 ? "bg-amber-100 text-amber-800" : ""
                    }
                  >
                    {group.outstandingReminderCount} reminders
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {group.steps.map((step) => (
                  <div className="rounded-2xl border border-white/10 bg-white/4 p-4" key={`${step.businessId}:${step.stepKey}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {step.businessName} · {step.stepLabel}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          Due {step.dueDate ?? "not set"} · {step.priority} priority
                          {step.blockingContext ? ` · ${step.blockingContext}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {step.isOverdue ? <Badge className="bg-red-100 text-red-700">overdue</Badge> : <Badge>open</Badge>}
                        {step.reminder.hasOutstandingReminder ? (
                          <Badge className="bg-amber-100 text-amber-800">reminder open</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Last reminder: {formatTimestamp(step.reminder.lastReminderAt)}</span>
                      <span>Last acknowledged: {formatTimestamp(step.reminder.lastAcknowledgedAt)}</span>
                    </div>

                    {step.reminder.hasOutstandingReminder ? (
                      <div className="mt-3">
                        <Button
                          disabled={isPending || reminderBusyKey === `${step.businessId}:${step.stepKey}`}
                          onClick={() => handleAcknowledgeReminder(step.businessId, step.stepKey)}
                          size="sm"
                          variant="outline"
                        >
                          {reminderBusyKey === `${step.businessId}:${step.stepKey}`
                            ? "Saving..."
                            : "Acknowledge reminder"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
