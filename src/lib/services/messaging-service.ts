import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { mockMessagingProvider, type MessagingProvider } from "@/lib/messaging/mock-provider";
import { getCurrentBusinessId, getPersistedSettings } from "@/lib/settings/store";
import type { Appointment, CallLog, FollowUpEvent, Lead, PaymentRecord } from "@/types/domain";

function getMessagingProvider(): MessagingProvider {
  const provider = process.env.MESSAGING_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
    default:
      return mockMessagingProvider;
  }
}

function applyTemplate(template: string, appointment: Appointment) {
  const scheduledFor = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(appointment.scheduledFor));

  return template
    .replaceAll("{{customer_name}}", appointment.customerName)
    .replaceAll("{{service}}", appointment.service)
    .replaceAll("{{scheduled_for}}", scheduledFor);
}

function createOutboundMessage(input: {
  id: string;
  businessId: string;
  appointmentId?: string;
  relatedCallId?: string;
  relatedLeadId?: string;
  relatedPaymentId?: string;
  triggerSource: "automatic" | "manual";
  leadName: string;
  channel: FollowUpEvent["channel"];
  messageType: string;
  outcome: string;
  status: FollowUpEvent["status"];
  timestamp: string;
}) {
  getDatabase()
    .prepare(
      `
        INSERT INTO outbound_messages (
          id, business_id, appointment_id, related_call_id, related_lead_id, related_payment_id, trigger_source, lead_name, channel, message_type, outcome, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      input.id,
      input.businessId,
      input.appointmentId ?? null,
      input.relatedCallId ?? null,
      input.relatedLeadId ?? null,
      input.relatedPaymentId ?? null,
      input.triggerSource,
      input.leadName,
      input.channel,
      input.messageType,
      input.outcome,
      input.status,
      input.timestamp
    );
}

function updateOutboundMessage(event: FollowUpEvent) {
  const businessId = getCurrentBusinessId();
  getDatabase()
    .prepare(
      `
        UPDATE outbound_messages
        SET status = ?, outcome = ?
        WHERE business_id = ? AND id = ?
      `
    )
    .run(event.status, event.outcome, businessId, event.id);
}

function buildMissedCallRecoveryContent(call: CallLog) {
  const callerLabel = call.callerName === "Unknown Caller" ? "there" : call.callerName;

  if (call.outcome === "voicemail") {
    return `Hi ${callerLabel}, we saw your voicemail about ${call.summary.toLowerCase()}. Reply here and we'll help you book the next step.`;
  }

  return `Hi ${callerLabel}, we missed your call${call.callerNumber ? ` from ${call.callerNumber}` : ""}. Reply here and we'll help you get booked.`;
}

function buildNoResponseLeadRecoveryContent(lead: Lead) {
  const serviceLabel = lead.service.toLowerCase();

  return `Hi ${lead.name}, just checking in on your ${serviceLabel} request. Reply here if you'd like help booking the next step.`;
}

function buildPaymentReminderContent(input: {
  customerName: string;
  service: string;
  amountCents: number;
  checkoutUrl?: string;
}) {
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(input.amountCents / 100);

  return `Hi ${input.customerName}, your payment for ${input.service} is still open. The current balance is ${amount}.${input.checkoutUrl ? ` Complete payment here: ${input.checkoutUrl}` : " Reply here if you need the payment link resent."}`;
}

export interface MessagingService {
  getFollowUps(): Promise<FollowUpEvent[]>;
  triggerBookingConfirmation(input: { appointment: Appointment; force?: boolean }): Promise<FollowUpEvent>;
  triggerMissedCallRecovery(input: { call: CallLog; force?: boolean }): Promise<FollowUpEvent | null>;
  triggerNoResponseLeadRecovery(input: { lead: Lead; force?: boolean }): Promise<FollowUpEvent | null>;
  triggerPaymentReminder(input: {
    payment: PaymentRecord;
    appointment: Pick<Appointment, "id" | "customerName" | "service" | "paymentCheckoutUrl">;
    force?: boolean;
  }): Promise<FollowUpEvent | null>;
}

export const messagingService: MessagingService = {
  async getFollowUps() {
    noStore();
    const businessId = getCurrentBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, business_id, appointment_id, lead_name, channel, status, outcome, created_at, message_type, trigger_source, related_call_id, related_lead_id, related_payment_id
          FROM outbound_messages
          WHERE business_id = ?
          ORDER BY datetime(created_at) DESC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      businessId: row.business_id ? String(row.business_id) : undefined,
      leadName: String(row.lead_name),
      channel: row.channel as FollowUpEvent["channel"],
      status: row.status as FollowUpEvent["status"],
      outcome: String(row.outcome),
      timestamp: String(row.created_at),
      appointmentId: row.appointment_id ? String(row.appointment_id) : undefined,
      messageType: row.message_type ? String(row.message_type) : undefined,
      triggerSource:
        row.trigger_source === "manual" ? "manual" : "automatic",
      relatedCallId: row.related_call_id ? String(row.related_call_id) : undefined,
      relatedLeadId: row.related_lead_id ? String(row.related_lead_id) : undefined,
      relatedPaymentId: row.related_payment_id ? String(row.related_payment_id) : undefined
    }));
  },

  async triggerBookingConfirmation({ appointment, force = false }) {
    const provider = getMessagingProvider();
    const settings = getPersistedSettings();
    const template = settings.confirmationMessageTemplate;
    const content = applyTemplate(template, appointment);
    const baseEvent: FollowUpEvent = {
      id: `msg-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
      leadName: appointment.customerName,
      channel: "sms",
      status: "pending",
      outcome: `Booking confirmation queued: ${content}`,
      timestamp: new Date().toISOString(),
      appointmentId: appointment.id,
      messageType: "booking_confirmation",
      triggerSource: force ? "manual" : "automatic"
    };

    createOutboundMessage({
      id: baseEvent.id,
      businessId: baseEvent.businessId ?? getCurrentBusinessId(),
      appointmentId: appointment.id,
      triggerSource: force ? "manual" : "automatic",
      leadName: baseEvent.leadName,
      channel: baseEvent.channel,
      messageType: "booking_confirmation",
      outcome: baseEvent.outcome,
      status: baseEvent.status,
      timestamp: baseEvent.timestamp
    });

    const delivery = await provider.sendMessage({
      leadName: appointment.customerName,
      channel: baseEvent.channel,
      content
    });

    const deliveredEvent: FollowUpEvent = {
      ...baseEvent,
      status: delivery.status,
      outcome:
        delivery.status === "sent"
          ? `Booking confirmation sent: ${content}`
          : `Booking confirmation failed: ${content}`
    };

    updateOutboundMessage(deliveredEvent);

    return deliveredEvent;
  },

  async triggerMissedCallRecovery({ call, force = false }) {
    if (call.outcome !== "missed" && call.outcome !== "voicemail") {
      return null;
    }

    const existingRecovery = force
      ? undefined
      : (getDatabase()
      .prepare(
        `
          SELECT id, business_id, status, outcome, created_at, lead_name, channel, message_type, trigger_source, related_call_id
          FROM outbound_messages
          WHERE business_id = ? AND related_call_id = ? AND message_type = 'missed_call_recovery'
          LIMIT 1
        `
      )
      .get(getCurrentBusinessId(), call.id) as Record<string, unknown> | undefined);

    if (existingRecovery) {
      return {
        id: String(existingRecovery.id),
        businessId: existingRecovery.business_id ? String(existingRecovery.business_id) : undefined,
        leadName: String(existingRecovery.lead_name),
        channel: existingRecovery.channel as FollowUpEvent["channel"],
        status: existingRecovery.status as FollowUpEvent["status"],
        outcome: String(existingRecovery.outcome),
        timestamp: String(existingRecovery.created_at),
        messageType: String(existingRecovery.message_type),
        triggerSource: existingRecovery.trigger_source === "manual" ? "manual" : "automatic",
        relatedCallId: String(existingRecovery.related_call_id)
      };
    }

    const provider = getMessagingProvider();
    const content = buildMissedCallRecoveryContent(call);
    const baseEvent: FollowUpEvent = {
      id: `msg-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
      leadName: call.callerName,
      channel: "sms",
      status: "pending",
      outcome: `Missed-call recovery queued: ${content}`,
      timestamp: new Date().toISOString(),
      messageType: "missed_call_recovery",
      triggerSource: force ? "manual" : "automatic",
      relatedCallId: call.id
    };

    createOutboundMessage({
      id: baseEvent.id,
      businessId: baseEvent.businessId ?? getCurrentBusinessId(),
      relatedCallId: call.id,
      triggerSource: force ? "manual" : "automatic",
      leadName: baseEvent.leadName,
      channel: baseEvent.channel,
      messageType: "missed_call_recovery",
      outcome: baseEvent.outcome,
      status: baseEvent.status,
      timestamp: baseEvent.timestamp
    });

    const delivery = await provider.sendMessage({
      leadName: call.callerName,
      channel: baseEvent.channel,
      content
    });

    const deliveredEvent: FollowUpEvent = {
      ...baseEvent,
      status: delivery.status,
      outcome:
        delivery.status === "sent"
          ? `Missed-call recovery sent: ${content}`
          : `Missed-call recovery failed: ${content}`
    };

    updateOutboundMessage(deliveredEvent);

    return deliveredEvent;
  },

  async triggerNoResponseLeadRecovery({ lead, force = false }) {
    const existingRecovery = force
      ? undefined
      : (getDatabase()
      .prepare(
        `
          SELECT id, business_id, status, outcome, created_at, lead_name, channel, message_type, trigger_source, related_lead_id
          FROM outbound_messages
          WHERE business_id = ? AND related_lead_id = ? AND message_type = 'no_response_lead_recovery'
          LIMIT 1
        `
      )
      .get(getCurrentBusinessId(), lead.id) as Record<string, unknown> | undefined);

    if (existingRecovery) {
      return {
        id: String(existingRecovery.id),
        businessId: existingRecovery.business_id ? String(existingRecovery.business_id) : undefined,
        leadName: String(existingRecovery.lead_name),
        channel: existingRecovery.channel as FollowUpEvent["channel"],
        status: existingRecovery.status as FollowUpEvent["status"],
        outcome: String(existingRecovery.outcome),
        timestamp: String(existingRecovery.created_at),
        messageType: String(existingRecovery.message_type),
        triggerSource: existingRecovery.trigger_source === "manual" ? "manual" : "automatic",
        relatedLeadId: String(existingRecovery.related_lead_id)
      };
    }

    const provider = getMessagingProvider();
    const channel: FollowUpEvent["channel"] = lead.phone ? "sms" : "email";
    const content = buildNoResponseLeadRecoveryContent(lead);
    const baseEvent: FollowUpEvent = {
      id: `msg-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
      leadName: lead.name,
      channel,
      status: "pending",
      outcome: `No-response lead recovery queued: ${content}`,
      timestamp: new Date().toISOString(),
      messageType: "no_response_lead_recovery",
      triggerSource: force ? "manual" : "automatic",
      relatedLeadId: lead.id
    };

    createOutboundMessage({
      id: baseEvent.id,
      businessId: baseEvent.businessId ?? getCurrentBusinessId(),
      relatedLeadId: lead.id,
      triggerSource: force ? "manual" : "automatic",
      leadName: baseEvent.leadName,
      channel: baseEvent.channel,
      messageType: "no_response_lead_recovery",
      outcome: baseEvent.outcome,
      status: baseEvent.status,
      timestamp: baseEvent.timestamp
    });

    const delivery = await provider.sendMessage({
      leadName: lead.name,
      channel,
      content
    });

    const deliveredEvent: FollowUpEvent = {
      ...baseEvent,
      status: delivery.status,
      outcome:
        delivery.status === "sent"
          ? `No-response lead recovery sent: ${content}`
          : `No-response lead recovery failed: ${content}`
    };

    updateOutboundMessage(deliveredEvent);

    return deliveredEvent;
  },

  async triggerPaymentReminder({ payment, appointment, force = false }) {
    if (payment.status === "paid" || payment.status === "refunded") {
      return null;
    }

    const existingReminder = force
      ? undefined
      : (getDatabase()
      .prepare(
        `
          SELECT id, business_id, appointment_id, status, outcome, created_at, lead_name, channel, message_type, trigger_source, related_payment_id
          FROM outbound_messages
          WHERE business_id = ? AND related_payment_id = ? AND message_type = 'payment_reminder'
          LIMIT 1
        `
      )
      .get(getCurrentBusinessId(), payment.id) as Record<string, unknown> | undefined);

    if (existingReminder) {
      return {
        id: String(existingReminder.id),
        businessId: existingReminder.business_id ? String(existingReminder.business_id) : undefined,
        leadName: String(existingReminder.lead_name),
        channel: existingReminder.channel as FollowUpEvent["channel"],
        status: existingReminder.status as FollowUpEvent["status"],
        outcome: String(existingReminder.outcome),
        timestamp: String(existingReminder.created_at),
        appointmentId: existingReminder.appointment_id ? String(existingReminder.appointment_id) : undefined,
        messageType: String(existingReminder.message_type),
        triggerSource: existingReminder.trigger_source === "manual" ? "manual" : "automatic",
        relatedPaymentId: String(existingReminder.related_payment_id)
      };
    }

    const provider = getMessagingProvider();
    const content = buildPaymentReminderContent({
      customerName: appointment.customerName,
      service: appointment.service,
      amountCents: payment.amountCents,
      checkoutUrl: payment.checkoutUrl ?? appointment.paymentCheckoutUrl
    });
    const baseEvent: FollowUpEvent = {
      id: `msg-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
      leadName: appointment.customerName,
      channel: "sms",
      status: "pending",
      outcome: `Payment reminder queued: ${content}`,
      timestamp: new Date().toISOString(),
      appointmentId: appointment.id,
      messageType: "payment_reminder",
      triggerSource: force ? "manual" : "automatic",
      relatedPaymentId: payment.id
    };

    createOutboundMessage({
      id: baseEvent.id,
      businessId: baseEvent.businessId ?? getCurrentBusinessId(),
      appointmentId: appointment.id,
      relatedPaymentId: payment.id,
      triggerSource: force ? "manual" : "automatic",
      leadName: baseEvent.leadName,
      channel: baseEvent.channel,
      messageType: "payment_reminder",
      outcome: baseEvent.outcome,
      status: baseEvent.status,
      timestamp: baseEvent.timestamp
    });

    const delivery = await provider.sendMessage({
      leadName: appointment.customerName,
      channel: baseEvent.channel,
      content
    });

    const deliveredEvent: FollowUpEvent = {
      ...baseEvent,
      status: delivery.status,
      outcome:
        delivery.status === "sent"
          ? `Payment reminder sent: ${content}`
          : `Payment reminder failed: ${content}`
    };

    updateOutboundMessage(deliveredEvent);

    return deliveredEvent;
  }
};
