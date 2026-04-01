import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { settingsService } from "@/lib/services/settings-service";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const settings = await settingsService.getSettings();

  return <AppShell onboardingCompleted={settings.onboardingCompleted}>{children}</AppShell>;
}
