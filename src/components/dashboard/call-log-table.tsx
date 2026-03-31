import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { CallLog } from "@/types/domain";

export function CallLogTable({ calls }: { calls: CallLog[] }) {
  return (
    <>
      <table className="hidden min-w-full text-sm md:table">
        <thead className="bg-slate-50 text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Caller</th>
            <th className="px-5 py-3">Number</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Outcome</th>
            <th className="px-5 py-3">Summary</th>
            <th className="px-5 py-3">Transcript preview</th>
            <th className="px-5 py-3">When</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr className="border-t border-border align-top" key={call.id}>
              <td className="px-5 py-4 font-medium text-slate-950">{call.callerName}</td>
              <td className="px-5 py-4 text-muted-foreground">{call.callerNumber ?? "Unavailable"}</td>
              <td className="px-5 py-4">
                <Badge>{call.callStatus}</Badge>
              </td>
              <td className="px-5 py-4">
                <Badge>{call.outcome}</Badge>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{call.summary}</td>
              <td className="px-5 py-4 text-muted-foreground">{call.transcriptPreview}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatDateTime(call.timestamp)} • {call.durationMinutes} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-3 p-4 md:hidden">
        {calls.map((call) => (
          <Card className="rounded-2xl border border-border p-4 shadow-none" key={call.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{call.callerName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{call.callerNumber ?? "Unavailable"}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge>{call.callStatus}</Badge>
                <Badge>{call.outcome}</Badge>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{call.summary}</p>
            <div className="mt-3 rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Transcript preview
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{call.transcriptPreview}</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatDateTime(call.timestamp)} • {call.durationMinutes} min
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
