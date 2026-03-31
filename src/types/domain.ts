export type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won";

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
  status: "confirmed" | "pending" | "completed";
  assignedTo: string;
  notes?: string;
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
