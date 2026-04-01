import { AlertTriangle, Clock3, MousePointerClick } from "lucide-react";

import { SectionShell } from "@/components/marketing/section-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";

const problems = [
  {
    icon: MousePointerClick,
    title: "The first impression feels cheap",
    description: "Most local sites look outdated, so visitors assume the business itself is average before they ever call."
  },
  {
    icon: AlertTriangle,
    title: "Leads arrive with no structure",
    description: "Calls, forms, and messages come in, but the follow-up path feels fragmented and easy to miss."
  },
  {
    icon: Clock3,
    title: "Booking happens too slowly",
    description: "People are ready to hire now, but old websites and weak handoffs create hesitation and delay."
  }
];

export function ProblemSection() {
  return (
    <SectionShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Problem"
          title="Most local service websites undersell good businesses."
          description="The issue usually is not the quality of the service. It is the presentation, the response flow, and the friction between inquiry and booking."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {problems.map((problem) => (
            <Card className="rounded-3xl p-6" key={problem.title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
                <problem.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{problem.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{problem.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
