import { Container } from "@/components/shared/container";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "LeadLock gives us a cleaner path from ad click to booked estimate. Our team sees exactly what to do next.",
    author: "Mia Torres",
    role: "Owner, BrightLine Plumbing"
  },
  {
    quote:
      "The dashboard feels made for operators. Calls, bookings, and follow-ups finally live in one workflow.",
    author: "Andre Wilson",
    role: "GM, Metro Comfort HVAC"
  }
];

export function TestimonialStrip() {
  return (
    <section className="pb-16 sm:pb-20">
      <Container className="grid gap-4 lg:grid-cols-2">
        {testimonials.map((item) => (
          <Card className="bg-slate-950 p-6 text-white" key={item.author}>
            <p className="text-lg leading-8">“{item.quote}”</p>
            <div className="mt-6">
              <p className="font-semibold">{item.author}</p>
              <p className="text-sm text-white/70">{item.role}</p>
            </div>
          </Card>
        ))}
      </Container>
    </section>
  );
}

