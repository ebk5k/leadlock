"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { CalendarSyncBadge } from "@/components/dashboard/calendar-sync-badge";
import { JobStatusBadge } from "@/components/dashboard/job-status-badge";
import { PaymentStatusBadge } from "@/components/dashboard/payment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Appointment, Employee } from "@/types/domain";

const nextStatusMap: Partial<Record<Appointment["status"], Appointment["status"]>> = {
  scheduled: "dispatched",
  dispatched: "en_route",
  en_route: "on_site",
  on_site: "completed"
};

function buildTimeline(appointment: Appointment) {
  return [
    { label: "Assigned", value: appointment.assignedAt },
    { label: "Dispatched", value: appointment.dispatchedAt },
    { label: "En route", value: appointment.enRouteAt },
    { label: "On site", value: appointment.onSiteAt },
    { label: "Completed", value: appointment.completedAt },
    { label: "Canceled", value: appointment.canceledAt }
  ].filter((entry) => entry.value);
}

export function JobOpsList({
  appointments,
  employees,
  title,
  description
}: {
  appointments: Appointment[];
  employees: Employee[];
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const assignableEmployees = employees.filter(
    (employee) => employee.active && employee.role !== "dispatcher"
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      appointments.map((appointment) => [appointment.id, appointment.assignedEmployeeId ?? ""])
    )
  );
  const [completionDrafts, setCompletionDrafts] = useState<
    Record<string, { notes: string; signatureName: string; files: FileList | null }>
  >(
    Object.fromEntries(
      appointments.map((appointment) => [
        appointment.id,
        { notes: appointment.completionNotes ?? "", signatureName: appointment.completionSignatureName ?? "", files: null }
      ])
    )
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setAssignmentDrafts(
      Object.fromEntries(
        appointments.map((appointment) => [appointment.id, appointment.assignedEmployeeId ?? ""])
      )
    );
    setCompletionDrafts(
      Object.fromEntries(
        appointments.map((appointment) => [
          appointment.id,
          {
            notes: appointment.completionNotes ?? "",
            signatureName: appointment.completionSignatureName ?? "",
            files: null
          }
        ])
      )
    );
  }, [appointments]);

  async function patchAppointment(
    appointmentId: string,
    payload: { assignedEmployeeId?: string; assignedTo?: string; status?: Appointment["status"] }
  ) {
    setPendingId(appointmentId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to update appointment.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update appointment.");
    } finally {
      setPendingId(null);
    }
  }

  async function completeAppointment(appointmentId: string) {
    setPendingId(appointmentId);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      const draft = completionDrafts[appointmentId];

      if (draft?.notes?.trim()) {
        formData.append("completionNotes", draft.notes.trim());
      }

      if (draft?.signatureName?.trim()) {
        formData.append("completionSignatureName", draft.signatureName.trim());
      }

      for (const file of Array.from(draft?.files ?? [])) {
        formData.append("proofFiles", file);
      }

      const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to complete appointment.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to complete appointment.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {title || description ? (
        <div className="space-y-1">
          {title ? <h2 className="text-lg font-semibold text-slate-950">{title}</h2> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {appointments.length === 0 ? (
        <Card className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
          No active jobs right now.
        </Card>
      ) : null}
      <div className="grid gap-4">
        {appointments.map((appointment) => {
          const nextStatus = nextStatusMap[appointment.status];
          const timeline = buildTimeline(appointment);
          const isPending = pendingId === appointment.id;

          return (
            <Card className="rounded-3xl p-5" key={appointment.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">{appointment.customerName}</p>
                    <JobStatusBadge status={appointment.status} />
                    <CalendarSyncBadge status={appointment.calendarSyncStatus} />
                    <PaymentStatusBadge status={appointment.paymentStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service} scheduled for {formatDateTime(appointment.scheduledFor)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge>
                      {appointment.assignedEmployee
                        ? `${appointment.assignedEmployee.name} · ${appointment.assignedEmployee.role}`
                        : appointment.assignedTo}
                    </Badge>
                    {appointment.paymentAmountCents ? (
                      <span>{formatCurrency(appointment.paymentAmountCents)} requested</span>
                    ) : null}
                    {appointment.proofAssetCount > 0 ? (
                      <span>{appointment.proofAssetCount} proof asset{appointment.proofAssetCount === 1 ? "" : "s"}</span>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {nextStatus && appointment.status !== "on_site" ? (
                    <Button
                      disabled={isPending}
                      onClick={() => patchAppointment(appointment.id, { status: nextStatus })}
                      size="sm"
                    >
                      Mark {nextStatus.replace("_", " ")}
                    </Button>
                  ) : null}
                  {appointment.status === "on_site" ? (
                    <Button
                      disabled={isPending}
                      onClick={() => completeAppointment(appointment.id)}
                      size="sm"
                    >
                      Complete with proof
                    </Button>
                  ) : null}
                  {appointment.status !== "completed" && appointment.status !== "canceled" ? (
                    <Button
                      disabled={isPending}
                      onClick={() => patchAppointment(appointment.id, { status: "canceled" })}
                      size="sm"
                      variant="outline"
                    >
                      Cancel job
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-900">Field timeline</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {timeline.length > 0 ? (
                      timeline.map((entry) => (
                        <div className="rounded-2xl bg-slate-50 px-3 py-3" key={entry.label}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {entry.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-900">{formatDateTime(String(entry.value))}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-muted-foreground">
                        No field updates yet.
                      </div>
                    )}
                  </div>
                  {appointment.completionNotes ? (
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Completion notes
                      </p>
                      <p className="mt-2 text-sm text-slate-900">{appointment.completionNotes}</p>
                      {appointment.completionSignatureName ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Approved by {appointment.completionSignatureName}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {appointment.proofAssets.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-900">Proof of work</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {appointment.proofAssets.map((asset) => (
                          <a
                            className="overflow-hidden rounded-2xl border border-border bg-white"
                            href={asset.url}
                            key={asset.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Image
                              alt={asset.fileName}
                              className="h-36 w-full object-cover"
                              height={144}
                              src={asset.url}
                              unoptimized
                              width={320}
                            />
                            <div className="px-3 py-2 text-xs text-muted-foreground">{asset.fileName}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3 rounded-2xl border border-border bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Assignment</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pick from the live employee roster. Legacy text assignments still display safely.
                    </p>
                  </div>
                  <Select
                    disabled={isPending}
                    onChange={(event) =>
                      setAssignmentDrafts((current) => ({
                        ...current,
                        [appointment.id]: event.target.value
                      }))
                    }
                    value={assignmentDrafts[appointment.id] ?? ""}
                  >
                    <option value="">Select employee</option>
                    {assignableEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} · {employee.role}
                        </option>
                      ))}
                  </Select>
                  {!appointment.assignedEmployee && appointment.assignedTo ? (
                    <p className="text-xs text-muted-foreground">
                      Legacy assignment: {appointment.assignedTo}
                    </p>
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={
                      isPending ||
                      !assignmentDrafts[appointment.id]?.trim() ||
                      assignmentDrafts[appointment.id]?.trim() === appointment.assignedEmployeeId
                    }
                    onClick={() =>
                      patchAppointment(appointment.id, {
                        assignedEmployeeId: assignmentDrafts[appointment.id]?.trim()
                      })
                    }
                    size="sm"
                    variant="outline"
                  >
                    Save assignment
                  </Button>
                  {assignableEmployees.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Add employees first to enable structured assignment.
                    </p>
                  ) : null}
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-medium text-slate-900">Completion proof</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Notes and photos are only required when closing the job.
                    </p>
                  </div>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setCompletionDrafts((current) => ({
                        ...current,
                        [appointment.id]: {
                          ...(current[appointment.id] ?? { notes: "", signatureName: "", files: null }),
                          notes: event.target.value
                        }
                      }))
                    }
                    placeholder="Completion notes"
                    value={completionDrafts[appointment.id]?.notes ?? ""}
                  />
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setCompletionDrafts((current) => ({
                        ...current,
                        [appointment.id]: {
                          ...(current[appointment.id] ?? { notes: "", signatureName: "", files: null }),
                          signatureName: event.target.value
                        }
                      }))
                    }
                    placeholder="Customer name or approval (optional)"
                    value={completionDrafts[appointment.id]?.signatureName ?? ""}
                  />
                  <Input
                    accept="image/*"
                    disabled={isPending}
                    multiple
                    onChange={(event) =>
                      setCompletionDrafts((current) => ({
                        ...current,
                        [appointment.id]: {
                          ...(current[appointment.id] ?? { notes: "", signatureName: "", files: null }),
                          files: event.target.files
                        }
                      }))
                    }
                    type="file"
                  />
                  {completionDrafts[appointment.id]?.files?.length ? (
                    <p className="text-xs text-muted-foreground">
                      {completionDrafts[appointment.id]?.files?.length} photo
                      {completionDrafts[appointment.id]?.files?.length === 1 ? "" : "s"} ready to upload
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
