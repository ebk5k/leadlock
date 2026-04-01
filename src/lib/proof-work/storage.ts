import fs from "node:fs/promises";
import path from "node:path";

const proofRoot = path.join(process.cwd(), "data", "job-proofs");

function sanitizeExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension && extension.length <= 10 ? extension : "";
}

export async function saveProofFile(input: {
  businessId: string;
  appointmentId: string;
  fileName: string;
  bytes: Uint8Array;
}) {
  const businessProofRoot = path.join(proofRoot, input.businessId);
  await fs.mkdir(businessProofRoot, { recursive: true });

  const storedFileName = `${input.appointmentId}-${crypto.randomUUID()}${sanitizeExtension(
    input.fileName
  )}`;
  const storedPath = path.join(businessProofRoot, storedFileName);

  await fs.writeFile(storedPath, input.bytes);

  return {
    fileName: input.fileName,
    storedPath,
    storedFileName
  };
}

export async function readProofFile(storedFileName: string) {
  return fs.readFile(storedFileName);
}
