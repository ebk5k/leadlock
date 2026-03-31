import { NextResponse } from "next/server";

import { appointmentService } from "@/lib/services/appointment-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const formData = await request.formData();
  const files = formData
    .getAll("proofFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const completionNotes = formData.get("completionNotes");
  const completionSignatureName = formData.get("completionSignatureName");
  const { appointmentId } = await params;

  try {
    const appointment = await appointmentService.completeAppointmentWithProof({
      appointmentId,
      completionNotes: typeof completionNotes === "string" ? completionNotes : undefined,
      completionSignatureName:
        typeof completionSignatureName === "string" ? completionSignatureName : undefined,
      files: await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          bytes: new Uint8Array(await file.arrayBuffer()),
          sizeBytes: file.size
        }))
      )
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to complete appointment."
      },
      { status: 400 }
    );
  }
}
