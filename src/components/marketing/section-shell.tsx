import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

export function SectionShell({
  children,
  className,
  containerClassName
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section className={cn("premium-section relative py-18 sm:py-24", className)}>
      <div className="pointer-events-none absolute inset-0 premium-grid opacity-[0.08]" />
      <div className="premium-glow-orb pointer-events-none absolute left-[10%] top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(84,124,255,0.22),transparent_70%)]" />
      <div className="premium-glow-orb pointer-events-none absolute bottom-0 right-[8%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(120,92,255,0.18),transparent_70%)]" />
      <Container className={cn("relative z-10", containerClassName)}>{children}</Container>
    </section>
  );
}
