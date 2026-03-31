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
    <SectionShell className="bg-slate-50/70">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Demo Preview"
            title="This is what the system feels like when the website, calls, and booking flow are finally connected."
            description="Instead of selling isolated features, the page shows a cleaner business system working together."
          />
          <div className="rounded-[2rem] border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">Suggested CTA path</p>
                <p className="mt-1 text-sm text-muted-foreground">Primary action: watch the demo. Secondary action: preview booking.</p>
              </div>
              <Badge className="bg-primary/10 text-primary">Sales-ready</Badge>
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
        </div>

        <MockBrowserFrame
          title="LeadLock live preview"
          subtitle="Placeholder UI for the public product walkthrough"
          className="bg-white"
        >
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {previewSteps.slice(0, 2).map((step) => (
                <Card className="rounded-3xl p-5 shadow-none" key={step.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </Card>
              ))}
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">System timeline</p>
                  <p className="text-xs text-white/60">Mock UI for the demo page</p>
                </div>
                <Badge className="bg-white/10 text-white">Preview</Badge>
              </div>
              <div className="mt-5 grid gap-3">
                {previewSteps.slice(2).map((step, index) => (
                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[auto_1fr]" key={step.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Step {index + 3}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MockBrowserFrame>
      </div>
    </SectionShell>
  );
}
