import { z } from "zod";

export const demoFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  business: z.string().min(2, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Phone is required")
});

export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  service: z.string().min(2, "Choose a service"),
  date: z.string().min(1, "Pick a date"),
  notes: z.string().optional()
});

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password must be at least 4 characters")
});

export const appointmentOpsUpdateSchema = z.object({
  assignedEmployeeId: z.string().min(1, "Employee is required").optional(),
  assignedTo: z.string().min(2, "Worker name is required").optional(),
  status: z
    .enum(["scheduled", "dispatched", "en_route", "on_site", "completed", "canceled"])
    .optional()
});

export const employeeFormSchema = z.object({
  name: z.string().min(2, "Employee name is required"),
  role: z.enum(["technician", "dispatcher", "manager"]),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  active: z.boolean().default(true)
});

export type DemoFormValues = z.infer<typeof demoFormSchema>;
export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type AppointmentOpsUpdateValues = z.infer<typeof appointmentOpsUpdateSchema>;
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
