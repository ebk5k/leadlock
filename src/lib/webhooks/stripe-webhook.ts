import crypto from "node:crypto";

interface StripeEventEnvelope {
  id?: string;
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
}

function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is missing.");
  }

  return secret;
}

function parseStripeSignatureHeader(value: string) {
  const parts = value.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Stripe signature header.");
  }

  return { timestamp, signatures };
}

function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const { timestamp, signatures } = parseStripeSignatureHeader(header);
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));

  if (ageSeconds > 300) {
    throw new Error("Stripe webhook timestamp is outside the allowed tolerance.");
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const valid = signatures.some((signature) => {
    const left = Buffer.from(signature);
    const right = Buffer.from(expectedSignature);

    if (left.length !== right.length) {
      return false;
    }

    return crypto.timingSafeEqual(left, right);
  });

  if (!valid) {
    throw new Error("Stripe webhook signature verification failed.");
  }
}

export function parseStripeWebhookEvent(rawBody: string, signatureHeader: string) {
  verifyStripeSignature(rawBody, signatureHeader, getStripeWebhookSecret());

  const event = JSON.parse(rawBody) as StripeEventEnvelope;

  if (!event.type || !event.data?.object) {
    throw new Error("Stripe webhook payload is missing expected event fields.");
  }

  return event;
}
