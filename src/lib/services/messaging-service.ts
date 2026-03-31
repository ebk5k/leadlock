import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { mockMessagingProvider, type MessagingProvider } from "@/lib/messaging/mock-provider";
import type { Appointment, FollowUpEvent } from "@/types/domain";

function getMessagingProvider(): MessagingProvider {
  const provider = process.env.MESSAGING_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
    default:
      return mockMessagingProvider;
  }
}

export interface MessagingService {
  getFollowUps(): Promise<FollowUpEvent[]>;
  triggerBookingConfirmation(input: { appointment: Appointment }): Promise<FollowUpEvent>;
}

export const messagingService: MessagingService = {
  async getFollowUps() {
    noStore();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, lead_name, channel, status, outcome, created_at
          FROM outbound_messages
          ORDER BY datetime(created_at) DESC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      leadName: String(row.lead_name),
      channel: row.channel as FollowUpEvent["channel"],
      status: row.status as FollowUpEvent["status"],
      outcome: String(row.outcome),
      timestamp: String(row.created_at)
    }));
  },

  async triggerBookingConfirmation({ appointment }) {
    const provider = getMessagingProvider();
    const baseEvent: FollowUpEvent = {
      id: `msg-${crypto.randomUUID()}`,
      leadName: appointment.customerName,
      channel: "sms",
      status: "pending",
      outcome: `Booking confirmation queued for ${appointment.service} on ${appointment.scheduledFor}.`,
      timestamp: new Date().toISOString()
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO outbound_messages (
            id, appointment_id, lead_name, channel, message_type, outcome, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        baseEvent.id,
        appointment.id,
        baseEvent.leadName,
        baseEvent.channel,
        "booking_confirmation",
        baseEvent.outcome,
        baseEvent.status,
        baseEvent.timestamp
      );

    const delivery = await provider.sendMessage({
      leadName: appointment.customerName,
      channel: baseEvent.channel,
      content: baseEvent.outcome
    });

    const deliveredEvent: FollowUpEvent = {
      ...baseEvent,
      status: delivery.status,
      outcome:
        delivery.status === "sent"
          ? `Booking confirmation sent for ${appointment.service}.`
          : `Booking confirmation failed for ${appointment.service}.`
    };

    getDatabase()
      .prepare(
        `
          UPDATE outbound_messages
          SET status = ?, outcome = ?
          WHERE id = ?
        `
      )
      .run(deliveredEvent.status, deliveredEvent.outcome, deliveredEvent.id);

    return deliveredEvent;
  }
};
