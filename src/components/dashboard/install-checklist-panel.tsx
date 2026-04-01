import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { InstallChecklistSnapshot } from "@/types/domain";

export function InstallChecklistPanel({
  checklist
}: {
  checklist: InstallChecklistSnapshot;
}) {
  const completionPercent = Math.round((checklist.readyItems / checklist.totalItems) * 100);

  return (
    <Card className="rounded-3xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Internal install checklist</p>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            A lightweight delivery SOP for launch prep. Use automatic checks where possible and
            manual verification where the install team still needs a human checkpoint.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={completionPercent === 100 ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : ""}>
            {checklist.readyItems}/{checklist.totalItems} complete
          </Badge>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#7293ff,#7b5cff)] transition-all" style={{ width: `${completionPercent}%` }} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {checklist.items.map((item) => (
          <div className="rounded-2xl border border-white/10 bg-white/4 p-4" key={item.key}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <div className="flex items-center gap-2">
                <Badge>{item.source}</Badge>
                <Badge className={item.ready ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}>
                  {item.ready ? "complete" : "open"}
                </Badge>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
