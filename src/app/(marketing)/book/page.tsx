import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { BookingForm } from "@/features/marketing/booking-form";

export default function BookPage() {
  return (
    <section className="py-14 sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Mock scheduling"
            title="Preview the booking experience."
            description="This page simulates the customer scheduling flow. Real calendar writes and reminders remain stubbed for MVP speed."
          />
          <Card className="p-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Initial booking scope:</p>
              <ul className="space-y-2">
                <li>Collect service and timing details</li>
                <li>Confirm appointment in the UI</li>
                <li>Leave Google Calendar, Outlook, and SMS reminders stubbed</li>
              </ul>
            </div>
          </Card>
        </div>
        <Card className="p-6 sm:p-8">
          <BookingForm />
        </Card>
      </Container>
    </section>
  );
}

