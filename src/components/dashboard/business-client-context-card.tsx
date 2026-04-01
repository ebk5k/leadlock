import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BusinessClient } from "@/types/domain";

export function BusinessClientContextCard({
  businessClient
}: {
  businessClient: BusinessClient;
}) {
  return (
    <Card className="rounded-3xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Client foundation</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            This MVP still runs as a single business, but settings and launch data now attach to a
            real client record so deeper tenant isolation can expand later without rewriting the
            core setup flow.
          </p>
        </div>
        <Badge className={businessClient.status === "active" ? "bg-emerald-100 text-emerald-700" : ""}>
          {businessClient.status}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Client ID</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{businessClient.id}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Business</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{businessClient.name}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Created</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {new Date(businessClient.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </p>
        </div>
      </div>
    </Card>
  );
}
