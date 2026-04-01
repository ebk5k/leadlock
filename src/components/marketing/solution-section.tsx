import { CalendarDays, LayoutPanelTop, PhoneCall, ScanSearch } from "lucide-react";

import { SectionShell } from "@/components/marketing/section-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const solutions = [
  {
    icon: LayoutPanelTop,
    title: "A premium public-facing website",
    description: "Sharper design, clearer service positioning, and stronger CTA hierarchy that helps you look like the better option."
  },
  {
    icon: PhoneCall,
    title: "Call and lead capture flow",
    description: "The system is designed so calls and inquiries feel like part of one operating workflow, not disconnected events."
  },
  {
    icon: CalendarDays,
    title: "Booking-ready experience",
    description: "The path from interest to scheduled job feels simpler, faster, and more trustworthy for the customer."
  },
  {
    icon: ScanSearch,
    title: "Visibility into what happens next",
    description: "Mock UI previews show how the business can see summaries, appointments, and activity in one place."
  }
];

export function SolutionSection() {
  return (
    <SectionShell className="bg-[linear-gradient(180deg,rgba(7,10,18,0.92),rgba(9,13,25,0.9))]">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Solution"
          title="LeadLock installs a cleaner system around the website, not just a prettier homepage."
          description="The website becomes the premium front door, while the supporting experience helps capture leads, answer calls, and move people toward booked work."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {solutions.map((solution) => (
            <Card className="rounded-3xl p-6" key={solution.title}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/16 text-sky-300">
                  <solution.icon className="h-5 w-5" />
                </div>
                <Badge className="bg-white/8 text-slate-200">System layer</Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{solution.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{solution.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
