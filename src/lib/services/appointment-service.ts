import { appointments } from "@/lib/mock-data/appointments";
import type { Appointment } from "@/types/domain";

export interface AppointmentService {
  getAppointments(): Promise<Appointment[]>;
}

export const appointmentService: AppointmentService = {
  async getAppointments() {
    return Promise.resolve(appointments);
  }
};

