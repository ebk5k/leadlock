import Link from "next/link";
import { ArrowRight, CalendarDays, PhoneCall, ReceiptText, Wrench, Workflow } from "lucide-react";

import { MockBrowserFrame } from "@/components/marketing/mock-browser-frame";
import { SectionShell } from "@/components/marketing/section-shell";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoForm } from "@/features/marketing/demo-form";
import { cn } from "@/lib/utils";

const demoMoments = [
  {
    title: "Premium homepage impression",
    description: "Show how the business immediately looks more credible and more expensive than nearby competitors.",
    icon: Workflow
  },
  {
    title: "Calls and lead capture",
    description: "Walk through how calls and inquiries can feed into one clear operating system.",
    icon: PhoneCall
  },
  {
    title: "Booking flow",
    description: "Preview how the path from inquiry to appointment stays cleaner and easier to understand.",
    icon: CalendarDays
  }
];

const demoProofPoints = [
  { label: "Leads captured", value: "128", icon: Workflow },
  { label: "Calls handled", value: "31", icon: PhoneCall },
  { label: "Bookings created", value: "44", icon: CalendarDays },
  { label: "Payments tracked", value: "22", icon: ReceiptText },
  { label: "Jobs completed", value: "17", icon: Wrench },
  { label: "Recovery automations", value: "19", icon: Workflow }
];

export default function DemoPage() {
  return (
    <main className="bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]">
      <SectionShell className="pb-10 pt-12 sm:pb-14 sm:pt-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-6">
            <Badge className="bg-primary/10 px-4 py-2 text-primary">LeadLock Demo</Badge>
            <SectionHeading
              title="See how LeadLock makes a local business look premium and operate with more confidence."
              description="This demo page is still mock-powered, but it is designed to sell the experience clearly: stronger website, cleaner call handling, and a better path to booked jobs."
            />
            <div className="rounded-[2rem] border border-border bg-white p-5 shadow-card sm:p-6">
              <p className="text-sm font-semibold text-slate-950">What the walkthrough covers</p>
              <div className="mt-4 grid gap-3">
                {demoMoments.map((item) => (
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4" key={item.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-white p-5 shadow-card sm:p-6">
              <p className="text-sm font-semibold text-slate-950">What an owner should understand in under 90 seconds</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "LeadLock captures new demand instead of letting it leak out of the website.",
                  "Calls, bookings, payments, and jobs now read like one operating system.",
                  "Missed calls and quiet leads can trigger recovery follow-up automatically.",
                  "The dashboard gives an owner a quick story they can actually act on."
                ].map((item) => (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <MockBrowserFrame
            title="Demo walkthrough preview"
            subtitle="Placeholder product visuals for the sales story"
            className="bg-white"
          >
            <div className="grid gap-4">
              <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Service business snapshot</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      Better presentation on the front end. Better follow-through after the click.
                    </h3>
                  </div>
                  <Badge className="bg-white/10 text-white">Mock</Badge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {demoProofPoints.map((item) => (
                  <Card className="rounded-3xl p-4 shadow-none" key={item.label}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <item.icon className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.16em]">{item.label}</p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                  </Card>
                ))}
              </div>
              <Card className="rounded-3xl bg-slate-50 p-5 shadow-none">
                <p className="text-sm font-semibold text-slate-950">What people are buying</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  They are not buying a prettier layout by itself. They are buying a stronger first
                  impression and a system that makes the business feel more responsive, more organized,
                  and easier to trust.
                </p>
              </Card>
            </div>
          </MockBrowserFrame>
        </div>
      </SectionShell>

      <section className="pb-16 sm:pb-24">
        <Container className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <Card className="rounded-[2rem] p-6 sm:p-8">
            <SectionHeading
              eyebrow="Request the walkthrough"
              title="Tell us about your business and we’ll show you the LeadLock experience."
              description="The form submission is local and mocked for now, but the page flow is ready for a real sales/demo handoff later."
            />
            <div className="mt-6">
              <DemoForm />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-[2rem] bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Why this converts</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                The page makes the offer feel bigger than “just a website.”
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                A local business owner should leave the page thinking: this makes us look stronger,
                helps us respond better, gives us a cleaner path to booked jobs, and shows us what is
                happening after the lead comes in.
              </p>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "mt-6 inline-flex w-full justify-center sm:w-auto"
                )}
                href="/"
              >
                Back to Homepage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Card>
            <Card className="rounded-[2rem] p-6">
              <p className="text-sm font-semibold text-slate-950">Best talking points after the demo</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                The natural follow-up is a tailored setup conversation around lead capture, call handling,
                booking flow, and where missed revenue is slipping away today.
              </p>
            </Card>
          </div>
        </Container>
      </section>
    </main>
  );
}
