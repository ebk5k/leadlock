import Link from "next/link";

import { Container } from "@/components/shared/container";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[rgba(7,10,18,0.82)]">
      <Container className="flex flex-col gap-4 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-white">LeadLock</p>
          <p>Customer acquisition and automation for local businesses.</p>
        </div>
        <div className="flex gap-4 text-slate-300">
          <Link href="/demo">Demo</Link>
          <Link href="/book">Book</Link>
          <Link href="/login">Login</Link>
        </div>
      </Container>
    </footer>
  );
}
