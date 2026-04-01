import { Card } from "@/components/ui/card";

export function DetailField({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-none">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p> : null}
    </Card>
  );
}
