import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "premium-panel rounded-[28px] text-card-foreground transition duration-300 hover:border-white/12 hover:shadow-[0_28px_90px_rgba(0,0,0,0.46)]",
        className
      )}
      {...props}
    />
  );
}
