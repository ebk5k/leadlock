import { unstable_noStore as noStore } from "next/cache.js";

import {
  assertRecordInBusiness,
  getRecordBusinessAssociation,
  resolveGuardedBusinessScope
} from "@/lib/business-guard";
import { resolveActiveBusinessId } from "@/lib/business-context";
import { getDatabase } from "@/lib/data/database";
import { mockPaymentProvider } from "@/lib/payments/mock-provider";
import { stripePaymentProvider } from "@/lib/payments/stripe-provider";
import { resolveBusinessProviderConfig } from "@/lib/providers/config";
import { getPersistedSettings } from "@/lib/settings/store";
import { messagingService } from "@/lib/services/messaging-service";
import type { PaymentProvider } from "@/lib/payments/provider";
import type { Appointment, PaymentRecord, PaymentStatus } from "@/types/domain";

const PAYMENT_REMINDER_DELAY_MINUTES = 60;

function getPaymentProvider(providerName: string): PaymentProvider {
  const provider = providerName || "mock";

  switch (provider) {
    case "stripe":
      return stripePaymentProvider;
    case "mock":
    default:
      return mockPaymentProvider;
  }
}

function mapPaymentRow(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : undefined,
    appointmentId: String(row.appointment_id),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    status: row.status as PaymentStatus,
    provider: String(row.provider),
    checkoutUrl: row.checkout_url ? String(row.checkout_url) : undefined,
    externalCheckoutSessionId: row.external_checkout_session_id
      ? String(row.external_checkout_session_id)
      : undefined,
    externalPaymentIntentId: row.external_payment_intent_id
      ? String(row.external_payment_intent_id)
      : undefined,
    externalChargeId: row.external_charge_id ? String(row.external_charge_id) : undefined,
    externalRefundId: row.external_refund_id ? String(row.external_refund_id) : undefined,
    description: String(row.description),
    failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function findPaymentAssociation(input: {
  paymentId?: string;
  externalCheckoutSessionId?: string;
  externalPaymentIntentId?: string;
  externalChargeId?: string;
}) {
  if (input.paymentId) {
    return getRecordBusinessAssociation("payments", input.paymentId);
  }

  const row = getDatabase()
    .prepare(
      `
        SELECT id, business_id
        FROM payments
        WHERE external_checkout_session_id = ?
           OR external_payment_intent_id = ?
           OR external_charge_id = ?
        ORDER BY datetime(updated_at) DESC
        LIMIT 1
      `
    )
    .get(
      input.externalCheckoutSessionId ?? null,
      input.externalPaymentIntentId ?? null,
      input.externalChargeId ?? null
    ) as { id?: string; business_id?: string } | undefined;

  if (!row?.id || !row.business_id) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id
  };
}

function updatePaymentRecord(
  paymentId: string,
  businessId: string,
  input: {
    status: PaymentStatus;
    provider?: string;
    checkoutUrl?: string;
    externalCheckoutSessionId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
    externalRefundId?: string;
    failureReason?: string;
  }
) {
  getDatabase()
    .prepare(
      `
        UPDATE payments
        SET status = ?,
            provider = COALESCE(?, provider),
            checkout_url = COALESCE(?, checkout_url),
            external_checkout_session_id = COALESCE(?, external_checkout_session_id),
            external_payment_intent_id = COALESCE(?, external_payment_intent_id),
            external_charge_id = COALESCE(?, external_charge_id),
            external_refund_id = COALESCE(?, external_refund_id),
            failure_reason = ?,
            updated_at = ?
        WHERE business_id = ? AND id = ?
      `
    )
    .run(
      input.status,
      input.provider ?? null,
      input.checkoutUrl ?? null,
      input.externalCheckoutSessionId ?? null,
      input.externalPaymentIntentId ?? null,
      input.externalChargeId ?? null,
      input.externalRefundId ?? null,
      input.failureReason ?? null,
      new Date().toISOString(),
      businessId,
      paymentId
    );
}

function isPaymentReminderEligible(payment: PaymentRecord) {
  if (payment.status === "paid" || payment.status === "refunded") {
    return false;
  }

  const referenceTime = new Date(payment.updatedAt);
  const ageMinutes = (Date.now() - referenceTime.getTime()) / (1000 * 60);

  return Number.isFinite(ageMinutes) && ageMinutes >= PAYMENT_REMINDER_DELAY_MINUTES;
}

function getAppointmentSummaryForPayment(paymentId: string, businessId: string) {
  const row = getDatabase()
    .prepare(
      `
        SELECT
          a.id,
          a.customer_name,
          a.service,
          p.checkout_url
        FROM payments p
        INNER JOIN appointments a ON a.id = p.appointment_id AND a.business_id = p.business_id
        WHERE p.business_id = ? AND p.id = ?
        LIMIT 1
      `
    )
    .get(businessId, paymentId) as
    | {
        id?: string;
        customer_name?: string;
        service?: string;
        checkout_url?: string | null;
      }
    | undefined;

  if (!row?.id || !row.customer_name || !row.service) {
    return null;
  }

  return {
    id: row.id,
    businessId,
    customerName: row.customer_name,
    service: row.service,
    paymentCheckoutUrl: row.checkout_url ?? undefined
  };
}

export interface PaymentService {
  getPayments(): Promise<PaymentRecord[]>;
  getPaymentById(paymentId: string): Promise<PaymentRecord | null>;
  createAppointmentPaymentRequest(input: { appointment: Appointment; baseUrl: string }): Promise<PaymentRecord>;
  markPaid(input: {
    paymentId?: string;
    businessId?: string;
    externalCheckoutSessionId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
  }): Promise<void>;
  markFailed(input: {
    paymentId?: string;
    businessId?: string;
    externalCheckoutSessionId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
    failureReason?: string;
  }): Promise<void>;
  markRefunded(input: {
    paymentId?: string;
    businessId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
    externalRefundId?: string;
  }): Promise<void>;
}

export const paymentService: PaymentService = {
  async getPayments() {
    noStore();
    const businessId = await resolveActiveBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT *
          FROM payments
          WHERE business_id = ?
          ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    const payments = rows.map(mapPaymentRow);
    const reminderCandidates = payments.filter(isPaymentReminderEligible);

    await Promise.all(
      reminderCandidates.map(async (payment) => {
        const appointment = getAppointmentSummaryForPayment(payment.id, businessId);

        if (!appointment) {
          return null;
        }

        return messagingService.triggerPaymentReminder({ payment, appointment });
      })
    );

    return payments;
  },
  async getPaymentById(paymentId) {
    noStore();
    const businessId = await resolveActiveBusinessId();

    const row = getDatabase()
      .prepare(
        `
          SELECT *
          FROM payments
          WHERE business_id = ? AND id = ?
          LIMIT 1
        `
      )
      .get(businessId, paymentId) as Record<string, unknown> | undefined;

    return row ? mapPaymentRow(row) : null;
  },

  async createAppointmentPaymentRequest({ appointment, baseUrl }) {
    const businessId = await resolveGuardedBusinessScope({
      action: "paymentService.createAppointmentPaymentRequest",
      associatedBusinessId: appointment.businessId
    });
    const providerConfig = await resolveBusinessProviderConfig({
      businessId,
      integrationKind: "payments"
    });
    const provider = getPaymentProvider(providerConfig.providerName);
    const settings = getPersistedSettings();
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      id: `pay-${crypto.randomUUID()}`,
      businessId,
      appointmentId: appointment.id,
      amountCents: settings.defaultJobPriceCents,
      currency: settings.currency,
      status: "pending",
      provider: provider.name,
      description: `${appointment.service} booking for ${appointment.customerName}`,
      createdAt: now,
      updatedAt: now
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO payments (
            id, business_id, appointment_id, amount_cents, currency, status, provider, description, checkout_url,
            external_checkout_session_id, external_payment_intent_id, external_charge_id,
            external_refund_id, failure_reason, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        payment.id,
        payment.businessId ?? businessId,
        payment.appointmentId,
        payment.amountCents,
        payment.currency,
        payment.status,
        payment.provider,
        payment.description,
        payment.checkoutUrl ?? null,
        payment.externalCheckoutSessionId ?? null,
        payment.externalPaymentIntentId ?? null,
        payment.externalChargeId ?? null,
        payment.externalRefundId ?? null,
        payment.failureReason ?? null,
        payment.createdAt,
        payment.updatedAt
      );

    try {
      const result = await provider.createPaymentRequest(
        {
          appointment,
          amountCents: payment.amountCents,
          currency: payment.currency,
          baseUrl,
          payment
        },
        providerConfig
      );

      updatePaymentRecord(payment.id, businessId, {
        status: result.status,
        provider: result.provider,
        checkoutUrl: result.checkoutUrl,
        externalCheckoutSessionId: result.externalCheckoutSessionId,
        externalPaymentIntentId: result.externalPaymentIntentId
      });

      return {
        ...payment,
        provider: result.provider,
        status: result.status,
        checkoutUrl: result.checkoutUrl,
        externalCheckoutSessionId: result.externalCheckoutSessionId,
        externalPaymentIntentId: result.externalPaymentIntentId,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : "Payment request creation failed.";

      updatePaymentRecord(payment.id, businessId, {
        status: "failed",
        failureReason
      });

      return {
        ...payment,
        status: "failed",
        failureReason,
        updatedAt: new Date().toISOString()
      };
    }
  },

  async markPaid(input) {
    const paymentAssociation = findPaymentAssociation(input);

    if (!paymentAssociation) {
      return;
    }

    const businessId = await resolveGuardedBusinessScope({
      action: "paymentService.markPaid",
      requestedBusinessId: input.businessId,
      associatedBusinessId: paymentAssociation.businessId
    });

    await assertRecordInBusiness({
      action: "paymentService.markPaid",
      table: "payments",
      recordId: paymentAssociation.id,
      expectedBusinessId: businessId
    });

    updatePaymentRecord(paymentAssociation.id, businessId, {
      status: "paid",
      externalCheckoutSessionId: input.externalCheckoutSessionId,
      externalPaymentIntentId: input.externalPaymentIntentId,
      externalChargeId: input.externalChargeId,
      failureReason: undefined
    });
  },

  async markFailed(input) {
    const paymentAssociation = findPaymentAssociation(input);

    if (!paymentAssociation) {
      return;
    }

    const businessId = await resolveGuardedBusinessScope({
      action: "paymentService.markFailed",
      requestedBusinessId: input.businessId,
      associatedBusinessId: paymentAssociation.businessId
    });

    await assertRecordInBusiness({
      action: "paymentService.markFailed",
      table: "payments",
      recordId: paymentAssociation.id,
      expectedBusinessId: businessId
    });

    updatePaymentRecord(paymentAssociation.id, businessId, {
      status: "failed",
      externalCheckoutSessionId: input.externalCheckoutSessionId,
      externalPaymentIntentId: input.externalPaymentIntentId,
      externalChargeId: input.externalChargeId,
      failureReason: input.failureReason
    });
  },

  async markRefunded(input) {
    const paymentAssociation = findPaymentAssociation(input);

    if (!paymentAssociation) {
      return;
    }

    const businessId = await resolveGuardedBusinessScope({
      action: "paymentService.markRefunded",
      requestedBusinessId: input.businessId,
      associatedBusinessId: paymentAssociation.businessId
    });

    await assertRecordInBusiness({
      action: "paymentService.markRefunded",
      table: "payments",
      recordId: paymentAssociation.id,
      expectedBusinessId: businessId
    });

    updatePaymentRecord(paymentAssociation.id, businessId, {
      status: "refunded",
      externalPaymentIntentId: input.externalPaymentIntentId,
      externalChargeId: input.externalChargeId,
      externalRefundId: input.externalRefundId,
      failureReason: undefined
    });
  }
};
