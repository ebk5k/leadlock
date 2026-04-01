import type { ReactNode } from "react";

import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  eyebrow,
  label,
  value,
  change,
  tone = "default",
  icon
}: {
  eyebrow?: string;
  label: string;
  value: string;
  change: string;
  tone?: "default" | "success";
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">{eyebrow}</p> : null}
          <p className="text-sm text-slate-300">{label}</p>
        </div>
        {icon ? <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">{icon}</div> : null}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <div className="mt-3 flex items-center gap-2">
        <Badge
          className={cn(
            "gap-1 border-white/10 bg-white/6 text-slate-200",
            tone === "success" && "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          )}
        >
          <ArrowUpRight className="h-3 w-3" />
          {change}
        </Badge>
      </div>
    </Card>
  );
}
