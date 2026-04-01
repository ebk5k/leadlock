import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-white/10 bg-white/6 px-4 text-sm text-foreground outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur focus:border-primary focus:bg-white/8",
        className
      )}
      {...props}
    />
  );
}
