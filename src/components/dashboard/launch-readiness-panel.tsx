import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LaunchReadinessSnapshot } from "@/types/domain";

export function LaunchReadinessPanel({
  readiness,
  showSetupLink = false
}: {
  readiness: LaunchReadinessSnapshot;
  showSetupLink?: boolean;
}) {
  const completionPercent = Math.round((readiness.readyItems / readiness.totalItems) * 100);

  return (
    <Card className="rounded-3xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Launch readiness</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A lightweight install checklist for what is configured versus what still needs delivery work.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={completionPercent === 100 ? "bg-emerald-100 text-emerald-700" : ""}>
            {readiness.readyItems}/{readiness.totalItems} ready
          </Badge>
          {showSetupLink ? (
            <Link className="text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/app/onboarding">
              Open setup wizard
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${completionPercent}%` }} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {readiness.items.map((item) => (
          <div className="rounded-2xl border border-border p-4" key={item.key}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{item.label}</p>
              <div className="flex items-center gap-2">
                <Badge>{item.source}</Badge>
                <Badge className={item.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}>
                  {item.ready ? "ready" : "needs work"}
                </Badge>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
