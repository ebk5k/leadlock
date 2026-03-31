import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { mockPaymentProvider } from "@/lib/payments/mock-provider";
import { estimateAppointmentAmount } from "@/lib/payments/pricing";
import { stripePaymentProvider } from "@/lib/payments/stripe-provider";
import type { PaymentProvider } from "@/lib/payments/provider";
import type { Appointment, PaymentRecord, PaymentStatus } from "@/types/domain";

function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? "mock";

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

function findPaymentId(input: {
  paymentId?: string;
  externalCheckoutSessionId?: string;
  externalPaymentIntentId?: string;
  externalChargeId?: string;
}) {
  if (input.paymentId) {
    return input.paymentId;
  }

  const row = getDatabase()
    .prepare(
      `
        SELECT id
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
    ) as { id?: string } | undefined;

  return row?.id;
}

function updatePaymentRecord(
  paymentId: string,
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
        WHERE id = ?
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
      paymentId
    );
}

export interface PaymentService {
  getPayments(): Promise<PaymentRecord[]>;
  createAppointmentPaymentRequest(input: { appointment: Appointment; baseUrl: string }): Promise<PaymentRecord>;
  markPaid(input: {
    paymentId?: string;
    externalCheckoutSessionId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
  }): Promise<void>;
  markFailed(input: {
    paymentId?: string;
    externalCheckoutSessionId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
    failureReason?: string;
  }): Promise<void>;
  markRefunded(input: {
    paymentId?: string;
    externalPaymentIntentId?: string;
    externalChargeId?: string;
    externalRefundId?: string;
  }): Promise<void>;
}

export const paymentService: PaymentService = {
  async getPayments() {
    noStore();

    const rows = getDatabase()
      .prepare(
        `
          SELECT *
          FROM payments
          ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map(mapPaymentRow);
  },

  async createAppointmentPaymentRequest({ appointment, baseUrl }) {
    const provider = getPaymentProvider();
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      id: `pay-${crypto.randomUUID()}`,
      appointmentId: appointment.id,
      amountCents: estimateAppointmentAmount(appointment.service),
      currency: process.env.STRIPE_CURRENCY ?? "usd",
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
            id, appointment_id, amount_cents, currency, status, provider, description, checkout_url,
            external_checkout_session_id, external_payment_intent_id, external_charge_id,
            external_refund_id, failure_reason, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        payment.id,
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
      const result = await provider.createPaymentRequest({
        appointment,
        amountCents: payment.amountCents,
        currency: payment.currency,
        baseUrl,
        payment
      });

      updatePaymentRecord(payment.id, {
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

      updatePaymentRecord(payment.id, {
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
    const paymentId = findPaymentId(input);

    if (!paymentId) {
      return;
    }

    updatePaymentRecord(paymentId, {
      status: "paid",
      externalCheckoutSessionId: input.externalCheckoutSessionId,
      externalPaymentIntentId: input.externalPaymentIntentId,
      externalChargeId: input.externalChargeId,
      failureReason: undefined
    });
  },

  async markFailed(input) {
    const paymentId = findPaymentId(input);

    if (!paymentId) {
      return;
    }

    updatePaymentRecord(paymentId, {
      status: "failed",
      externalCheckoutSessionId: input.externalCheckoutSessionId,
      externalPaymentIntentId: input.externalPaymentIntentId,
      externalChargeId: input.externalChargeId,
      failureReason: input.failureReason
    });
  },

  async markRefunded(input) {
    const paymentId = findPaymentId(input);

    if (!paymentId) {
      return;
    }

    updatePaymentRecord(paymentId, {
      status: "refunded",
      externalPaymentIntentId: input.externalPaymentIntentId,
      externalChargeId: input.externalChargeId,
      externalRefundId: input.externalRefundId,
      failureReason: undefined
    });
  }
};
