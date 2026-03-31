import { proofWorkService } from "@/lib/services/proof-work-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  const result = await proofWorkService.getProofAssetFile(assetId);

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(result.bytes), {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": result.asset.mimeType
    }
  });
}
