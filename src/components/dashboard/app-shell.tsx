"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftDashed } from "lucide-react";

import { Logo } from "@/components/branding/logo";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-700 md:block">
              Demo account: demo@leadlock.app
            </div>
            <Button onClick={handleLogout} size="sm" variant="outline">
              Log Out
            </Button>
          </div>
        </Container>
        <Container className="pb-3 lg:hidden">
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {dashboardNav.map((item) => (
              <Link
                className={cn(
                  "whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition",
                  pathname === item.href && "border-slate-950 bg-slate-950 text-white"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      <Container className="grid gap-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden rounded-3xl border border-border bg-white p-4 lg:block">
          <div className="border-b border-border px-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PanelLeftDashed className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Client workspace</p>
                <p className="text-xs text-muted-foreground">Operations, bookings, and follow-through</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {dashboardNav.map((item) => (
              <Link
                className={cn(
                  "mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-slate-50 hover:text-foreground",
                  pathname === item.href && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {pathname === item.href ? <Badge className="bg-white/10 text-white">Live</Badge> : null}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="space-y-6">{children}</main>
      </Container>
    </div>
  );
}
