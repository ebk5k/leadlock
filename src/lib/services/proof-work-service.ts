import path from "node:path";
import { unstable_noStore as noStore } from "next/cache.js";

import {
  assertRecordInBusiness,
  getRecordBusinessAssociation,
  resolveGuardedBusinessScope
} from "@/lib/business-guard";
import { resolveActiveBusinessId } from "@/lib/business-context";
import { getDatabase } from "@/lib/data/database";
import { readProofFile, saveProofFile } from "@/lib/proof-work/storage";
import type { ProofAsset } from "@/types/domain";

function mapProofAssetRow(row: Record<string, unknown>): ProofAsset {
  const storedFileName = path.basename(String(row.storage_path));

  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : undefined,
    appointmentId: String(row.appointment_id),
    fileName: String(row.file_name),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    createdAt: String(row.created_at),
    url: `/api/proof-assets/${String(row.id)}`,
    storedFileName
  };
}

export interface ProofWorkService {
  getProofAssetsForAppointments(appointmentIds: string[]): Promise<Map<string, ProofAsset[]>>;
  getProofAssetById(assetId: string): Promise<ProofAsset | null>;
  getProofAssetFile(assetId: string): Promise<{ asset: ProofAsset; bytes: Buffer } | null>;
  createProofAssets(input: {
    appointmentId: string;
    files: Array<{
      fileName: string;
      mimeType: string;
      bytes: Uint8Array;
      sizeBytes: number;
    }>;
  }): Promise<ProofAsset[]>;
}

export const proofWorkService: ProofWorkService = {
  async getProofAssetsForAppointments(appointmentIds) {
    noStore();
    const businessId = await resolveActiveBusinessId();

    if (appointmentIds.length === 0) {
      return new Map();
    }

    const placeholders = appointmentIds.map(() => "?").join(", ");
    const rows = getDatabase()
      .prepare(
        `
          SELECT id, business_id, appointment_id, file_name, mime_type, size_bytes, storage_path, created_at
          FROM proof_assets
          WHERE business_id = ? AND appointment_id IN (${placeholders})
          ORDER BY datetime(created_at) DESC
        `
      )
      .all(businessId, ...appointmentIds) as Array<Record<string, unknown>>;

    const assetsByAppointment = new Map<string, ProofAsset[]>();

    for (const row of rows) {
      const asset = mapProofAssetRow(row);
      const current = assetsByAppointment.get(asset.appointmentId) ?? [];
      current.push(asset);
      assetsByAppointment.set(asset.appointmentId, current);
    }

    return assetsByAppointment;
  },

  async getProofAssetById(assetId) {
    noStore();
    const businessId = await resolveActiveBusinessId();

    const row = getDatabase()
      .prepare(
        `
          SELECT id, business_id, appointment_id, file_name, mime_type, size_bytes, storage_path, created_at
          FROM proof_assets
          WHERE business_id = ? AND id = ?
          LIMIT 1
        `
      )
      .get(businessId, assetId) as Record<string, unknown> | undefined;

    if (!row) {
      return null;
    }

    const asset = mapProofAssetRow(row);
    await assertRecordInBusiness({
      action: "proofWorkService.getProofAssetById",
      table: "appointments",
      recordId: asset.appointmentId,
      expectedBusinessId: businessId
    });

    return asset;
  },

  async getProofAssetFile(assetId) {
    const businessId = await resolveActiveBusinessId();
    const row = getDatabase()
      .prepare(
        `
          SELECT id, business_id, appointment_id, file_name, mime_type, size_bytes, storage_path, created_at
          FROM proof_assets
          WHERE business_id = ? AND id = ?
          LIMIT 1
        `
      )
      .get(businessId, assetId) as Record<string, unknown> | undefined;

    if (!row) {
      return null;
    }

    const asset = mapProofAssetRow(row);
    await assertRecordInBusiness({
      action: "proofWorkService.getProofAssetFile",
      table: "appointments",
      recordId: asset.appointmentId,
      expectedBusinessId: businessId
    });
    const bytes = await readProofFile(String(row.storage_path));

    return { asset, bytes };
  },

  async createProofAssets({ appointmentId, files }) {
    const appointmentAssociation = getRecordBusinessAssociation("appointments", appointmentId);
    const businessId = await resolveGuardedBusinessScope({
      action: "proofWorkService.createProofAssets",
      associatedBusinessId: appointmentAssociation?.businessId
    });

    await assertRecordInBusiness({
      action: "proofWorkService.createProofAssets",
      table: "appointments",
      recordId: appointmentId,
      expectedBusinessId: businessId
    });

    const createdAt = new Date().toISOString();
    const insert = getDatabase().prepare(
      `
        INSERT INTO proof_assets (
          id, business_id, appointment_id, file_name, mime_type, size_bytes, storage_path, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    const assets: ProofAsset[] = [];

    for (const file of files) {
      const saved = await saveProofFile({
        businessId,
        appointmentId,
        fileName: file.fileName,
        bytes: file.bytes
      });
      const id = `proof-${crypto.randomUUID()}`;

      insert.run(
        id,
        businessId,
        appointmentId,
        saved.fileName,
        file.mimeType,
        file.sizeBytes,
        saved.storedPath,
        createdAt
      );

      assets.push({
        id,
        businessId,
        appointmentId,
        fileName: saved.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt,
        storedFileName: saved.storedFileName,
        url: `/api/proof-assets/${id}`
      });
    }

    return assets;
  }
};
