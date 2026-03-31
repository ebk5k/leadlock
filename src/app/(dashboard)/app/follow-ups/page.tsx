import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { settingsService } from "@/lib/services/settings-service";
import { formatDateTime } from "@/lib/utils";

export default async function FollowUpsPage() {
  const events = await settingsService.getFollowUps();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Follow-up logs"
        description="A simple activity trail for callbacks, reminders, and post-booking communication."
      />
      <Card className="rounded-3xl p-5">
        <div className="space-y-4">
          {events.map((event) => (
            <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between" key={event.id}>
              <div>
                <p className="font-medium text-slate-950">{event.leadName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.outcome}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{event.channel}</Badge>
                <Badge>{event.status}</Badge>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
