import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { BookingForm } from "@/features/marketing/booking-form";
import { settingsService } from "@/lib/services/settings-service";

export default async function BookPage() {
  const settings = await settingsService.getSettings();

  return (
    <section className="py-14 sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Live configuration"
            title="Preview the booking experience."
            description="This booking flow now reads persisted services and pricing defaults from the LeadLock settings layer."
          />
          <Card className="p-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Initial booking scope:</p>
              <ul className="space-y-2">
                <li>Collect service and timing details</li>
                <li>Use saved services from the business settings</li>
                <li>Use default pricing and messaging templates behind the scenes</li>
              </ul>
            </div>
          </Card>
        </div>
        <Card className="p-6 sm:p-8">
          <BookingForm services={settings.services} />
        </Card>
      </Container>
    </section>
  );
}
