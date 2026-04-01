export type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won";
export type CalendarSyncStatus = "pending" | "synced" | "failed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EmployeeRole = "technician" | "dispatcher" | "manager";
export type BusinessClientStatus = "active" | "launching" | "inactive";
export type AppointmentStatus =
  | "scheduled"
  | "dispatched"
  | "en_route"
  | "on_site"
  | "completed"
  | "canceled";

export interface Employee {
  id: string;
  businessId?: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string;
  active: boolean;
}

export interface BusinessClient {
  id: string;
  name: string;
  status: BusinessClientStatus;
  createdAt: string;
}

export interface EmployeePerformanceSnapshot {
  employee: Employee;
  jobsAssigned: number;
  jobsCompleted: number;
  activeJobs: number;
  inProgressJobs: number;
  paidRevenueCents: number;
  averageCompletionDurationMinutes: number | null;
  utilizationPercent: number;
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
  businessId?: string;
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
  businessId?: string;
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
  paymentId?: string;
  paymentProvider?: string;
  paymentAmountCents?: number;
  paymentCheckoutUrl?: string;
}

export interface PaymentRecord {
  id: string;
  businessId?: string;
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
  businessId?: string;
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
  businessId?: string;
  leadName: string;
  channel: "sms" | "email" | "call";
  status: "pending" | "sent" | "failed";
  outcome: string;
  timestamp: string;
  appointmentId?: string;
  messageType?: string;
  triggerSource?: "automatic" | "manual";
  relatedCallId?: string;
  relatedLeadId?: string;
  relatedPaymentId?: string;
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

export interface LaunchReadinessFlags {
  calendarProviderConfigured: boolean;
  paymentProviderConfigured: boolean;
}

export interface InstallChecklistFlags {
  phoneAiReceptionistVerified: boolean;
  testBookingVerified: boolean;
  testPaymentVerified: boolean;
  launchApproved: boolean;
}

export interface LaunchReadinessItem {
  key:
    | "business_info"
    | "services"
    | "working_hours"
    | "message_templates"
    | "calendar_provider"
    | "payment_provider";
  label: string;
  description: string;
  ready: boolean;
  source: "automatic" | "manual";
}

export interface LaunchReadinessSnapshot {
  totalItems: number;
  readyItems: number;
  items: LaunchReadinessItem[];
}

export interface InstallChecklistItem {
  key:
    | "onboarding_completed"
    | "services_configured"
    | "working_hours_configured"
    | "calendar_connected"
    | "payment_provider_connected"
    | "messaging_templates_configured"
    | "phone_ai_receptionist_verified"
    | "test_booking_verified"
    | "test_payment_verified"
    | "launch_approved";
  label: string;
  description: string;
  ready: boolean;
  source: "automatic" | "manual";
}

export interface InstallChecklistSnapshot {
  totalItems: number;
  readyItems: number;
  items: InstallChecklistItem[];
}

export interface BusinessSettings {
  businessId: string;
  businessClient: BusinessClient;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  services: string[];
  workingHours: string[];
  defaultJobPriceCents: number;
  currency: string;
  confirmationMessageTemplate: string;
  reminderMessageTemplate: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  launchReadinessFlags: LaunchReadinessFlags;
  installChecklistFlags: InstallChecklistFlags;
}
