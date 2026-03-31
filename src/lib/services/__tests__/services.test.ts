import { analyticsService } from "@/lib/services/analytics-service";
import { appointmentService } from "@/lib/services/appointment-service";
import { leadService } from "@/lib/services/lead-service";
import { receptionistService } from "@/lib/services/receptionist-service";
import { settingsService } from "@/lib/services/settings-service";

describe("mock service contracts", () => {
  it("returns leads", async () => {
    const leads = await leadService.getLeads();
    expect(leads.length).toBeGreaterThan(0);
  });

  it("returns appointments", async () => {
    const appointments = await appointmentService.getAppointments();
    expect(appointments.length).toBeGreaterThan(0);
  });

  it("returns analytics snapshot", async () => {
    const analytics = await analyticsService.getSnapshot();
    expect(analytics.totalLeads).toBeGreaterThan(0);
  });

  it("returns receptionist data", async () => {
    const calls = await receptionistService.getCalls();
    const interactions = await receptionistService.getInteractions();
    expect(calls.length).toBeGreaterThan(0);
    expect(interactions.length).toBeGreaterThan(0);
  });

  it("returns settings and follow-up data", async () => {
    const settings = await settingsService.getSettings();
    const followUps = await settingsService.getFollowUps();
    expect(settings.businessName).toContain("LeadLock");
    expect(followUps.length).toBeGreaterThan(0);
  });
});

