import { NextResponse } from "next/server";

import { appointmentService } from "@/lib/services/appointment-service";
import { bookingFormSchema } from "@/lib/validators/forms";

// Retell tool call endpoint — called mid-conversation by the AI agent.
// Retell POSTs the tool arguments as a flat JSON body.
export async function POST(request: Request) {
  const payload = await request.json();
  const result = bookingFormSchema.safeParse(payload);
  const baseUrl = new URL(request.url).origin;

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        // Retell surfaces this message to the agent so it can recover gracefully.
        message: "I need the customer name, service, and date to book the appointment."
      },
      { status: 400 }
    );
  }

  const appointment = await appointmentService.createAppointment({
    customerName: result.data.name,
    service: result.data.service,
    scheduledFor: new Date(result.data.date).toISOString(),
    notes: result.data.notes,
    baseUrl
  });

  return NextResponse.json({
    success: true,
    // The agent reads this message aloud to the caller.
    message: `Got it — I've booked your ${appointment.service} appointment. You'll receive a confirmation shortly.`,
    appointmentId: appointment.id
  });
}
