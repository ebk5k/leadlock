import { leads } from "@/lib/mock-data/leads";
import type { Lead } from "@/types/domain";

export interface LeadService {
  getLeads(): Promise<Lead[]>;
}

export const leadService: LeadService = {
  async getLeads() {
    return Promise.resolve(leads);
  }
};

