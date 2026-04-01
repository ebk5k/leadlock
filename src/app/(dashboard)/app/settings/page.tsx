import { BusinessClientContextCard } from "@/components/dashboard/business-client-context-card";
import { InstallWorkflowPanel } from "@/components/dashboard/install-workflow-panel";
import { InstallChecklistPanel } from "@/components/dashboard/install-checklist-panel";
import { LaunchReadinessPanel } from "@/components/dashboard/launch-readiness-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProviderConfigPanel } from "@/components/dashboard/provider-config-panel";
import { SettingsEditor } from "@/components/dashboard/settings-editor";
import { buttonVariants } from "@/components/ui/button";
import { settingsService } from "@/lib/services/settings-service";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function SettingsPage() {
  const [
    settings,
    readiness,
    checklist,
    businessClient,
    providerConfigs,
    providerVerifications,
    installWorkflow
  ] = await Promise.all([
    settingsService.getSettings(),
    settingsService.getLaunchReadiness(),
    settingsService.getInstallChecklist(),
    settingsService.getBusinessClient(),
    settingsService.getProviderConfigs(),
    settingsService.getProviderVerifications(),
    settingsService.getInstallWorkflow()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Business-critical configuration, install controls, and integration status presented as one premium operator surface."
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
      <InstallWorkflowPanel workflow={installWorkflow} />
      <ProviderConfigPanel providerConfigs={providerConfigs} providerVerifications={providerVerifications} />
      <SettingsEditor settings={settings} />
    </div>
  );
}
