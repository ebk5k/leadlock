import { getPersistenceAdapter } from "@/lib/data/adapter";
import { resolveActiveBusinessId } from "@/lib/business-context";
import { businessSettings as seededSettings } from "@/lib/mock-data/settings";
import type {
  BusinessProviderConfig,
  ProviderIntegrationKind,
  ProviderConfigSource,
  ProviderConfigView,
  ResolvedBusinessProviderConfig
} from "@/types/domain";

export const PROVIDER_INTEGRATION_KINDS: ProviderIntegrationKind[] = ["payments", "calendar", "messaging", "receptionist"];

function getDefaultBusinessId() {
  return getPersistenceAdapter().business.getDefaultBusinessClient().id ?? seededSettings.businessId;
}

function buildGlobalFallbackConfig(
  businessId: string,
  integrationKind: ProviderIntegrationKind
): ResolvedBusinessProviderConfig {
  const now = new Date(0).toISOString();

  switch (integrationKind) {
    case "payments":
      return {
        id: `global:${businessId}:payments`,
        businessId,
        integrationKind,
        providerName: process.env.PAYMENT_PROVIDER ?? "mock",
        status: "active",
        config: {},
        secrets: {
          secretKey: process.env.STRIPE_SECRET_KEY ?? "",
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? ""
        },
        metadata: {},
        createdAt: now,
        updatedAt: now,
        source: "global"
      };
    case "calendar":
      return {
        id: `global:${businessId}:calendar`,
        businessId,
        integrationKind,
        providerName: process.env.CALENDAR_PROVIDER ?? "mock",
        status: "active",
        config: {
          calendarId: process.env.GOOGLE_CALENDAR_ID ?? "",
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE ?? "America/Los_Angeles"
        },
        secrets: {
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? ""
        },
        metadata: {},
        createdAt: now,
        updatedAt: now,
        source: "global"
      };
    case "messaging":
      return {
        id: `global:${businessId}:messaging`,
        businessId,
        integrationKind,
        providerName: process.env.MESSAGING_PROVIDER ?? "mock",
        status: "active",
        config: {},
        secrets: {},
        metadata: {},
        createdAt: now,
        updatedAt: now,
        source: "global"
      };
    case "receptionist":
    default: {
      const receptionistProvider = process.env.RECEPTIONIST_PROVIDER ?? "webhook";
      const receptionistSecrets: Record<string, string> =
        receptionistProvider === "retell"
          ? { apiKey: process.env.RETELL_API_KEY ?? "" }
          : { webhookSecret: process.env.CALL_WEBHOOK_SECRET ?? "" };
      return {
        id: `global:${businessId}:receptionist`,
        businessId,
        integrationKind,
        providerName: receptionistProvider,
        status: "active",
        config: {},
        secrets: receptionistSecrets,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        source: "global"
      };
    }
  }
}

function findBusinessProviderConfigRow(businessId: string, integrationKind: ProviderIntegrationKind) {
  return getPersistenceAdapter().providers.findProviderConfig(businessId, integrationKind);
}

export function findPersistedBusinessProviderConfig(
  businessId: string,
  integrationKind: ProviderIntegrationKind
) {
  return findBusinessProviderConfigRow(businessId, integrationKind);
}

function hasConfiguredValues(config: BusinessProviderConfig) {
  return (
    Boolean(config.providerName.trim()) ||
    Object.keys(config.config).length > 0 ||
    Object.keys(config.secrets).length > 0 ||
    Object.keys(config.metadata).length > 0
  );
}

export async function resolveBusinessProviderConfig(input: {
  integrationKind: ProviderIntegrationKind;
  businessId?: string;
}) {
  const businessId = input.businessId ?? (await resolveActiveBusinessId());
  const persistedConfig = findBusinessProviderConfigRow(businessId, input.integrationKind);

  if (persistedConfig && hasConfiguredValues(persistedConfig)) {
    return {
      ...persistedConfig,
      source: "business" as ProviderConfigSource
    };
  }

  return buildGlobalFallbackConfig(businessId, input.integrationKind);
}

export function resolveBusinessProviderConfigSync(input: {
  integrationKind: ProviderIntegrationKind;
  businessId?: string;
}) {
  const businessId = input.businessId ?? getDefaultBusinessId();
  const persistedConfig = findBusinessProviderConfigRow(businessId, input.integrationKind);

  if (persistedConfig && hasConfiguredValues(persistedConfig)) {
    return {
      ...persistedConfig,
      source: "business" as ProviderConfigSource
    };
  }

  return buildGlobalFallbackConfig(businessId, input.integrationKind);
}

function buildSecretPresence(config: ResolvedBusinessProviderConfig) {
  return Object.fromEntries(
    Object.entries(config.secrets).map(([key, value]) => [key, Boolean(value && value.trim())])
  );
}

export async function listBusinessProviderConfigs(businessId?: string) {
  const resolvedBusinessId = businessId ?? (await resolveActiveBusinessId());

  return Promise.all(
    PROVIDER_INTEGRATION_KINDS.map((integrationKind) =>
      resolveBusinessProviderConfig({
        businessId: resolvedBusinessId,
        integrationKind
      })
    )
  );
}

export async function listBusinessProviderConfigViews(businessId?: string) {
  const resolvedBusinessId = businessId ?? (await resolveActiveBusinessId());
  const configs = await listBusinessProviderConfigs(resolvedBusinessId);

  return configs.map((config) => {
    const persistedConfig = findPersistedBusinessProviderConfig(resolvedBusinessId, config.integrationKind);

    const view: ProviderConfigView = {
      id: config.id,
      businessId: config.businessId,
      integrationKind: config.integrationKind,
      providerName: config.providerName,
      status: config.status,
      source: config.source,
      hasBusinessOverride: Boolean(persistedConfig),
      isConfigured: isBusinessProviderConfiguredSync({
        businessId: resolvedBusinessId,
        integrationKind: config.integrationKind
      }),
      config: config.config,
      metadata: config.metadata,
      secretPresence: buildSecretPresence(config),
      updatedAt: config.updatedAt
    };

    return view;
  });
}

function normalizeRecord(value: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .map(([key, recordValue]) => [key, String(recordValue ?? "").trim()])
      .filter(([, recordValue]) => recordValue.length > 0)
  ) as Record<string, string>;
}

export async function upsertBusinessProviderConfig(input: {
  integrationKind: ProviderIntegrationKind;
  businessId?: string;
  providerName: string;
  status: "active" | "inactive";
  config?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const businessId = input.businessId ?? (await resolveActiveBusinessId());
  const existing = findPersistedBusinessProviderConfig(businessId, input.integrationKind);
  const now = new Date().toISOString();
  const nextConfig = normalizeRecord(input.config);
  const nextMetadata = normalizeRecord(input.metadata);
  const nextSecretsInput = normalizeRecord(input.secrets);
  const mergedSecrets = {
    ...(existing?.secrets ?? {})
  };

  for (const [key, value] of Object.entries(nextSecretsInput)) {
    if (value.trim()) {
      mergedSecrets[key] = value;
    }
  }

  getPersistenceAdapter().providers.upsertProviderConfig({
    id: existing?.id ?? `${businessId}:${input.integrationKind}`,
    businessId,
    integrationKind: input.integrationKind,
    providerName: input.providerName.trim(),
    status: input.status,
    config: nextConfig,
    secrets: mergedSecrets,
    metadata: nextMetadata,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  });

  return resolveBusinessProviderConfig({
    businessId,
    integrationKind: input.integrationKind
  });
}

export async function resolveStripeWebhookSecret(businessId?: string) {
  const config = await resolveBusinessProviderConfig({
    businessId,
    integrationKind: "payments"
  });

  return config.secrets.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";
}

export async function resolveCallWebhookSecret(businessId?: string) {
  const config = await resolveBusinessProviderConfig({
    businessId,
    integrationKind: "receptionist"
  });

  return config.secrets.webhookSecret || process.env.CALL_WEBHOOK_SECRET || "";
}

export function isBusinessProviderConfiguredSync(input: {
  integrationKind: ProviderIntegrationKind;
  businessId?: string;
}) {
  const config = resolveBusinessProviderConfigSync(input);

  if (config.status === "inactive") {
    return false;
  }

  if (config.providerName === "mock") {
    return true;
  }

  if (input.integrationKind === "payments" && config.providerName === "stripe") {
    return Boolean(config.secrets.secretKey && config.secrets.webhookSecret);
  }

  if (input.integrationKind === "calendar" && config.providerName === "google") {
    return Boolean(
      config.config.calendarId &&
        config.config.clientId &&
        config.config.clientSecret &&
        config.config.refreshToken
    );
  }

  if (input.integrationKind === "messaging") {
    return Boolean(config.providerName);
  }

  if (input.integrationKind === "receptionist") {
    if (config.providerName === "webhook") {
      return Boolean(config.secrets.webhookSecret);
    }

    if (config.providerName === "retell") {
      return Boolean(config.secrets.apiKey);
    }

    return Boolean(config.providerName);
  }

  return false;
}
