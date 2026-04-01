import { NextResponse } from "next/server";

import { appointmentService } from "@/lib/services/appointment-service";
import { leadService } from "@/lib/services/lead-service";
import { messagingService } from "@/lib/services/messaging-service";
import { paymentService } from "@/lib/services/payment-service";
import { receptionistService } from "@/lib/services/receptionist-service";

type ActionType =
  | "booking_confirmation"
  | "missed_call_recovery"
  | "no_response_lead_recovery"
  | "payment_reminder";

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const actionType = payload.actionType as ActionType | undefined;

  if (!actionType) {
    return NextResponse.json({ success: false, message: "Action type is required." }, { status: 400 });
  }

  try {
    switch (actionType) {
      case "booking_confirmation": {
        const appointmentId = String(payload.appointmentId ?? "");
        const appointment = await appointmentService.getAppointmentById(appointmentId);

        if (!appointment) {
          return NextResponse.json({ success: false, message: "Appointment not found." }, { status: 404 });
        }

        const event = await messagingService.triggerBookingConfirmation({
          appointment,
          force: true
        });

        return NextResponse.json({ success: true, event });
      }

      case "missed_call_recovery": {
        const callId = String(payload.callId ?? "");
        const call = await receptionistService.getCallById(callId);

        if (!call) {
          return NextResponse.json({ success: false, message: "Call not found." }, { status: 404 });
        }

        const event = await messagingService.triggerMissedCallRecovery({
          call,
          force: true
        });

        return NextResponse.json({ success: true, event });
      }

      case "no_response_lead_recovery": {
        const leadId = String(payload.leadId ?? "");
        const lead = await leadService.getLeadById(leadId);

        if (!lead) {
          return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
        }

        const event = await messagingService.triggerNoResponseLeadRecovery({
          lead,
          force: true
        });

        return NextResponse.json({ success: true, event });
      }

      case "payment_reminder": {
        const paymentId = String(payload.paymentId ?? "");
        const payment = await paymentService.getPaymentById(paymentId);

        if (!payment) {
          return NextResponse.json({ success: false, message: "Payment not found." }, { status: 404 });
        }

        const appointment = await appointmentService.getAppointmentById(payment.appointmentId);

        if (!appointment) {
          return NextResponse.json(
            { success: false, message: "Linked appointment not found." },
            { status: 404 }
          );
        }

        const event = await messagingService.triggerPaymentReminder({
          payment,
          appointment,
          force: true
        });

        return NextResponse.json({ success: true, event });
      }

      default:
        return NextResponse.json({ success: false, message: "Unsupported action type." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to trigger automation."
      },
      { status: 400 }
    );
  }
}
