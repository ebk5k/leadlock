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
    <Card className={cn("premium-panel-strong overflow-hidden rounded-[2rem] border-white/10 bg-transparent", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 shadow-[0_0_12px_rgba(251,113,133,0.45)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.35)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        <Badge className="border-primary/30 bg-primary/12 text-slate-100">Mock UI</Badge>
      </div>
      <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 sm:p-5">
        {children}
      </div>
    </Card>
  );
}
