import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function SettingsFormCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-3xl p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  );
}
