import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SectionShell } from "@/components/marketing/section-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ctaPoints = [
  "Look more established than nearby competitors",
  "Capture calls and leads with a clearer response system",
  "Make booking feel easier for the customer"
];

export function FinalCtaSection() {
  return (
    <SectionShell className="pt-6">
      <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_58%,_#0f766e_100%)] px-5 py-8 text-white shadow-card sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <Badge className="bg-white/10 text-white">CTA</Badge>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                If your website made you look like the premium option, more of the right customers would call.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                LeadLock is built to upgrade the first impression and connect it to a system that helps
                your business capture, respond, and book with less friction.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "w-full justify-center sm:w-auto")}
                href="/demo"
              >
                See the Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  "w-full justify-center border border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                )}
                href="/book"
              >
                Preview Booking Flow
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {ctaPoints.map((item) => (
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4" key={item}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-white/85">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
