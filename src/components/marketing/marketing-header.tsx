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
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {marketingNav.map((item) => (
            <Link
              className={cn(
                "text-sm font-medium text-muted-foreground transition hover:text-foreground",
                pathname === item.href && "text-foreground"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link className="hidden text-sm font-medium text-muted-foreground md:inline-flex" href="/login">
            Client Login
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href="/demo">
            See Demo
          </Link>
          <button
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden"
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </Container>
    </header>
  );
}
