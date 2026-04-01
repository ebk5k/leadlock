import { analyticsService } from "@/lib/services/analytics-service";

describe("mock service contracts", () => {
  it("returns analytics snapshot", async () => {
    const analytics = await analyticsService.getSnapshot();
    expect(analytics.totalLeads).toBeGreaterThan(0);
  });
});
