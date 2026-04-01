import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { resolveActiveBusinessContext, resolveAuthorizedSessionContext } from "@/lib/business-context";
import { settingsService } from "@/lib/services/settings-service";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [settings, activeBusinessContext, authorizedSessionContext] = await Promise.all([
    settingsService.getSettings(),
    resolveActiveBusinessContext(),
    resolveAuthorizedSessionContext()
  ]);

  return (
    <AppShell
      activeBusiness={activeBusinessContext.businessClient}
      availableBusinesses={authorizedSessionContext.allowedBusinessClients}
      onboardingCompleted={settings.onboardingCompleted}
    >
      {children}
    </AppShell>
  );
}
