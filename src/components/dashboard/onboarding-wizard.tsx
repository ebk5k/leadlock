"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SettingsFormCard } from "@/components/dashboard/settings-form-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getSettingsFormValues,
  getSettingsPayload,
  type SettingsFormValues
} from "@/lib/settings/form";
import { cn } from "@/lib/utils";
import type { BusinessSettings } from "@/types/domain";

const steps = [
  {
    key: "business",
    title: "Business profile",
    description: "Capture the basics LeadLock should show across booking, payments, and messaging."
  },
  {
    key: "operations",
    title: "Services and hours",
    description: "Define what you offer and when your team is available."
  },
  {
    key: "automation",
    title: "Pricing and messages",
    description: "Set defaults the system can use for confirmations, reminders, and payment requests."
  }
] as const;

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-950">{label}</label>
      {children}
    </div>
  );
}

export function OnboardingWizard({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsFormValues>(getSettingsFormValues(settings));

  const isLastStep = stepIndex === steps.length - 1;
  const step = steps[stepIndex];
  const completionLabel = useMemo(() => `${stepIndex + 1} of ${steps.length}`, [stepIndex]);

  async function saveOnboarding() {
    setErrorMessage(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          getSettingsPayload(form, {
            onboardingCompleted: true,
            onboardingCompletedAt: settings.onboardingCompletedAt
          })
        )
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to save onboarding.");
      }

      startTransition(() => {
        router.push("/app");
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save onboarding.");
    }
  }

  function nextStep() {
    if (isLastStep) {
      void saveOnboarding();
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Setup Wizard
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{step.title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{step.description}</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Step {completionLabel}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map((wizardStep, index) => (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm transition",
                index === stepIndex
                  ? "border-slate-950 bg-slate-950 text-white"
                  : index < stepIndex
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border bg-slate-50 text-muted-foreground"
              )}
              key={wizardStep.key}
            >
              <p className="font-semibold">{wizardStep.title}</p>
              <p className={cn("mt-1 text-xs", index === stepIndex ? "text-white/70" : "text-inherit")}>
                {wizardStep.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {step.key === "business" ? (
        <SettingsFormCard
          title="Business profile"
          description="These details appear throughout the client-facing parts of LeadLock."
        >
          <Field label="Business name">
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, businessName: event.target.value }))
              }
              value={form.businessName}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business phone">
              <Input
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessPhone: event.target.value }))
                }
                value={form.businessPhone}
              />
            </Field>
            <Field label="Business email">
              <Input
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessEmail: event.target.value }))
                }
                type="email"
                value={form.businessEmail}
              />
            </Field>
          </div>
        </SettingsFormCard>
      ) : null}

      {step.key === "operations" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <SettingsFormCard
            title="Services"
            description="Use one line per service so the booking form can surface a clean list."
          >
            <Field label="Services">
              <Textarea
                onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))}
                placeholder={`Emergency Plumbing
Drain Cleaning
Water Heater Repair`}
                value={form.services}
              />
            </Field>
          </SettingsFormCard>
          <SettingsFormCard
            title="Working hours"
            description="Keep this simple for MVP. Later we can expand this into structured availability."
          >
            <Field label="Working hours">
              <Textarea
                onChange={(event) =>
                  setForm((current) => ({ ...current, workingHours: event.target.value }))
                }
                placeholder={`Mon-Fri: 7:00 AM - 6:00 PM
Sat: 8:00 AM - 2:00 PM`}
                value={form.workingHours}
              />
            </Field>
          </SettingsFormCard>
        </div>
      ) : null}

      {step.key === "automation" ? (
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <SettingsFormCard
            title="Pricing defaults"
            description="These values power new payment requests when an appointment is created."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default job price (cents)">
                <Input
                  min="0"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, defaultJobPriceCents: event.target.value }))
                  }
                  type="number"
                  value={form.defaultJobPriceCents}
                />
              </Field>
              <Field label="Currency">
                <Input
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currency: event.target.value }))
                  }
                  value={form.currency}
                />
              </Field>
            </div>
          </SettingsFormCard>

          <SettingsFormCard
            title="Messaging templates"
            description="Simple templates the system uses for confirmations now and reminders next."
          >
            <Field label="Confirmation message template">
              <Textarea
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    confirmationMessageTemplate: event.target.value
                  }))
                }
                value={form.confirmationMessageTemplate}
              />
            </Field>
            <Field label="Reminder message template">
              <Textarea
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reminderMessageTemplate: event.target.value
                  }))
                }
                value={form.reminderMessageTemplate}
              />
            </Field>
          </SettingsFormCard>

          <SettingsFormCard
            title="Launch readiness overrides"
            description="If a provider cannot be auto-detected yet, mark it here so install delivery still has a clean readiness checkpoint."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Calendar provider ready">
                <Select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      calendarProviderConfigured: event.target.value
                    }))
                  }
                  value={form.calendarProviderConfigured}
                >
                  <option value="not_ready">Not ready</option>
                  <option value="ready">Ready</option>
                </Select>
              </Field>
              <Field label="Payment provider ready">
                <Select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentProviderConfigured: event.target.value
                    }))
                  }
                  value={form.paymentProviderConfigured}
                >
                  <option value="not_ready">Not ready</option>
                  <option value="ready">Ready</option>
                </Select>
              </Field>
            </div>
          </SettingsFormCard>

          <SettingsFormCard
            title="Internal delivery checks"
            description="These are lightweight manual completion flags for install verification and launch signoff."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone / AI receptionist verified">
                <Select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phoneAiReceptionistVerified: event.target.value
                    }))
                  }
                  value={form.phoneAiReceptionistVerified}
                >
                  <option value="not_ready">Not ready</option>
                  <option value="ready">Ready</option>
                </Select>
              </Field>
              <Field label="Test booking verified">
                <Select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testBookingVerified: event.target.value
                    }))
                  }
                  value={form.testBookingVerified}
                >
                  <option value="not_ready">Not ready</option>
                  <option value="ready">Ready</option>
                </Select>
              </Field>
              <Field label="Test payment verified">
                <Select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testPaymentVerified: event.target.value
                    }))
                  }
                  value={form.testPaymentVerified}
                >
                  <option value="not_ready">Not ready</option>
                  <option value="ready">Ready</option>
                </Select>
              </Field>
              <Field label="Launch approved">
                <Select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      launchApproved: event.target.value
                    }))
                  }
                  value={form.launchApproved}
                >
                  <option value="not_ready">Not ready</option>
                  <option value="ready">Ready</option>
                </Select>
              </Field>
            </div>
          </SettingsFormCard>
        </div>
      ) : null}

      {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {settings.onboardingCompleted
            ? "This setup is already complete. Saving here will update the existing configuration."
            : "Complete the final step to mark setup finished and unlock the full dashboard flow."}
        </p>
        <div className="flex gap-3">
          <Button disabled={isPending || stepIndex === 0} onClick={previousStep} type="button" variant="outline">
            Back
          </Button>
          <Button disabled={isPending} onClick={nextStep} type="button">
            {isPending ? "Saving..." : isLastStep ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
