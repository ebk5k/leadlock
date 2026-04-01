import type { CreatePaymentRequestInput, PaymentProvider } from "@/lib/payments/provider";
import type { ResolvedBusinessProviderConfig } from "@/types/domain";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

interface StripeCheckoutSessionResponse {
  id?: string;
  url?: string;
  payment_intent?: string | null;
  error?: {
    message?: string;
  };
}

interface StripeConfig {
  secretKey: string;
}

function getStripeConfig(config: ResolvedBusinessProviderConfig): StripeConfig {
  const secretKey = config.secrets.secretKey || process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe payments are enabled but STRIPE_SECRET_KEY is missing.");
  }

  return {
    secretKey
  };
}

function buildFormBody(input: CreatePaymentRequestInput) {
  const params = new URLSearchParams();
  const successUrl = `${input.baseUrl}/book?payment=success&appointment=${encodeURIComponent(input.appointment.id)}`;
  const cancelUrl = `${input.baseUrl}/book?payment=cancelled&appointment=${encodeURIComponent(input.appointment.id)}`;

  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", input.appointment.id);
  params.set("metadata[leadlock_payment_id]", input.payment.id);
  params.set("metadata[leadlock_appointment_id]", input.appointment.id);
  params.set("metadata[leadlock_business_id]", input.payment.businessId ?? input.appointment.businessId ?? "");
  params.set("payment_intent_data[metadata][leadlock_payment_id]", input.payment.id);
  params.set("payment_intent_data[metadata][leadlock_appointment_id]", input.appointment.id);
  params.set(
    "payment_intent_data[metadata][leadlock_business_id]",
    input.payment.businessId ?? input.appointment.businessId ?? ""
  );
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", input.currency);
  params.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  params.set(
    "line_items[0][price_data][product_data][name]",
    `${input.appointment.service} booking`
  );
  params.set(
    "line_items[0][price_data][product_data][description]",
    `LeadLock booking for ${input.appointment.customerName}`
  );

  return params;
}

export const stripePaymentProvider: PaymentProvider = {
  name: "stripe",
  async createPaymentRequest(input: CreatePaymentRequestInput, providerConfig: ResolvedBusinessProviderConfig) {
    const config = getStripeConfig(providerConfig);
    const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: buildFormBody(input)
    });

    const payload = (await response.json()) as StripeCheckoutSessionResponse;

    if (!response.ok || !payload.id) {
      throw new Error(payload.error?.message ?? "Stripe checkout session creation failed.");
    }

    return {
      status: "pending",
      provider: "stripe",
      checkoutUrl: payload.url,
      externalCheckoutSessionId: payload.id,
      externalPaymentIntentId: payload.payment_intent ?? undefined
    };
  }
};
