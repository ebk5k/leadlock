import { unstable_noStore as noStore } from "next/cache.js";

import { getDatabase } from "@/lib/data/database";
import { receptionistInteractions } from "@/lib/mock-data/calls";
import type { CallLog, ReceptionistInteraction } from "@/types/domain";

export interface ReceptionistService {
  getCalls(): Promise<CallLog[]>;
  getInteractions(): Promise<ReceptionistInteraction[]>;
  createCall(input: {
    id: string;
    callerName: string;
    callerNumber?: string;
    timestamp: string;
    summary: string;
    transcriptPreview: string;
    callStatus: CallLog["callStatus"];
    outcome: CallLog["outcome"];
    durationMinutes: number;
  }): Promise<CallLog>;
}

export const receptionistService: ReceptionistService = {
  async getCalls() {
    noStore();

    const rows = getDatabase()
      .prepare(
        `
          SELECT
            id,
            caller_name,
            caller_number,
            timestamp,
            summary,
            transcript_preview,
            call_status,
            outcome,
            duration_minutes
          FROM calls
          ORDER BY datetime(timestamp) DESC
        `
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      callerName: String(row.caller_name),
      callerNumber: row.caller_number ? String(row.caller_number) : undefined,
      timestamp: String(row.timestamp),
      summary: String(row.summary),
      transcriptPreview: String(row.transcript_preview),
      callStatus: row.call_status as CallLog["callStatus"],
      outcome: row.outcome as CallLog["outcome"],
      durationMinutes: Number(row.duration_minutes)
    }));
  },
  async getInteractions() {
    return Promise.resolve(receptionistInteractions);
  },
  async createCall(input) {
    const call: CallLog = {
      id: input.id,
      callerName: input.callerName,
      callerNumber: input.callerNumber,
      timestamp: input.timestamp,
      summary: input.summary,
      transcriptPreview: input.transcriptPreview,
      callStatus: input.callStatus,
      outcome: input.outcome,
      durationMinutes: input.durationMinutes
    };

    getDatabase()
      .prepare(
        `
          INSERT OR REPLACE INTO calls (
            id,
            caller_name,
            caller_number,
            timestamp,
            summary,
            transcript_preview,
            call_status,
            outcome,
            duration_minutes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        call.id,
        call.callerName,
        call.callerNumber ?? null,
        call.timestamp,
        call.summary,
        call.transcriptPreview,
        call.callStatus,
        call.outcome,
        call.durationMinutes
      );

    return call;
  }
};
