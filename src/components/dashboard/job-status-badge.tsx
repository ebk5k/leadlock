import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/domain";

const statusClasses: Record<AppointmentStatus, string> = {
  canceled: "bg-slate-200 text-slate-700",
  completed: "bg-emerald-100 text-emerald-700",
  dispatched: "bg-sky-100 text-sky-700",
  en_route: "bg-indigo-100 text-indigo-700",
  on_site: "bg-amber-100 text-amber-700",
  scheduled: "bg-violet-100 text-violet-700"
};

export function JobStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge className={cn(statusClasses[status])}>{status.replace("_", " ")}</Badge>;
}
