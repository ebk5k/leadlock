import { NextResponse } from "next/server";

import { appointmentService } from "@/lib/services/appointment-service";
import { bookingFormSchema } from "@/lib/validators/forms";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = bookingFormSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: "Invalid booking submission." },
      { status: 400 }
    );
  }

  const appointment = await appointmentService.createAppointment({
    customerName: result.data.name,
    service: result.data.service,
    scheduledFor: new Date(result.data.date).toISOString(),
    notes: result.data.notes
  });

  return NextResponse.json({ success: true, appointment });
}
