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
    <SectionShell className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] pb-18 pt-12 sm:pb-24 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <Badge className="bg-primary/10 px-4 py-2 text-primary">
              Premium website + automated lead capture system
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Most local business websites look outdated. We built this to make you look like the
                premium option in your area.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                We don&apos;t just build websites. We install a system that helps capture leads,
                answer calls, and book jobs automatically, so your business looks stronger and moves
                faster from the first click.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
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
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-white/85 p-4" key={point}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-slate-700">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-8 hidden h-32 w-32 rounded-full bg-primary/10 blur-3xl sm:block" />
          <MockBrowserFrame
            title="LeadLock customer experience"
            subtitle="A premium front-end presentation for local service businesses"
            className="relative bg-white"
          >
            <div className="grid gap-4">
              <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Landing page snapshot</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      Emergency plumbing, done with the confidence of a premium brand.
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Sparkles className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {heroProofPoints.map((item) => (
                    <div className="rounded-2xl bg-white/8 p-4" key={item.label}>
                      <p className="text-xs text-white/55">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-3xl bg-slate-50 p-5 shadow-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">AI call handling</p>
                      <p className="text-xs text-muted-foreground">Mock receptionist handoff</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Incoming call from Angela</p>
                        <p className="text-xs text-muted-foreground">Burst pipe, same-day request</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-slate-50 p-4" key={item}>
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
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
