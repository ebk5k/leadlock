import Link from "next/link";
import { ArrowRight, CheckCircle2, PhoneCall, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MockBrowserFrame } from "@/components/marketing/mock-browser-frame";
import { SectionShell } from "@/components/marketing/section-shell";

const trustPoints = [
  "Designed for service businesses that need to look expensive and trustworthy",
  "Built to capture leads, answer calls, and move people toward booking",
  "Mobile-first layouts that look polished in every local search click"
];

const heroProofPoints = [
  { label: "Leads captured", value: "128" },
  { label: "Calls handled", value: "31" },
  { label: "Bookings created", value: "44" },
  { label: "Payments tracked", value: "22" }
];

export function HeroSection() {
  return (
    <SectionShell className="overflow-hidden pb-18 pt-12 sm:pb-24 sm:pt-18">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <Badge className="border-primary/30 bg-primary/12 px-4 py-2 text-white">
              Premium website + operating system for local service growth
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-7xl">
                Most local business websites look outdated. We built this to make you look like the
                premium option in your area.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                We don&apos;t just build websites. We install a system that helps capture leads,
                answer calls, and book jobs automatically, so your business looks stronger and moves
                faster from the first click.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                The demo story is simple: more leads captured, more calls handled, more bookings created,
                clearer payment tracking, and fewer missed opportunities slipping away.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={cn(buttonVariants({ size: "lg" }), "w-full justify-center sm:w-auto")} href="/demo">
              See the Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full justify-center sm:w-auto")}
              href="/book"
            >
              Preview Booking Flow
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div className="premium-panel flex items-start gap-3 rounded-[24px] p-4" key={point}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <p className="text-sm leading-6 text-slate-300">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-8 hidden h-32 w-32 rounded-full bg-primary/25 blur-3xl sm:block" />
          <MockBrowserFrame
            title="LeadLock customer experience"
            subtitle="A premium front-end presentation for local service businesses"
            className="relative"
          >
            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(10,15,28,0.92))] p-5 text-white shadow-[0_28px_70px_rgba(0,0,0,0.34)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Landing page snapshot</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Emergency plumbing, done with the confidence of a premium brand.
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <Sparkles className="h-5 w-5 text-sky-300" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {heroProofPoints.map((item) => (
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur" key={item.label}>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-3xl p-5 shadow-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">AI call handling</p>
                      <p className="text-xs text-slate-400">Mock receptionist handoff</p>
                    </div>
                    <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">Active</Badge>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/18 text-sky-300">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Incoming call from Angela</p>
                        <p className="text-xs text-slate-400">Burst pipe, same-day request</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      The site looks premium, the call is captured, and the next step is already queued
                      for the team.
                    </p>
                  </div>
                </Card>

                <div className="space-y-3">
                  {[
                    "Looks more established than the average local competitor",
                    "Turns traffic into a cleaner booking and follow-up flow",
                    "Gives prospects a faster reason to trust you"
                  ].map((item) => (
                    <div className="premium-panel flex items-start gap-3 rounded-2xl p-4" key={item}>
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MockBrowserFrame>
        </div>
      </div>
    </SectionShell>
  );
}
