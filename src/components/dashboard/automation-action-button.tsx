"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AutomationActionButton({
  actionType,
  label,
  appointmentId,
  callId,
  leadId,
  paymentId,
  variant = "outline"
}: {
  actionType: "booking_confirmation" | "missed_call_recovery" | "no_response_lead_recovery" | "payment_reminder";
  label: string;
  appointmentId?: string;
  callId?: string;
  leadId?: string;
  paymentId?: string;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/automation-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          actionType,
          appointmentId,
          callId,
          leadId,
          paymentId
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to send automation.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send automation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button disabled={isPending || isSubmitting} onClick={handleClick} size="sm" type="button" variant={variant}>
        {isSubmitting ? "Sending..." : label}
      </Button>
      {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
    </div>
  );
}
