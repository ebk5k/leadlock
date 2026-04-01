"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftDashed } from "lucide-react";

import { Logo } from "@/components/branding/logo";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { dashboardNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import type { BusinessClient } from "@/types/domain";

export function AppShell({
  activeBusiness,
  availableBusinesses,
  children,
  onboardingCompleted
}: {
  activeBusiness: BusinessClient;
  availableBusinesses: BusinessClient[];
  children: ReactNode;
  onboardingCompleted: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switchingBusiness, setSwitchingBusiness] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.push("/login");
    router.refresh();
  }

  async function handleBusinessSwitch(nextBusinessId: string) {
    if (!nextBusinessId || nextBusinessId === activeBusiness.id) {
      return;
    }

    setSwitchingBusiness(true);

    try {
      const response = await fetch("/api/auth/switch-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId: nextBusinessId })
      });

      if (!response.ok) {
        return;
      }

      router.refresh();
    } finally {
      setSwitchingBusiness(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pointer-events-none fixed inset-0 premium-grid opacity-[0.08]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(84,124,255,0.18),transparent_45%),radial-gradient(circle_at_75%_0%,rgba(120,92,255,0.16),transparent_35%)]" />
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(7,10,18,0.82)] backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-slate-300">
                Workspace: {activeBusiness.name}
              </div>
              {availableBusinesses.length > 1 ? (
                <Select
                  className="h-10 w-[220px] rounded-full px-3 text-xs"
                  disabled={switchingBusiness}
                  onChange={(event) => handleBusinessSwitch(event.target.value)}
                  value={activeBusiness.id}
                >
                  {availableBusinesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </Select>
              ) : null}
            </div>
            <div className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-slate-300 md:block">
              Demo account: demo@leadlock.app
            </div>
            <Button onClick={handleLogout} size="sm" variant="outline">
              Log Out
            </Button>
          </div>
        </Container>
        {!onboardingCompleted ? (
          <Container className="pb-3">
            <div className="flex flex-col gap-3 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Finish business setup</p>
                <p className="text-amber-100/80">
                  Complete onboarding to set services, working hours, pricing, and default message templates.
                </p>
              </div>
              {pathname !== "/app/onboarding" ? (
                <Link
                  className="text-sm font-semibold text-amber-50 underline-offset-4 hover:underline"
                  href="/app/onboarding"
                >
                  Open setup wizard
                </Link>
              ) : null}
            </div>
          </Container>
        ) : null}
        <Container className="pb-3 md:hidden">
          <div className="premium-panel flex flex-col gap-2 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Active workspace
                </p>
                <p className="text-sm font-semibold text-white">{activeBusiness.name}</p>
              </div>
              <Badge>{activeBusiness.status}</Badge>
            </div>
            {availableBusinesses.length > 1 ? (
              <Select
                disabled={switchingBusiness}
                onChange={(event) => handleBusinessSwitch(event.target.value)}
                value={activeBusiness.id}
              >
                {availableBusinesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>
        </Container>
        <Container className="pb-3 lg:hidden">
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {dashboardNav.map((item) => (
              <Link
                className={cn(
                  "whitespace-nowrap rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-400 transition",
                  pathname === item.href && "border-primary/30 bg-primary/18 text-white"
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
      <Container className="relative z-10 grid gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="premium-panel-strong hidden rounded-3xl p-4 lg:block">
          <div className="border-b border-white/10 px-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/16 text-sky-300">
                <PanelLeftDashed className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Client workspace</p>
                <p className="text-xs text-slate-400">Operations, bookings, and follow-through</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {dashboardNav.map((item) => (
              <Link
                className={cn(
                  "mt-3 flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-white/8 hover:bg-white/6 hover:text-white",
                  pathname === item.href && "border-primary/20 bg-[linear-gradient(135deg,rgba(84,124,255,0.22),rgba(120,92,255,0.18))] text-white hover:text-white"
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
