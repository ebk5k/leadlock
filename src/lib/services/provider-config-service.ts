import { resolveActiveBusinessContext } from "@/lib/business-context";
import {
  listBusinessProviderConfigViews,
  upsertBusinessProviderConfig
} from "@/lib/providers/config";
import type { ProviderConfigView, ProviderIntegrationKind } from "@/types/domain";

export interface ProviderConfigService {
  getProviderConfigs(): Promise<ProviderConfigView[]>;
  getProviderConfigsForBusiness(businessId: string): Promise<ProviderConfigView[]>;
  updateProviderConfig(input: {
    integrationKind: ProviderIntegrationKind;
    providerName: string;
    status: "active" | "inactive";
    config?: Record<string, unknown>;
    secrets?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<ProviderConfigView>;
}

export const providerConfigService: ProviderConfigService = {
  async getProviderConfigs() {
    const businessContext = await resolveActiveBusinessContext();
    return this.getProviderConfigsForBusiness(businessContext.businessId);
  },
  async getProviderConfigsForBusiness(businessId) {
    return listBusinessProviderConfigViews(businessId);
  },
  async updateProviderConfig(input) {
    const businessContext = await resolveActiveBusinessContext();

    await upsertBusinessProviderConfig({
      businessId: businessContext.businessId,
      integrationKind: input.integrationKind,
      providerName: input.providerName,
      status: input.status,
      config: input.config,
      secrets: input.secrets,
      metadata: input.metadata
    });

    const providerConfigs = await listBusinessProviderConfigViews(businessContext.businessId);
    const updated = providerConfigs.find((config) => config.integrationKind === input.integrationKind);

    if (!updated) {
      throw new Error("Updated provider config could not be loaded.");
    }

    return updated;
  }
};
