import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="premium-kicker text-xs font-semibold">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
      </div>
      {action}
    </div>
  );
}
