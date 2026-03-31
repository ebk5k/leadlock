import { callLogs, receptionistInteractions } from "@/lib/mock-data/calls";
import type { CallLog, ReceptionistInteraction } from "@/types/domain";

export interface ReceptionistService {
  getCalls(): Promise<CallLog[]>;
  getInteractions(): Promise<ReceptionistInteraction[]>;
}

export const receptionistService: ReceptionistService = {
  async getCalls() {
    return Promise.resolve(callLogs);
  },
  async getInteractions() {
    return Promise.resolve(receptionistInteractions);
  }
};

