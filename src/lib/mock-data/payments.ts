import type { PaymentRecord } from "@/types/domain";

export const payments: PaymentRecord[] = [
  {
    id: "pay-001",
    appointmentId: "appt-001",
    amountCents: 22000,
    currency: "usd",
    status: "paid",
    provider: "mock",
    checkoutUrl: "https://example.com/mock-checkout/pay-001",
    externalCheckoutSessionId: "mock-session-001",
    externalPaymentIntentId: "mock-intent-001",
    description: "Deep Cleaning booking for Sofia Patel",
    createdAt: "2026-03-30T14:00:00.000Z",
    updatedAt: "2026-03-30T14:10:00.000Z"
  },
  {
    id: "pay-002",
    appointmentId: "appt-002",
    amountCents: 28000,
    currency: "usd",
    status: "pending",
    provider: "mock",
    checkoutUrl: "https://example.com/mock-checkout/pay-002",
    externalCheckoutSessionId: "mock-session-002",
    description: "HVAC Repair booking for Chris Walton",
    createdAt: "2026-03-30T15:00:00.000Z",
    updatedAt: "2026-03-30T15:00:00.000Z"
  },
  {
    id: "pay-003",
    appointmentId: "appt-003",
    amountCents: 18000,
    currency: "usd",
    status: "failed",
    provider: "mock",
    checkoutUrl: "https://example.com/mock-checkout/pay-003",
    externalCheckoutSessionId: "mock-session-003",
    description: "Drain Inspection booking for Marcus Lane",
    failureReason: "Card declined during checkout",
    createdAt: "2026-03-30T16:00:00.000Z",
    updatedAt: "2026-03-30T16:05:00.000Z"
  }
];
