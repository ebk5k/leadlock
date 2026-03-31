import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MockBrowserFrame({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden rounded-[2rem] border-white/70 bg-white/95", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary">Mock UI</Badge>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </Card>
  );
}
