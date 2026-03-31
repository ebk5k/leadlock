import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsField } from "@/components/dashboard/settings-field";
import { SettingsFormCard } from "@/components/dashboard/settings-form-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { settingsService } from "@/lib/services/settings-service";

export default async function SettingsPage() {
  const settings = await settingsService.getSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Form-style MVP settings powered by mock data only, with no live integrations yet."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SettingsFormCard
          title="Business hours"
          description="The schedule the receptionist and booking flow should reference."
        >
          {settings.businessHours.map((hours, index) => (
            <SettingsField key={hours} label={`Hours block ${index + 1}`} value={hours} />
          ))}
        </SettingsFormCard>
        <SettingsFormCard
          title="Services"
          description="Core services shown in the booking and lead capture experience."
        >
          {settings.services.map((service, index) => (
            <SettingsField key={service} label={`Service ${index + 1}`} value={service} />
          ))}
        </SettingsFormCard>
        <SettingsFormCard
          title="AI script notes"
          description="Internal notes for how the system should speak, route calls, and position urgency."
        >
          <SettingsField label="Script notes" value={settings.aiScriptNotes} multiline />
          <SettingsField label="Receptionist tone" value={settings.receptionistTone} />
        </SettingsFormCard>
        <Card className="rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Automation status</h2>
              <p className="mt-1 text-sm text-muted-foreground">Still mock-only in the MVP, but organized like a real settings panel.</p>
            </div>
            <Badge>{settings.followUpEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <div className="mt-5 grid gap-4">
            <SettingsField label="Business name" value={settings.businessName} />
            <SettingsField label="Owner" value={settings.ownerName} />
            <SettingsField label="Phone" value={settings.phone} />
            <SettingsField label="Email" value={settings.email} />
            <SettingsField label="Timezone" value={settings.timezone} />
          </div>
        </Card>
      </div>
    </div>
  );
}
