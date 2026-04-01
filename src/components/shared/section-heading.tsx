import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="premium-section flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="premium-kicker text-xs font-semibold">{eyebrow}</p>
        ) : null}
        <div className="space-y-3">
          <h2 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}
