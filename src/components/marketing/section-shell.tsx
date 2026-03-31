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
    <section className={cn("py-16 sm:py-24", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
