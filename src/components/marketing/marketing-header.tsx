"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Logo } from "@/components/branding/logo";
import { Container } from "@/components/shared/container";
import { buttonVariants } from "@/components/ui/button";
import { marketingNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(8,10,18,0.72)] backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {marketingNav.map((item) => (
            <Link
              className={cn(
                "text-sm font-medium text-slate-400 transition hover:text-white",
                pathname === item.href && "text-white"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link className="hidden text-sm font-medium text-slate-400 md:inline-flex" href="/login">
            Client Login
          </Link>
          <Link
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 px-[1.05rem] text-[12px] font-medium leading-none tracking-[0.015em] md:h-9 md:px-4 md:text-[13px] md:font-semibold md:tracking-normal"
            )}
            href="/demo"
          >
            See Demo
          </Link>
          <button
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white md:hidden"
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </Container>
    </header>
  );
}
