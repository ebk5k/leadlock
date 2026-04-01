"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SettingsFormCard } from "@/components/dashboard/settings-form-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSettingsFormValues, getSettingsPayload } from "@/lib/settings/form";
import type { BusinessSettings } from "@/types/domain";

export function SettingsEditor({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState(getSettingsFormValues(settings));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(getSettingsPayload(form, settings))
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to save settings.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save settings.");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {settings.onboardingCompleted ? "Setup is complete" : "Setup wizard still needs to be finished"}
          </p>
          <p className="text-sm text-muted-foreground">
            Use onboarding for a guided business setup flow or update these values directly here.
          </p>
        </div>
        <Link className="text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/app/onboarding">
          Open setup wizard
        </Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SettingsFormCard
          title="Business profile"
          description="Core info the system should use in bookings, follow-up messaging, and payment setup."
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-950">Business name</label>
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, businessName: event.target.value }))
              }
              value={form.businessName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Business phone</label>
              <Input
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessPhone: event.target.value }))
                }
                value={form.businessPhone}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Business email</label>
              <Input
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessEmail: event.target.value }))
                }
                type="email"
                value={form.businessEmail}
              />
            </div>
          </div>
        </SettingsFormCard>

        <SettingsFormCard
          title="Pricing and services"
          description="These values feed the booking experience and payment defaults."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Default job price (cents)</label>
              <Input
                min="0"
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultJobPriceCents: event.target.value }))
                }
                type="number"
                value={form.defaultJobPriceCents}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Currency</label>
              <Input
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                value={form.currency}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-950">Services</label>
            <Textarea
              onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))}
              placeholder="One service per line"
              value={form.services}
            />
          </div>
        </SettingsFormCard>

        <SettingsFormCard
          title="Working hours"
          description="Simple text blocks the system can show in onboarding, booking, and later automation."
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-950">Working hours</label>
            <Textarea
              onChange={(event) =>
                setForm((current) => ({ ...current, workingHours: event.target.value }))
              }
              placeholder="One hours block per line"
              value={form.workingHours}
            />
          </div>
        </SettingsFormCard>

        <SettingsFormCard
          title="Messaging templates"
          description="Simple templates used for confirmations now and reminders later."
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-950">Confirmation template</label>
            <Textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmationMessageTemplate: event.target.value
                }))
              }
              value={form.confirmationMessageTemplate}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-950">Reminder template</label>
            <Textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reminderMessageTemplate: event.target.value
                }))
              }
              value={form.reminderMessageTemplate}
            />
          </div>
        </SettingsFormCard>

        <SettingsFormCard
          title="Launch readiness overrides"
          description="Use these only when provider readiness cannot be auto-detected yet. This keeps install delivery practical for MVP."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Calendar provider ready</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Payment provider ready</label>
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
            </div>
          </div>
        </SettingsFormCard>

        <SettingsFormCard
          title="Internal install checklist"
          description="Manual completion flags for the internal delivery SOP when automation cannot verify a step yet."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Phone / AI receptionist verified</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Test booking verified</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Test payment verified</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-950">Launch approved</label>
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
            </div>
          </div>
        </SettingsFormCard>
      </div>

      {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
