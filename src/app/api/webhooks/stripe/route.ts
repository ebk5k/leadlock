import { NextResponse } from "next/server";

import { resolveStripeWebhookSecret } from "@/lib/providers/config";
import { paymentService } from "@/lib/services/payment-service";
import { getStripeWebhookBusinessIdHint, parseStripeWebhookEvent } from "@/lib/webhooks/stripe-webhook";

function getStringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  if (!signatureHeader) {
    return NextResponse.json(
      { success: false, message: "Missing Stripe-Signature header." },
      { status: 400 }
    );
  }

  let event;

  try {
    const businessIdHint = getStripeWebhookBusinessIdHint(rawBody);
    const webhookSecret = await resolveStripeWebhookSecret(businessIdHint);
    event = parseStripeWebhookEvent(rawBody, signatureHeader, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Invalid Stripe webhook signature."
      },
      { status: 400 }
    );
  }

  const object = event.data?.object ?? {};
  const metadata =
    typeof object.metadata === "object" && object.metadata !== null
      ? (object.metadata as Record<string, unknown>)
      : {};
  const businessId = getStringValue(metadata, "leadlock_business_id");

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await paymentService.markPaid({
        businessId,
        paymentId: getStringValue(metadata, "leadlock_payment_id"),
        externalCheckoutSessionId: getStringValue(object, "id"),
        externalPaymentIntentId: getStringValue(object, "payment_intent")
      });
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      await paymentService.markFailed({
        businessId,
        paymentId: getStringValue(metadata, "leadlock_payment_id"),
        externalCheckoutSessionId: getStringValue(object, "id"),
        externalPaymentIntentId: getStringValue(object, "payment_intent"),
        failureReason: getStringValue(object, "payment_status") ?? "Checkout session failed."
      });
      break;
    case "payment_intent.payment_failed": {
      const lastPaymentError =
        typeof object.last_payment_error === "object" && object.last_payment_error !== null
          ? (object.last_payment_error as Record<string, unknown>)
          : {};

      await paymentService.markFailed({
        businessId,
        paymentId: getStringValue(metadata, "leadlock_payment_id"),
        externalPaymentIntentId: getStringValue(object, "id"),
        failureReason:
          getStringValue(lastPaymentError, "message") ?? "Payment intent failed in Stripe."
      });
      break;
    }
    case "charge.refunded":
      await paymentService.markRefunded({
        businessId,
        externalChargeId: getStringValue(object, "id"),
        externalPaymentIntentId: getStringValue(object, "payment_intent"),
        externalRefundId: undefined
      });
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
