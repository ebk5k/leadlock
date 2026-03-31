import { businessSettings } from "@/lib/mock-data/settings";
import { messagingService } from "@/lib/services/messaging-service";
import type { BusinessSettings, FollowUpEvent } from "@/types/domain";

export interface SettingsService {
  getSettings(): Promise<BusinessSettings>;
  getFollowUps(): Promise<FollowUpEvent[]>;
}

export const settingsService: SettingsService = {
  async getSettings() {
    return Promise.resolve(businessSettings);
  },
  async getFollowUps() {
    return messagingService.getFollowUps();
  }
};
