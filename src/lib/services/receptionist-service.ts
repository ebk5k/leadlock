import { unstable_noStore as noStore } from "next/cache.js";

import {
  getRecordBusinessAssociation,
  resolveGuardedBusinessScope
} from "@/lib/business-guard";
import { resolveActiveBusinessId } from "@/lib/business-context";
import { getDatabase } from "@/lib/data/database";
import { receptionistInteractions } from "@/lib/mock-data/calls";
import { messagingService } from "@/lib/services/messaging-service";
import type { CallLog, ReceptionistInteraction } from "@/types/domain";

function mapCallRow(row: Record<string, unknown>): CallLog {
  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : undefined,
    callerName: String(row.caller_name),
    callerNumber: row.caller_number ? String(row.caller_number) : undefined,
    timestamp: String(row.timestamp),
    summary: String(row.summary),
    transcriptPreview: String(row.transcript_preview),
    callStatus: row.call_status as CallLog["callStatus"],
    outcome: row.outcome as CallLog["outcome"],
    durationMinutes: Number(row.duration_minutes)
  };
}

export interface ReceptionistService {
  getCalls(): Promise<CallLog[]>;
  getCallById(callId: string): Promise<CallLog | null>;
  getInteractions(): Promise<ReceptionistInteraction[]>;
  createCall(input: {
    id: string;
    businessId?: string;
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
    const businessId = await resolveActiveBusinessId();

    const rows = getDatabase()
      .prepare(
        `
          SELECT
            id,
            business_id,
            caller_name,
            caller_number,
            timestamp,
            summary,
            transcript_preview,
            call_status,
            outcome,
            duration_minutes
          FROM calls
          WHERE business_id = ?
          ORDER BY datetime(timestamp) DESC
        `
      )
      .all(businessId) as Array<Record<string, unknown>>;

    return rows.map(mapCallRow);
  },
  async getCallById(callId) {
    noStore();
    const businessId = await resolveActiveBusinessId();

    const row = getDatabase()
      .prepare(
        `
          SELECT
            id,
            business_id,
            caller_name,
            caller_number,
            timestamp,
            summary,
            transcript_preview,
            call_status,
            outcome,
            duration_minutes
          FROM calls
          WHERE business_id = ? AND id = ?
          LIMIT 1
        `
      )
      .get(businessId, callId) as Record<string, unknown> | undefined;

    return row ? mapCallRow(row) : null;
  },
  async getInteractions() {
    return Promise.resolve(receptionistInteractions);
  },
  async createCall(input) {
    const existingCall = getRecordBusinessAssociation("calls", input.id);
    const businessId = await resolveGuardedBusinessScope({
      action: "receptionistService.createCall",
      requestedBusinessId: input.businessId,
      associatedBusinessId: existingCall?.businessId
    });
    const call: CallLog = {
      id: input.id,
      businessId,
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
            business_id,
            caller_name,
            caller_number,
            timestamp,
            summary,
            transcript_preview,
            call_status,
            outcome,
            duration_minutes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        call.id,
        call.businessId ?? businessId,
        call.callerName,
        call.callerNumber ?? null,
        call.timestamp,
        call.summary,
        call.transcriptPreview,
        call.callStatus,
        call.outcome,
        call.durationMinutes
      );

    await messagingService.triggerMissedCallRecovery({ call });

    return call;
  }
};
