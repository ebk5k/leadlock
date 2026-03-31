import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types/domain";

const statusClasses: Record<PaymentStatus, string> = {
  failed: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  refunded: "bg-slate-200 text-slate-700"
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge className={cn(statusClasses[status])}>{status}</Badge>;
}
