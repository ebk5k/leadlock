import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/domain";

const statusClasses: Record<Appointment["calendarSyncStatus"], string> = {
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  synced: "bg-emerald-100 text-emerald-700"
};

export function CalendarSyncBadge({ status }: { status: Appointment["calendarSyncStatus"] }) {
  return <Badge className={cn(statusClasses[status])}>{status}</Badge>;
}
