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
    <Card className="rounded-2xl border border-border bg-slate-50/80 p-4 shadow-none">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
    </Card>
  );
}

