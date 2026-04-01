import { BusinessClientContextCard } from "@/components/dashboard/business-client-context-card";
import { InstallChecklistPanel } from "@/components/dashboard/install-checklist-panel";
import { LaunchReadinessPanel } from "@/components/dashboard/launch-readiness-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsEditor } from "@/components/dashboard/settings-editor";
import { buttonVariants } from "@/components/ui/button";
import { settingsService } from "@/lib/services/settings-service";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function SettingsPage() {
  const [settings, readiness, checklist, businessClient] = await Promise.all([
    settingsService.getSettings(),
    settingsService.getLaunchReadiness(),
    settingsService.getInstallChecklist(),
    settingsService.getBusinessClient()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Persistent system configuration for pricing, services, working hours, and messaging templates."
        action={
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/app/onboarding"
          >
            Open setup wizard
          </Link>
        }
      />
      <BusinessClientContextCard businessClient={businessClient} />
      <LaunchReadinessPanel readiness={readiness} showSetupLink />
      <InstallChecklistPanel checklist={checklist} />
      <SettingsEditor settings={settings} />
    </div>
  );
}
