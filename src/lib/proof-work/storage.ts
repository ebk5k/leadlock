import fs from "node:fs/promises";
import path from "node:path";

const proofRoot = path.join(process.cwd(), "data", "job-proofs");

function sanitizeExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension && extension.length <= 10 ? extension : "";
}

export async function saveProofFile(input: {
  appointmentId: string;
  fileName: string;
  bytes: Uint8Array;
}) {
  await fs.mkdir(proofRoot, { recursive: true });

  const storedFileName = `${input.appointmentId}-${crypto.randomUUID()}${sanitizeExtension(
    input.fileName
  )}`;
  const storedPath = path.join(proofRoot, storedFileName);

  await fs.writeFile(storedPath, input.bytes);

  return {
    fileName: input.fileName,
    storedPath,
    storedFileName
  };
}

export async function readProofFile(storedFileName: string) {
  const storedPath = path.join(proofRoot, storedFileName);

  return fs.readFile(storedPath);
}
