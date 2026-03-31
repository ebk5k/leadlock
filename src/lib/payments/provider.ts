import type { Appointment, PaymentRecord, PaymentStatus } from "@/types/domain";

export interface CreatePaymentRequestInput {
  appointment: Appointment;
  amountCents: number;
  currency: string;
  baseUrl: string;
  payment: PaymentRecord;
}

export interface CreatePaymentRequestResult {
  status: PaymentStatus;
  provider: string;
  checkoutUrl?: string;
  externalCheckoutSessionId?: string;
  externalPaymentIntentId?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  createPaymentRequest(input: CreatePaymentRequestInput): Promise<CreatePaymentRequestResult>;
}
