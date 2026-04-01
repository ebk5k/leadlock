import Link from "next/link";
import { ArrowRight, CalendarCheck2, LayoutPanelTop, PhoneIncoming, Workflow } from "lucide-react";

import { MockBrowserFrame } from "@/components/marketing/mock-browser-frame";
import { SectionShell } from "@/components/marketing/section-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const previewSteps = [
  {
    icon: LayoutPanelTop,
    title: "Premium first impression",
    description: "Visitors land on a site that feels current, clear, and more expensive than the usual local option."
  },
  {
    icon: PhoneIncoming,
    title: "Lead capture and call handling",
    description: "Forms and calls feed into one system instead of disappearing into disconnected tools."
  },
  {
    icon: CalendarCheck2,
    title: "Booking momentum",
    description: "The path from inquiry to appointment stays visible and easier to act on."
  },
  {
    icon: Workflow,
    title: "Follow-through",
    description: "Your team sees what happened, what matters, and what should happen next."
  }
];

export function DemoPreviewSection() {
  return (
    <SectionShell className="bg-[linear-gradient(180deg,rgba(7,10,18,0.96),rgba(10,16,31,0.92))]">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Demo Preview"
            title="This is what the system feels like when the website, calls, and booking flow are finally connected."
            description="Instead of selling isolated features, the page shows a cleaner business system working together."
          />
          <div className="premium-panel-strong rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Suggested CTA path</p>
                <p className="mt-1 text-sm text-slate-300">Primary action: watch the demo. Secondary action: preview booking.</p>
              </div>
              <Badge className="border-primary/30 bg-primary/10 text-slate-100">Sales-ready</Badge>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className={cn(buttonVariants({ size: "lg" }), "w-full justify-center sm:w-auto")} href="/demo">
                Watch the Demo
              </Link>
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full justify-center sm:w-auto")}
                href="/book"
              >
                Preview Booking Flow
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Leads captured", value: "128", helper: "Saved from web forms and tracked in one dashboard" },
              { label: "Calls handled", value: "31", helper: "Answered, missed, and voicemail activity all logged" },
              { label: "Bookings created", value: "44", helper: "From inquiry to appointment with a cleaner path" },
              { label: "Recoveries triggered", value: "19", helper: "Missed calls and cold leads nudged automatically" }
            ].map((item) => (
              <Card className="rounded-3xl p-4 shadow-none" key={item.label}>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.helper}</p>
              </Card>
            ))}
          </div>
        </div>

        <MockBrowserFrame
          title="LeadLock live preview"
          subtitle="Placeholder UI for the public product walkthrough"
          className=""
        >
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {previewSteps.slice(0, 2).map((step) => (
                <Card className="rounded-3xl p-5 shadow-none" key={step.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/16 text-sky-300">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                </Card>
              ))}
            </div>
              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(14,20,36,1),rgba(10,14,28,0.96))] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">System timeline</p>
                  <p className="text-xs text-slate-500">Mock UI for the demo page</p>
                </div>
                <Badge className="bg-white/8 text-white">Preview</Badge>
              </div>
              <div className="mt-5 grid gap-3">
                {previewSteps.slice(2).map((step, index) => (
                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 sm:grid-cols-[auto_1fr]" key={step.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Step {index + 3}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{step.description}</p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
              <Card className="rounded-3xl p-5 shadow-none">
                <p className="text-sm font-semibold text-white">What owners understand quickly</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  This is not a pitch for a prettier homepage alone. It is a demo of a system that
                  captures demand, handles calls, creates bookings, tracks payments, and recovers
                  missed opportunities.
                </p>
              </Card>
            </div>
          </MockBrowserFrame>
        </div>
    </SectionShell>
  );
}
