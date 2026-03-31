import type { CreatePaymentRequestInput, PaymentProvider } from "@/lib/payments/provider";

export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  async createPaymentRequest(input: CreatePaymentRequestInput) {
    return {
      status: "pending",
      provider: "mock",
      checkoutUrl: `${input.baseUrl}/book?checkout=${input.payment.id}`,
      externalCheckoutSessionId: `mock-session-${crypto.randomUUID()}`
    };
  }
};
