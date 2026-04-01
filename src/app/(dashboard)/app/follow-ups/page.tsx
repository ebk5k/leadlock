import { AutomationActionButton } from "@/components/dashboard/automation-action-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { paymentService } from "@/lib/services/payment-service";
import { settingsService } from "@/lib/services/settings-service";
import { formatDateTime } from "@/lib/utils";

export default async function FollowUpsPage() {
  await paymentService.getPayments();
  const events = await settingsService.getFollowUps();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Follow-up logs"
        description="A simple activity trail for callbacks, missed-call recovery, no-response lead recovery, payment reminders, and post-booking communication."
      />
      <Card className="rounded-3xl p-5">
        <div className="space-y-4">
          {events.map((event) => (
            <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between" key={event.id}>
              <div>
                <p className="font-medium text-slate-950">{event.leadName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.outcome}</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="flex items-center gap-3">
                  {event.triggerSource ? <Badge>{event.triggerSource}</Badge> : null}
                  {event.messageType ? <Badge>{event.messageType.replaceAll("_", " ")}</Badge> : null}
                  <Badge>{event.channel}</Badge>
                  <Badge>{event.status}</Badge>
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                </div>
                <div>
                  {event.messageType === "booking_confirmation" && event.appointmentId ? (
                    <AutomationActionButton
                      actionType="booking_confirmation"
                      appointmentId={event.appointmentId}
                      label="Resend"
                    />
                  ) : null}
                  {event.messageType === "missed_call_recovery" && event.relatedCallId ? (
                    <AutomationActionButton
                      actionType="missed_call_recovery"
                      callId={event.relatedCallId}
                      label="Resend"
                    />
                  ) : null}
                  {event.messageType === "no_response_lead_recovery" && event.relatedLeadId ? (
                    <AutomationActionButton
                      actionType="no_response_lead_recovery"
                      leadId={event.relatedLeadId}
                      label="Resend"
                    />
                  ) : null}
                  {event.messageType === "payment_reminder" && event.relatedPaymentId ? (
                    <AutomationActionButton
                      actionType="payment_reminder"
                      paymentId={event.relatedPaymentId}
                      label="Resend"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
