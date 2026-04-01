import { resolveActiveBusinessContext, resolveAuthorizedSessionContext } from "@/lib/business-context";
import { getPersistenceAdapter } from "@/lib/data/adapter";
import {
  listBusinessProviderConfigViews,
  resolveBusinessProviderConfigSync
} from "@/lib/providers/config";
import type { ProviderIntegrationKind, ProviderVerification, ProviderVerificationMode, ProviderVerificationStatus } from "@/types/domain";

function getPersistedVerification(
  businessId: string,
  integrationKind: ProviderIntegrationKind
): ProviderVerification | null {
  return getPersistenceAdapter().providers.findProviderVerification(businessId, integrationKind);
}

function buildPendingVerification(
  businessId: string,
  integrationKind: ProviderIntegrationKind
): ProviderVerification {
  return {
    id: `${businessId}:${integrationKind}:pending`,
    businessId,
    integrationKind,
    status: "pending",
    mode: "config_validation",
    summary: "No verification has been run yet.",
    details: "Run a provider test to capture install verification for this business."
  };
}

function buildVerificationResult(input: {
  businessId: string;
  integrationKind: ProviderIntegrationKind;
  status: ProviderVerificationStatus;
  summary: string;
  details: string;
}) {
  return {
    id: `${input.businessId}:${input.integrationKind}`,
    businessId: input.businessId,
    integrationKind: input.integrationKind,
    status: input.status,
    mode: "config_validation" as ProviderVerificationMode,
    summary: input.summary,
    details: input.details
  };
}

function verifyResolvedProviderConfig(input: {
  businessId: string;
  integrationKind: ProviderIntegrationKind;
}) {
  const config = resolveBusinessProviderConfigSync(input);

  if (config.status === "inactive") {
    return buildVerificationResult({
      businessId: input.businessId,
      integrationKind: input.integrationKind,
      status: "failed",
      summary: "Provider is inactive.",
      details: "Activate this provider before verification can pass."
    });
  }

  switch (input.integrationKind) {
    case "payments":
      if (config.providerName === "mock") {
        return buildVerificationResult({
          businessId: input.businessId,
          integrationKind: input.integrationKind,
          status: "passed",
          summary: "Mock payments are active.",
          details: "Configuration-only verification passed. No live Stripe gateway test was run."
        });
      }

      if (config.providerName === "stripe") {
        const missing = [
          !config.secrets.secretKey ? "secret key" : null,
          !config.secrets.webhookSecret ? "webhook secret" : null
        ].filter(Boolean);

        return missing.length === 0
          ? buildVerificationResult({
              businessId: input.businessId,
              integrationKind: input.integrationKind,
              status: "passed",
              summary: "Stripe credentials are present.",
              details: "Configuration-only verification passed. LeadLock confirmed the Stripe secret key and webhook secret are saved for this business."
            })
          : buildVerificationResult({
              businessId: input.businessId,
              integrationKind: input.integrationKind,
              status: "failed",
              summary: "Stripe configuration is incomplete.",
              details: `Missing required Stripe values: ${missing.join(", ")}.`
            });
      }

      return buildVerificationResult({
        businessId: input.businessId,
        integrationKind: input.integrationKind,
        status: "failed",
        summary: "Unsupported payment provider.",
        details: `LeadLock does not yet support verification for provider "${config.providerName}".`
      });
    case "calendar":
      if (config.providerName === "mock") {
        return buildVerificationResult({
          businessId: input.businessId,
          integrationKind: input.integrationKind,
          status: "passed",
          summary: "Mock calendar sync is active.",
          details: "Configuration-only verification passed. No live calendar event check was run."
        });
      }

      if (config.providerName === "google") {
        const missing = [
          !config.config.calendarId ? "calendar id" : null,
          !config.config.clientId ? "client id" : null,
          !config.secrets.clientSecret ? "client secret" : null,
          !config.secrets.refreshToken ? "refresh token" : null
        ].filter(Boolean);

        return missing.length === 0
          ? buildVerificationResult({
              businessId: input.businessId,
              integrationKind: input.integrationKind,
              status: "passed",
              summary: "Google Calendar credentials are present.",
              details: "Configuration-only verification passed. LeadLock confirmed the required Google Calendar values are saved for this business."
            })
          : buildVerificationResult({
              businessId: input.businessId,
              integrationKind: input.integrationKind,
              status: "failed",
              summary: "Google Calendar configuration is incomplete.",
              details: `Missing required Google Calendar values: ${missing.join(", ")}.`
            });
      }

      return buildVerificationResult({
        businessId: input.businessId,
        integrationKind: input.integrationKind,
        status: "failed",
        summary: "Unsupported calendar provider.",
        details: `LeadLock does not yet support verification for provider "${config.providerName}".`
      });
    case "messaging":
      if (config.providerName === "mock") {
        return buildVerificationResult({
          businessId: input.businessId,
          integrationKind: input.integrationKind,
          status: "passed",
          summary: "Mock messaging is active.",
          details: "Configuration-only verification passed. Outbound sends remain simulated for this business."
        });
      }

      return buildVerificationResult({
        businessId: input.businessId,
        integrationKind: input.integrationKind,
        status: "failed",
        summary: "Unsupported messaging provider.",
        details: `LeadLock does not yet support verification for provider "${config.providerName}".`
      });
    case "receptionist":
    default:
      if (config.providerName === "webhook") {
        return config.secrets.webhookSecret
          ? buildVerificationResult({
              businessId: input.businessId,
              integrationKind: input.integrationKind,
              status: "passed",
              summary: "Webhook trust secret is saved.",
              details: "Configuration-only verification passed. LeadLock confirmed the receptionist webhook secret is saved for this business."
            })
          : buildVerificationResult({
              businessId: input.businessId,
              integrationKind: input.integrationKind,
              status: "failed",
              summary: "Webhook trust secret is missing.",
              details: "Add a webhook secret before inbound receptionist events can be trusted for this business."
            });
      }

      return buildVerificationResult({
        businessId: input.businessId,
        integrationKind: input.integrationKind,
        status: "failed",
        summary: "Unsupported receptionist provider.",
        details: `LeadLock does not yet support verification for provider "${config.providerName}".`
      });
  }
}

function persistVerification(input: ProviderVerification) {
  const authorizedContextPromise = resolveAuthorizedSessionContext();

  return authorizedContextPromise.then((authorizedContext) => {
    const checkedBy = authorizedContext.session?.user;
    const now = new Date().toISOString();

    getPersistenceAdapter().providers.upsertProviderVerification({
      verification: input,
      checkedByUserId: checkedBy?.id,
      checkedByEmail: checkedBy?.email,
      checkedAt: now
    });

    return {
      ...input,
      lastCheckedAt: now,
      checkedByUserId: checkedBy?.id,
      checkedByEmail: checkedBy?.email
    } satisfies ProviderVerification;
  });
}

export function hasPassedProviderVerificationSync(
  businessId: string,
  integrationKind: ProviderIntegrationKind
) {
  const verification = getPersistedVerification(businessId, integrationKind);
  return verification?.status === "passed";
}

export interface ProviderVerificationService {
  getProviderVerifications(): Promise<ProviderVerification[]>;
  getProviderVerificationsForBusiness(businessId: string): Promise<ProviderVerification[]>;
  runVerification(integrationKind: ProviderIntegrationKind): Promise<ProviderVerification>;
}

export const providerVerificationService: ProviderVerificationService = {
  async getProviderVerifications() {
    const businessContext = await resolveActiveBusinessContext();
    return this.getProviderVerificationsForBusiness(businessContext.businessId);
  },
  async getProviderVerificationsForBusiness(businessId) {
    const providerConfigs = await listBusinessProviderConfigViews(businessId);

    return providerConfigs.map(
      (providerConfig) =>
        getPersistedVerification(businessId, providerConfig.integrationKind) ??
        buildPendingVerification(businessId, providerConfig.integrationKind)
    );
  },
  async runVerification(integrationKind) {
    const businessContext = await resolveActiveBusinessContext();
    const result = verifyResolvedProviderConfig({
      businessId: businessContext.businessId,
      integrationKind
    });

    return persistVerification(result);
  }
};
