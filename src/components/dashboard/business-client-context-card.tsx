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
          <p className="text-sm font-semibold text-white">Client foundation</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
            This MVP still runs as a single business, but settings and launch data now attach to a
            real client record so deeper tenant isolation can expand later without rewriting the
            core setup flow.
          </p>
        </div>
        <Badge className={businessClient.status === "active" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : ""}>
          {businessClient.status}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client ID</p>
          <p className="mt-2 text-sm font-semibold text-white">{businessClient.id}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Business</p>
          <p className="mt-2 text-sm font-semibold text-white">{businessClient.name}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Created</p>
          <p className="mt-2 text-sm font-semibold text-white">
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
