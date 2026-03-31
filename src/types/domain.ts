export type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won";
export type CalendarSyncStatus = "pending" | "synced" | "failed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EmployeeRole = "technician" | "dispatcher" | "manager";
export type AppointmentStatus =
  | "scheduled"
  | "dispatched"
  | "en_route"
  | "on_site"
  | "completed"
  | "canceled";

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string;
  active: boolean;
}

export interface ProofAsset {
  id: string;
  appointmentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  url: string;
  storedFileName: string;
}

export interface Lead {
  id: string;
  name: string;
  business?: string;
  email?: string;
  phone?: string;
  service: string;
  source: string;
  status: LeadStatus;
  location: string;
  requestedAt: string;
  value: number;
}

export interface Appointment {
  id: string;
  customerName: string;
  service: string;
  scheduledFor: string;
  status: AppointmentStatus;
  assignedTo: string;
  assignedEmployeeId?: string;
  assignedEmployee?: Employee;
  notes?: string;
  completionNotes?: string;
  completionSignatureName?: string;
  proofAssets: ProofAsset[];
  proofAssetCount: number;
  createdAt?: string;
  updatedAt?: string;
  assignedAt?: string;
  dispatchedAt?: string;
  enRouteAt?: string;
  onSiteAt?: string;
  completedAt?: string;
  canceledAt?: string;
  externalCalendarEventId?: string;
  calendarProvider?: string;
  calendarSyncError?: string;
  calendarSyncStatus: CalendarSyncStatus;
  paymentStatus: PaymentStatus;
  paymentProvider?: string;
  paymentAmountCents?: number;
  paymentCheckoutUrl?: string;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  checkoutUrl?: string;
  externalCheckoutSessionId?: string;
  externalPaymentIntentId?: string;
  externalChargeId?: string;
  externalRefundId?: string;
  description: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  id: string;
  callerName: string;
  callerNumber?: string;
  callStatus: "queued" | "ringing" | "in_progress" | "completed" | "failed";
  outcome: "answered" | "missed" | "voicemail" | "unknown";
  summary: string;
  transcriptPreview: string;
  timestamp: string;
  durationMinutes: number;
}

export interface ReceptionistInteraction {
  id: string;
  customerName: string;
  intent: string;
  action: string;
  timestamp: string;
}

export interface FollowUpEvent {
  id: string;
  leadName: string;
  channel: "sms" | "email" | "call";
  status: "pending" | "sent" | "failed";
  outcome: string;
  timestamp: string;
}

export interface AnalyticsPoint {
  label: string;
  leads: number;
  bookings: number;
}

export interface AnalyticsSnapshot {
  totalLeads: number;
  conversionRate: number;
  bookedAppointments: number;
  responseTimeMinutes: number;
  series: AnalyticsPoint[];
  sources: Array<{ source: string; value: number }>;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  timezone: string;
  businessHours: string[];
  services: string[];
  aiScriptNotes: string;
  receptionistTone: string;
  followUpEnabled: boolean;
}
