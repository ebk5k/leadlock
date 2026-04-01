import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SectionShell } from "@/components/marketing/section-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const offerPoints = [
  "A premium-looking local business website that feels current on mobile",
  "A mock lead, call, and booking flow that demonstrates the system concept",
  "A cleaner branded experience that makes your business feel more established"
];

export function OfferSection() {
  return (
    <SectionShell>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Offer"
            title="This is for local businesses that are good at the work but tired of looking average online."
            description="LeadLock is positioned as a premium option: a stronger website, clearer CTA flow, and a system story that feels more valuable than a basic brochure site."
          />
          <Link className={cn(buttonVariants({ size: "lg" }), "w-full justify-center sm:w-auto")} href="/demo">
            Watch the Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <Card className="premium-panel-strong rounded-[2rem] p-6 text-white sm:p-8">
          <h3 className="text-xl font-semibold text-white">What LeadLock is really offering</h3>
          <div className="mt-5 space-y-4">
            {offerPoints.map((point) => (
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4" key={point}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <p className="text-sm leading-6 text-slate-200">{point}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SectionShell>
  );
}
