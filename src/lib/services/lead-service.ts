import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { getCurrentBusinessId } from "@/lib/settings/store";
import { messagingService } from "@/lib/services/messaging-service";
import type { Lead } from "@/types/domain";

const NO_RESPONSE_LEAD_RECOVERY_DELAY_MINUTES = 30;

function mapLeadRow(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : undefined,
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
  };
}

function hasBookingAttribution(lead: Lead) {
  const businessId = getCurrentBusinessId();
  const bookingRow = getDatabase()
    .prepare(
      `
        SELECT a.id
        FROM appointments a
        WHERE a.business_id = ?
          AND
          LOWER(TRIM(a.customer_name)) = LOWER(TRIM(?))
        LIMIT 1
      `
    )
    .get(businessId, lead.name) as { id?: string } | undefined;

  return Boolean(bookingRow?.id);
}

function isRecoveryEligible(lead: Lead) {
  if (lead.status === "booked" || lead.status === "won") {
    return false;
  }

  const requestedAt = new Date(lead.requestedAt);
  const ageMinutes = (Date.now() - requestedAt.getTime()) / (1000 * 60);

  return Number.isFinite(ageMinutes) && ageMinutes >= NO_RESPONSE_LEAD_RECOVERY_DELAY_MINUTES;
}

export interface LeadService {
  getLeads(): Promise<Lead[]>;
  getLeadById(leadId: string): Promise<Lead | null>;
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
    const businessId = getCurrentBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT id, business_id, name, business, email, phone, service, source, status, location, requested_at, value
          FROM leads
          WHERE business_id = ?
          ORDER BY datetime(requested_at) DESC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    const leads = rows.map(mapLeadRow);

    const recoveryCandidates = leads.filter(
      (lead) => isRecoveryEligible(lead) && !hasBookingAttribution(lead)
    );

    await Promise.all(
      recoveryCandidates.map((lead) => messagingService.triggerNoResponseLeadRecovery({ lead }))
    );

    return leads;
  },
  async getLeadById(leadId) {
    noStore();
    const businessId = getCurrentBusinessId();

    const row = getDatabase()
      .prepare(
        `
          SELECT id, business_id, name, business, email, phone, service, source, status, location, requested_at, value
          FROM leads
          WHERE business_id = ? AND id = ?
          LIMIT 1
        `
      )
      .get(businessId, leadId) as Record<string, unknown> | undefined;

    return row ? mapLeadRow(row) : null;
  },
  async createLead(input) {
    const lead: Lead = {
      id: `lead-${crypto.randomUUID()}`,
      businessId: getCurrentBusinessId(),
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
            id, business_id, name, business, email, phone, service, source, status, location, requested_at, value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        lead.id,
        lead.businessId ?? getCurrentBusinessId(),
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
