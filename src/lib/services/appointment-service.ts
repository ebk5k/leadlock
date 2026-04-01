import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { getCurrentBusinessId } from "@/lib/settings/store";
import { calendarService } from "@/lib/services/calendar-service";
import { messagingService } from "@/lib/services/messaging-service";
import { paymentService } from "@/lib/services/payment-service";
import { proofWorkService } from "@/lib/services/proof-work-service";
import type { Appointment, AppointmentStatus, EmployeeRole } from "@/types/domain";

const nextStatusMap: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  scheduled: "dispatched",
  dispatched: "en_route",
  en_route: "on_site",
  on_site: "completed"
};

function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : undefined,
    customerName: String(row.customer_name),
    service: String(row.service),
    scheduledFor: String(row.scheduled_for),
    status: row.status as Appointment["status"],
    assignedTo: String(row.assigned_to),
    assignedEmployeeId: row.assigned_employee_id ? String(row.assigned_employee_id) : undefined,
    assignedEmployee: row.employee_id
      ? {
          id: String(row.employee_id),
          name: String(row.employee_name),
          role: row.employee_role as EmployeeRole,
          phone: String(row.employee_phone),
          email: row.employee_email ? String(row.employee_email) : undefined,
          active: Boolean(row.employee_active)
        }
      : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    completionNotes: row.completion_notes ? String(row.completion_notes) : undefined,
    completionSignatureName: row.completion_signature_name
      ? String(row.completion_signature_name)
      : undefined,
    proofAssets: [],
    proofAssetCount:
      row.proof_asset_count === null || row.proof_asset_count === undefined
        ? 0
        : Number(row.proof_asset_count),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    assignedAt: row.assigned_at ? String(row.assigned_at) : undefined,
    dispatchedAt: row.dispatched_at ? String(row.dispatched_at) : undefined,
    enRouteAt: row.en_route_at ? String(row.en_route_at) : undefined,
    onSiteAt: row.on_site_at ? String(row.on_site_at) : undefined,
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    canceledAt: row.canceled_at ? String(row.canceled_at) : undefined,
    externalCalendarEventId: row.external_calendar_event_id
      ? String(row.external_calendar_event_id)
      : undefined,
    calendarProvider: row.calendar_provider ? String(row.calendar_provider) : undefined,
    calendarSyncError: row.calendar_sync_error ? String(row.calendar_sync_error) : undefined,
    calendarSyncStatus: (row.calendar_sync_status as Appointment["calendarSyncStatus"]) ?? "pending",
    paymentStatus: (row.payment_status as Appointment["paymentStatus"]) ?? "pending",
    paymentId: row.payment_id ? String(row.payment_id) : undefined,
    paymentProvider: row.payment_provider ? String(row.payment_provider) : undefined,
    paymentAmountCents:
      row.payment_amount_cents === null || row.payment_amount_cents === undefined
        ? undefined
        : Number(row.payment_amount_cents),
    paymentCheckoutUrl: row.payment_checkout_url ? String(row.payment_checkout_url) : undefined
  };
}

function buildAppointmentQuery() {
  return `
    SELECT
      a.id,
      a.business_id,
      a.customer_name,
      a.service,
      a.scheduled_for,
      a.status,
      a.assigned_to,
      a.assigned_employee_id,
      a.notes,
      a.completion_notes,
      a.completion_signature_name,
      a.created_at,
      a.updated_at,
      a.assigned_at,
      a.dispatched_at,
      a.en_route_at,
      a.on_site_at,
      a.completed_at,
      a.canceled_at,
      a.external_calendar_event_id,
      a.calendar_sync_status,
      a.calendar_provider,
      a.calendar_sync_error,
      e.id AS employee_id,
      e.name AS employee_name,
      e.role AS employee_role,
      e.phone AS employee_phone,
      e.email AS employee_email,
      e.active AS employee_active,
      (
        SELECT COUNT(*)
        FROM proof_assets pa
        WHERE pa.appointment_id = a.id
      ) AS proof_asset_count,
      p.status AS payment_status,
      p.id AS payment_id,
      p.provider AS payment_provider,
      p.amount_cents AS payment_amount_cents,
      p.checkout_url AS payment_checkout_url
    FROM appointments a
    LEFT JOIN employees e ON e.id = a.assigned_employee_id AND e.business_id = a.business_id
    LEFT JOIN payments p
      ON p.id = (
        SELECT p2.id
        FROM payments p2
        WHERE p2.business_id = a.business_id AND p2.appointment_id = a.id
        ORDER BY datetime(p2.updated_at) DESC, datetime(p2.created_at) DESC
        LIMIT 1
      )
  `;
}

async function attachProofAssets(appointments: Appointment[]) {
  const assetsByAppointment = await proofWorkService.getProofAssetsForAppointments(
    appointments.map((appointment) => appointment.id)
  );

  return appointments.map((appointment) => ({
    ...appointment,
    proofAssets: assetsByAppointment.get(appointment.id) ?? [],
    proofAssetCount: assetsByAppointment.get(appointment.id)?.length ?? appointment.proofAssetCount
  }));
}

async function getAppointmentById(appointmentId: string) {
  const businessId = getCurrentBusinessId();
  const row = getDatabase()
    .prepare(
      `
        ${buildAppointmentQuery()}
        WHERE a.business_id = ? AND a.id = ?
        LIMIT 1
      `
    )
    .get(businessId, appointmentId) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  const [appointment] = await attachProofAssets([mapAppointmentRow(row)]);

  return appointment;
}

function isValidStatusTransition(currentStatus: AppointmentStatus, nextStatus: AppointmentStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "completed" || currentStatus === "canceled") {
    return false;
  }

  if (nextStatus === "canceled") {
    return true;
  }

  return nextStatusMap[currentStatus] === nextStatus;
}

export interface AppointmentService {
  getAppointments(): Promise<Appointment[]>;
  getAppointmentById(appointmentId: string): Promise<Appointment | null>;
  createAppointment(input: {
    customerName: string;
    service: string;
    scheduledFor: string;
    notes?: string;
    baseUrl: string;
  }): Promise<Appointment>;
  updateAppointmentOps(input: {
    appointmentId: string;
    assignedEmployeeId?: string;
    assignedTo?: string;
    status?: AppointmentStatus;
  }): Promise<Appointment | null>;
  completeAppointmentWithProof(input: {
    appointmentId: string;
    completionNotes?: string;
    completionSignatureName?: string;
    files: Array<{
      fileName: string;
      mimeType: string;
      bytes: Uint8Array;
      sizeBytes: number;
    }>;
  }): Promise<Appointment | null>;
}

export const appointmentService: AppointmentService = {
  async getAppointments() {
    noStore();
    const businessId = getCurrentBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          ${buildAppointmentQuery()}
          WHERE a.business_id = ?
          ORDER BY datetime(a.scheduled_for) ASC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    return attachProofAssets(rows.map(mapAppointmentRow));
  },
  async getAppointmentById(appointmentId) {
    noStore();

    return getAppointmentById(appointmentId);
  },
  async createAppointment(input) {
    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: `appt-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
      customerName: input.customerName,
      service: input.service,
      scheduledFor: input.scheduledFor,
      status: "scheduled",
      assignedTo: "Dispatch Review",
      assignedEmployeeId: undefined,
      notes: input.notes,
      completionNotes: undefined,
      completionSignatureName: undefined,
      proofAssets: [],
      proofAssetCount: 0,
      createdAt: now,
      updatedAt: now,
      calendarSyncStatus: "pending",
      paymentStatus: "pending"
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO appointments (
            id, business_id, customer_name, service, scheduled_for, status, assigned_to, notes, created_at, updated_at,
            assigned_at, dispatched_at, en_route_at, on_site_at, completed_at, canceled_at,
            assigned_employee_id, completion_notes, completion_signature_name, external_calendar_event_id,
            calendar_sync_status, calendar_provider, calendar_sync_error
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        appointment.id,
        appointment.businessId ?? getCurrentBusinessId(),
        appointment.customerName,
        appointment.service,
        appointment.scheduledFor,
        appointment.status,
        appointment.assignedTo,
        appointment.notes ?? null,
        appointment.createdAt ?? now,
        appointment.updatedAt ?? now,
        appointment.assignedAt ?? null,
        appointment.dispatchedAt ?? null,
        appointment.enRouteAt ?? null,
        appointment.onSiteAt ?? null,
        appointment.completedAt ?? null,
        appointment.canceledAt ?? null,
        appointment.assignedEmployeeId ?? null,
        appointment.completionNotes ?? null,
        appointment.completionSignatureName ?? null,
        appointment.externalCalendarEventId ?? null,
        appointment.calendarSyncStatus,
        appointment.calendarProvider ?? null,
        appointment.calendarSyncError ?? null
      );

    const syncedAppointment = await calendarService.syncAppointmentCreated(appointment);
    const payment = await paymentService.createAppointmentPaymentRequest({
      appointment: syncedAppointment,
      baseUrl: input.baseUrl
    });
    const appointmentWithPayment: Appointment = {
      ...syncedAppointment,
      paymentStatus: payment.status,
      paymentProvider: payment.provider,
      paymentAmountCents: payment.amountCents,
      paymentCheckoutUrl: payment.checkoutUrl
    };
    await messagingService.triggerBookingConfirmation({ appointment: appointmentWithPayment });

    return appointmentWithPayment;
  },
  async updateAppointmentOps(input) {
    const appointment = await getAppointmentById(input.appointmentId);
    const businessId = getCurrentBusinessId();

    if (!appointment) {
      return null;
    }

    if (!input.assignedTo && !input.assignedEmployeeId && !input.status) {
      return appointment;
    }

    const nextStatus = input.status ?? appointment.status;

    if (!isValidStatusTransition(appointment.status, nextStatus)) {
      throw new Error(`Invalid status transition from ${appointment.status} to ${nextStatus}.`);
    }

    const now = new Date().toISOString();
    let assignedTo = appointment.assignedTo;
    let assignedEmployeeId = appointment.assignedEmployeeId ?? null;

    if (input.assignedEmployeeId) {
      const employeeRow = getDatabase()
        .prepare(
          `
            SELECT id, name
            FROM employees
            WHERE business_id = ? AND id = ? AND active = 1
            LIMIT 1
          `
        )
        .get(businessId, input.assignedEmployeeId) as { id?: string; name?: string } | undefined;

      if (!employeeRow?.id || !employeeRow.name) {
        throw new Error("Selected employee is unavailable.");
      }

      assignedEmployeeId = employeeRow.id;
      assignedTo = employeeRow.name;
    } else if (input.assignedTo?.trim()) {
      assignedTo = input.assignedTo.trim();
      assignedEmployeeId = null;
    }

    const assignedAt =
      (input.assignedTo && input.assignedTo.trim() !== appointment.assignedTo) ||
      (input.assignedEmployeeId && input.assignedEmployeeId !== appointment.assignedEmployeeId)
        ? now
        : appointment.assignedAt ?? null;
    const dispatchedAt =
      nextStatus === "dispatched" && !appointment.dispatchedAt ? now : appointment.dispatchedAt ?? null;
    const enRouteAt =
      nextStatus === "en_route" && !appointment.enRouteAt ? now : appointment.enRouteAt ?? null;
    const onSiteAt =
      nextStatus === "on_site" && !appointment.onSiteAt ? now : appointment.onSiteAt ?? null;
    const completedAt =
      nextStatus === "completed" && !appointment.completedAt ? now : appointment.completedAt ?? null;
    const canceledAt =
      nextStatus === "canceled" && !appointment.canceledAt ? now : appointment.canceledAt ?? null;

    getDatabase()
      .prepare(
        `
          UPDATE appointments
          SET assigned_to = ?,
              assigned_employee_id = ?,
              status = ?,
              updated_at = ?,
              assigned_at = ?,
              dispatched_at = ?,
              en_route_at = ?,
              on_site_at = ?,
              completed_at = ?,
              canceled_at = ?
          WHERE id = ?
        `
      )
      .run(
        assignedTo,
        assignedEmployeeId,
        nextStatus,
        now,
        assignedAt,
        dispatchedAt,
        enRouteAt,
        onSiteAt,
        completedAt,
        canceledAt,
        input.appointmentId
      );

    return getAppointmentById(input.appointmentId);
  },
  async completeAppointmentWithProof(input) {
    const appointment = await getAppointmentById(input.appointmentId);

    if (!appointment) {
      return null;
    }

    if (appointment.status !== "on_site" && appointment.status !== "completed") {
      throw new Error("Jobs can only be completed from the on-site stage.");
    }

    const createdAssets = await proofWorkService.createProofAssets({
      appointmentId: input.appointmentId,
      files: input.files
    });
    const now = new Date().toISOString();

    getDatabase()
      .prepare(
        `
          UPDATE appointments
          SET status = 'completed',
              updated_at = ?,
              completed_at = COALESCE(completed_at, ?),
              completion_notes = ?,
              completion_signature_name = ?
          WHERE id = ?
        `
      )
      .run(
        now,
        now,
        input.completionNotes?.trim() ? input.completionNotes.trim() : null,
        input.completionSignatureName?.trim() ? input.completionSignatureName.trim() : null,
        input.appointmentId
      );

    const completedAppointment = await getAppointmentById(input.appointmentId);

    return completedAppointment
      ? {
          ...completedAppointment,
          proofAssets:
            completedAppointment.proofAssets.length > 0
              ? completedAppointment.proofAssets
              : createdAssets,
          proofAssetCount:
            completedAppointment.proofAssetCount > 0
              ? completedAppointment.proofAssetCount
              : createdAssets.length
        }
      : null;
  }
};
