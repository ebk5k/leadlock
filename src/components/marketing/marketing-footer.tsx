import Link from "next/link";

import { Container } from "@/components/shared/container";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <Container className="flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">LeadLock</p>
          <p>Customer acquisition and automation for local businesses.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/demo">Demo</Link>
          <Link href="/book">Book</Link>
          <Link href="/login">Login</Link>
        </div>
      </Container>
    </footer>
  );
}

