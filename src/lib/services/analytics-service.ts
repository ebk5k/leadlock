import { analyticsSnapshot } from "@/lib/mock-data/analytics";
import type { AnalyticsSnapshot } from "@/types/domain";

export interface AnalyticsService {
  getSnapshot(): Promise<AnalyticsSnapshot>;
}

export const analyticsService: AnalyticsService = {
  async getSnapshot() {
    return Promise.resolve(analyticsSnapshot);
  }
};

