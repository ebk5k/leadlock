import { businessSettings } from "@/lib/mock-data/settings";
import { followUps } from "@/lib/mock-data/follow-ups";
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
    return Promise.resolve(followUps);
  }
};

