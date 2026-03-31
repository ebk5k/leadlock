import { BarChart3, CalendarDays, LayoutPanelTop, MessagesSquare, PhoneCall, Users } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "High-converting landing pages",
    description: "A fast public site built to turn local search traffic into booked appointments.",
    icon: LayoutPanelTop
  },
  {
    title: "Lead capture",
    description: "Track every inquiry across forms, calls, and receptionist activity in one queue.",
    icon: Users
  },
  {
    title: "Appointment management",
    description: "See upcoming jobs, confirmations, and scheduling gaps without digging through tools.",
    icon: CalendarDays
  },
  {
    title: "AI receptionist area",
    description: "Surface call summaries, intent detection, and handoff actions from mock service seams.",
    icon: PhoneCall
  },
  {
    title: "Follow-up logs",
    description: "Keep a clear record of callbacks, reminders, and touchpoints after first contact.",
    icon: MessagesSquare
  },
  {
    title: "Analytics",
    description: "Monitor lead flow, conversion, and booking volume with simple charts and KPI cards.",
    icon: BarChart3
  }
];

export function FeatureGrid() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-8">
        <SectionHeading
          eyebrow="One brand, two experiences"
          title="Built for acquisition on the front end and operations in the back office."
          description="LeadLock keeps the marketing site and private dashboard visually aligned while giving each environment a clear purpose."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Card className="p-6" key={feature.title}>
              <feature.icon className="h-9 w-9 text-primary" />
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

