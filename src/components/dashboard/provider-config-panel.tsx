"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SettingsFormCard } from "@/components/dashboard/settings-form-card";
import type { ProviderConfigView, ProviderIntegrationKind, ProviderVerification } from "@/types/domain";

interface ProviderFormState {
  providerName: string;
  status: "active" | "inactive";
  config: Record<string, string>;
  secrets: Record<string, string>;
}

const PROVIDER_COPY: Record<
  ProviderIntegrationKind,
  {
    title: string;
    description: string;
    providerOptions: Array<{ value: string; label: string }>;
    configFields: Array<{ key: string; label: string; placeholder?: string }>;
    secretFields: Array<{ key: string; label: string; placeholder?: string }>;
  }
> = {
  payments: {
    title: "Payments",
    description: "Configure how this business collects payments and how Stripe webhook trust is resolved.",
    providerOptions: [
      { value: "mock", label: "Mock" },
      { value: "stripe", label: "Stripe" }
    ],
    configFields: [],
    secretFields: [
      { key: "secretKey", label: "Secret key", placeholder: "sk_live_..." },
      { key: "webhookSecret", label: "Webhook secret", placeholder: "whsec_..." }
    ]
  },
  calendar: {
    title: "Calendar",
    description: "Control appointment sync provider settings for the active business workspace.",
    providerOptions: [
      { value: "mock", label: "Mock" },
      { value: "google", label: "Google Calendar" }
    ],
    configFields: [
      { key: "calendarId", label: "Calendar ID", placeholder: "primary" },
      { key: "clientId", label: "Client ID" },
      { key: "timeZone", label: "Time zone", placeholder: "America/Los_Angeles" }
    ],
    secretFields: [
      { key: "clientSecret", label: "Client secret" },
      { key: "refreshToken", label: "Refresh token" }
    ]
  },
  messaging: {
    title: "Messaging",
    description: "Choose how confirmations and recovery automations send for this business.",
    providerOptions: [{ value: "mock", label: "Mock" }],
    configFields: [],
    secretFields: []
  },
  receptionist: {
    title: "Receptionist / webhook trust",
    description: "Manage webhook verification for inbound call ingestion on this business.",
    providerOptions: [{ value: "webhook", label: "Webhook" }],
    configFields: [],
    secretFields: [{ key: "webhookSecret", label: "Webhook secret", placeholder: "change-me" }]
  }
};

function buildInitialState(providerConfigs: ProviderConfigView[]) {
  return Object.fromEntries(
    providerConfigs.map((config) => [
      config.integrationKind,
      {
        providerName: config.providerName,
        status: config.status,
        config: config.config,
        secrets: Object.fromEntries(Object.keys(config.secretPresence).map((key) => [key, ""]))
      }
    ])
  ) as Record<ProviderIntegrationKind, ProviderFormState>;
}

function formatVerificationLabel(verification: ProviderVerification) {
  switch (verification.status) {
    case "passed":
      return "Verified";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Pending";
  }
}

export function ProviderConfigPanel({
  providerConfigs,
  providerVerifications
}: {
  providerConfigs: ProviderConfigView[];
  providerVerifications: ProviderVerification[];
}) {
  const router = useRouter();
  const [formState, setFormState] = useState(() => buildInitialState(providerConfigs));
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingKind, setSavingKind] = useState<ProviderIntegrationKind | null>(null);
  const [testingKind, setTestingKind] = useState<ProviderIntegrationKind | null>(null);

  const providerSummary = useMemo(() => {
    const configured = providerConfigs.filter((config) => config.isConfigured).length;
    const verified = providerVerifications.filter((verification) => verification.status === "passed").length;

    return {
      configured,
      verified,
      total: providerConfigs.length
    };
  }, [providerConfigs, providerVerifications]);

  function updateState(
    integrationKind: ProviderIntegrationKind,
    updater: (current: ProviderFormState) => ProviderFormState
  ) {
    setFormState((current) => ({
      ...current,
      [integrationKind]: updater(current[integrationKind])
    }));
  }

  async function handleSave(integrationKind: ProviderIntegrationKind) {
    setErrorMessage(null);
    setSavingKind(integrationKind);

    const nextState = formState[integrationKind];

    try {
      const response = await fetch("/api/provider-configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          integrationKind,
          providerName: nextState.providerName,
          status: nextState.status,
          config: nextState.config,
          secrets: nextState.secrets
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to save provider config.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save provider config.");
    } finally {
      setSavingKind(null);
    }
  }

  async function handleRunTest(integrationKind: ProviderIntegrationKind) {
    setErrorMessage(null);
    setTestingKind(integrationKind);

    try {
      const response = await fetch("/api/provider-verifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ integrationKind })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to run provider verification.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to run provider verification.");
    } finally {
      setTestingKind(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="premium-panel-strong flex flex-col gap-3 rounded-3xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Provider install settings</p>
          <p className="text-sm text-slate-300">
            Business-scoped integration config and install verification for the active workspace. Fallback
            values still work until an override is saved here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={providerSummary.configured === providerSummary.total ? "bg-emerald-100 text-emerald-700" : ""}>
            {providerSummary.configured}/{providerSummary.total} configured
          </Badge>
          <Badge className={providerSummary.verified === providerSummary.total ? "bg-emerald-100 text-emerald-700" : ""}>
            {providerSummary.verified}/{providerSummary.total} verified
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {providerConfigs.map((providerConfig) => {
          const copy = PROVIDER_COPY[providerConfig.integrationKind];
          const state = formState[providerConfig.integrationKind];
          const verification =
            providerVerifications.find((item) => item.integrationKind === providerConfig.integrationKind) ?? null;

          return (
            <SettingsFormCard
              key={providerConfig.integrationKind}
              title={copy.title}
              description={copy.description}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={providerConfig.isConfigured ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200" : "border-amber-400/20 bg-amber-500/15 text-amber-200"}>
                  {providerConfig.isConfigured ? "Configured" : "Needs setup"}
                </Badge>
                <Badge
                  className={
                    verification?.status === "passed"
                      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                      : verification?.status === "failed"
                        ? "border-red-400/20 bg-red-500/15 text-red-200"
                        : "border-white/10 bg-white/6 text-slate-200"
                  }
                >
                  {verification ? formatVerificationLabel(verification) : "Pending"}
                </Badge>
                <Badge>{providerConfig.source === "business" ? "Business-scoped" : "Fallback/default"}</Badge>
                <Badge>{providerConfig.status}</Badge>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {verification?.summary ?? "No verification has been run yet."}
                    </p>
                    <p className="text-sm text-slate-300">
                      {verification?.details ??
                        "Run a provider test to record install verification for this business."}
                    </p>
                  </div>
                  <Button
                    disabled={isPending || testingKind === providerConfig.integrationKind}
                    onClick={() => handleRunTest(providerConfig.integrationKind)}
                    type="button"
                    variant="outline"
                  >
                    {testingKind === providerConfig.integrationKind ? "Running test..." : "Run test"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>
                    Last checked:{" "}
                    {verification?.lastCheckedAt
                      ? new Date(verification.lastCheckedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })
                      : "Never"}
                  </span>
                  <span>Check type: {verification?.mode === "live" ? "Live" : "Config validation"}</span>
                  {verification?.checkedByEmail ? <span>Checked by: {verification.checkedByEmail}</span> : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">Provider</label>
                  <Select
                    onChange={(event) =>
                      updateState(providerConfig.integrationKind, (current) => ({
                        ...current,
                        providerName: event.target.value
                      }))
                    }
                    value={state.providerName}
                  >
                    {copy.providerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">Status</label>
                  <Select
                    onChange={(event) =>
                      updateState(providerConfig.integrationKind, (current) => ({
                        ...current,
                        status: event.target.value === "inactive" ? "inactive" : "active"
                      }))
                    }
                    value={state.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              {copy.configFields.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {copy.configFields.map((field) => (
                    <div className="space-y-2" key={field.key}>
                      <label className="text-sm font-medium text-slate-100">{field.label}</label>
                      <Input
                        onChange={(event) =>
                          updateState(providerConfig.integrationKind, (current) => ({
                            ...current,
                            config: {
                              ...current.config,
                              [field.key]: event.target.value
                            }
                          }))
                        }
                        placeholder={field.placeholder}
                        value={state.config[field.key] ?? ""}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {copy.secretFields.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {copy.secretFields.map((field) => (
                    <div className="space-y-2" key={field.key}>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-medium text-slate-100">{field.label}</label>
                        <span className="text-xs text-slate-400">
                          {providerConfig.secretPresence[field.key] ? "Saved" : "Not saved"}
                        </span>
                      </div>
                      <Input
                        onChange={(event) =>
                          updateState(providerConfig.integrationKind, (current) => ({
                            ...current,
                            secrets: {
                              ...current.secrets,
                              [field.key]: event.target.value
                            }
                          }))
                        }
                        placeholder={field.placeholder ?? "Leave blank to keep existing value"}
                        type="password"
                        value={state.secrets[field.key] ?? ""}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-xs text-slate-400">
                  {providerConfig.hasBusinessOverride
                    ? "Business override is saved and will be used before fallback config."
                    : "No business override saved yet. This workspace is still using fallback/default config."}
                </p>
                <Button
                  disabled={isPending || savingKind === providerConfig.integrationKind}
                  onClick={() => handleSave(providerConfig.integrationKind)}
                  type="button"
                >
                  {savingKind === providerConfig.integrationKind ? "Saving..." : "Save provider settings"}
                </Button>
              </div>
            </SettingsFormCard>
          );
        })}
      </div>

      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
    </div>
  );
}
