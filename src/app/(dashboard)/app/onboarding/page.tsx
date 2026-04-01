import { InstallChecklistPanel } from "@/components/dashboard/install-checklist-panel";
import { LaunchReadinessPanel } from "@/components/dashboard/launch-readiness-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { settingsService } from "@/lib/services/settings-service";

export default async function OnboardingPage() {
  const [settings, readiness, checklist] = await Promise.all([
    settingsService.getSettings(),
    settingsService.getLaunchReadiness(),
    settingsService.getInstallChecklist()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Setup"
        title="Business onboarding"
        description="Walk through the core setup once, or revisit it anytime to update your business details, services, hours, pricing, message templates, launch readiness, and internal delivery checkpoints."
      />
      <LaunchReadinessPanel readiness={readiness} />
      <InstallChecklistPanel checklist={checklist} />
      <OnboardingWizard settings={settings} />
    </div>
  );
}
