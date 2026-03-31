import {
  ArrowRight,
  CalendarClock,
  Headphones,
  LayoutPanelTop,
  LineChart,
  MessageSquareMore,
  Sparkles
} from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const problems = [
  "Traffic lands on generic pages that do not convert well on mobile.",
  "Leads slip between calls, forms, callbacks, and appointment coordination.",
  "Owners lack one simple view of pipeline, activity, and booking performance."
];

const solutions = [
  {
    title: "Landing pages built to convert",
    description: "Clear service messaging, stronger CTA placement, and a faster path to inquiry.",
    icon: LayoutPanelTop
  },
  {
    title: "Receptionist-aware lead capture",
    description: "Calls, summaries, and handoffs feed into the same business workflow.",
    icon: Headphones
  },
  {
    title: "Booking and follow-up visibility",
    description: "Appointments and next actions stay visible instead of getting buried in separate tools.",
    icon: CalendarClock
  },
  {
    title: "Simple operational analytics",
    description: "Operators can quickly see what is working without digging through complex reports.",
    icon: LineChart
  }
];

export function ProblemSolutionSection() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Why LeadLock exists"
          title="Most local service businesses do not need more tools. They need one cleaner system."
          description="LeadLock is designed to remove the friction between acquisition, response, booking, and follow-through."
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
            <Badge className="bg-white/10 text-white">Common friction</Badge>
            <div className="mt-6 space-y-4">
              {problems.map((problem, index) => (
                <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4" key={problem}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-white/80">{problem}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <MessageSquareMore className="h-5 w-5 text-emerald-300" />
              <p className="text-sm text-white/75">
                When the front-end experience is stronger, the dashboard becomes a force multiplier instead
                of a cleanup tool.
              </p>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {solutions.map((solution) => (
              <Card className="p-6" key={solution.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <solution.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{solution.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{solution.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Built to feel premium on mobile and desktop
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-border bg-slate-50 p-5 sm:grid-cols-3 sm:p-6">
          {[
            { label: "More clarity", value: "Clear CTA path from first view to booking" },
            { label: "Less clutter", value: "One modern brand with separated public and private contexts" },
            { label: "Faster response", value: "Lead activity surfaces where operators can act quickly" }
          ].map((item) => (
            <div className="flex items-start gap-3" key={item.label}>
              <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
