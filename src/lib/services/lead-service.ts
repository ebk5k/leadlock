import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import type { Lead } from "@/types/domain";

export interface LeadService {
  getLeads(): Promise<Lead[]>;
  createLead(input: {
    name: string;
    business: string;
    email: string;
    phone: string;
  }): Promise<Lead>;
}

export const leadService: LeadService = {
  async getLeads() {
    noStore();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, name, business, email, phone, service, source, status, location, requested_at, value
          FROM leads
          ORDER BY datetime(requested_at) DESC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      business: row.business ? String(row.business) : undefined,
      email: row.email ? String(row.email) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      service: String(row.service),
      source: String(row.source),
      status: row.status as Lead["status"],
      location: String(row.location),
      requestedAt: String(row.requested_at),
      value: Number(row.value)
    }));
  },
  async createLead(input) {
    const lead: Lead = {
      id: `lead-${crypto.randomUUID()}`,
      name: input.name,
      business: input.business,
      email: input.email,
      phone: input.phone,
      service: "Demo Request",
      source: "Website Demo",
      status: "new",
      location: input.business,
      requestedAt: new Date().toISOString(),
      value: 0
    };

    getDatabase()
      .prepare(
        `
          INSERT INTO leads (
            id, name, business, email, phone, service, source, status, location, requested_at, value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        lead.id,
        lead.name,
        lead.business ?? null,
        lead.email ?? null,
        lead.phone ?? null,
        lead.service,
        lead.source,
        lead.status,
        lead.location,
        lead.requestedAt,
        lead.value
      );

    return lead;
  }
};
