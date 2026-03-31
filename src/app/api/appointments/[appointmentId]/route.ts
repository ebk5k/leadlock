import { NextResponse } from "next/server";

import { appointmentService } from "@/lib/services/appointment-service";
import { appointmentOpsUpdateSchema } from "@/lib/validators/forms";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const payload = await request.json();
  const result = appointmentOpsUpdateSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: "Invalid appointment update." },
      { status: 400 }
    );
  }

  const { appointmentId } = await params;
  let appointment;

  try {
    appointment = await appointmentService.updateAppointmentOps({
      appointmentId,
      assignedEmployeeId: result.data.assignedEmployeeId,
      assignedTo: result.data.assignedTo,
      status: result.data.status
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update appointment."
      },
      { status: 400 }
    );
  }

  if (!appointment) {
    return NextResponse.json(
      { success: false, message: "Appointment not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, appointment });
}
