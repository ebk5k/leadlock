import Link from "next/link";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "$299",
    description: "Ideal for owner-operators launching a lead capture site and dashboard."
  },
  {
    name: "Growth",
    price: "$599",
    description: "Adds deeper reporting visibility and a more active receptionist workflow."
  }
];

export default function PricingPage() {
  return (
    <section className="py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Simple MVP pricing"
          title="Pricing that keeps the first version easy to explain."
          description="This page is intentionally lightweight and sales-friendly. Billing remains out of scope for the MVP build."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {tiers.map((tier) => (
            <Card className="p-6" key={tier.name}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{tier.name}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {tier.price}
                <span className="text-base text-muted-foreground">/mo</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
              <Link className={cn(buttonVariants(), "mt-6 inline-flex")} href="/demo">
                Talk Through Setup
              </Link>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
