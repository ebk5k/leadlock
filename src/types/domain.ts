export type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won";
export type CalendarSyncStatus = "pending" | "synced" | "failed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EmployeeRole = "technician" | "dispatcher" | "manager";
export type BusinessClientStatus = "active" | "launching" | "inactive";
export type ActiveBusinessContextSource = "request" | "session" | "default";
export type BusinessMembershipRole = "owner" | "admin" | "operator";
export type BusinessMembershipStatus = "active" | "inactive";
export type ProviderIntegrationKind = "payments" | "calendar" | "messaging" | "receptionist";
export type ProviderConfigStatus = "active" | "inactive";
export type ProviderConfigSource = "business" | "global";
export type ProviderVerificationStatus = "pending" | "passed" | "failed";
export type ProviderVerificationMode = "config_validation" | "live";
export type InstallWorkflowStepPriority = "normal" | "high";
export type InstallWorkflowStepKey =
  | "provider_config_reviewed"
  | "payments_verified"
  | "calendar_verified"
  | "messaging_verified"
  | "receptionist_verified"
  | "test_booking_verified"
  | "test_payment_verified"
  | "launch_approved";
export type InstallWorkflowStepStatus = "open" | "complete";
export type InstallWorkflowEventType =
  | "assigned"
  | "unassigned"
  | "marked_complete"
  | "marked_incomplete"
  | "force_approved"
  | "note_added"
  | "due_date_changed"
  | "priority_changed";
export type InstallReminderEventType = "overdue_generated" | "acknowledged";
export type InstallReminderType = "overdue" | "upcoming";
export type OperatorNotificationStatus = "unread" | "read";
export type AppointmentStatus =
  | "scheduled"
  | "dispatched"
  | "en_route"
  | "on_site"
  | "completed"
  | "canceled";

export interface AuthenticatedUserIdentity {
  id: string;
  email: string;
  name: string;
}

export interface AuthorizedSession {
  user: AuthenticatedUserIdentity;
  allowedBusinessIds: string[];
  activeBusinessId: string;
}

export interface BusinessMembership {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessMembershipRole;
  status: BusinessMembershipStatus;
  createdAt: string;
  businessClient: BusinessClient;
}

export interface AuthorizedBusinessSessionContext {
  session: AuthorizedSession | null;
  allowedBusinessClients: BusinessClient[];
  memberships: BusinessMembership[];
}

export interface BusinessProviderConfig {
  id: string;
  businessId: string;
  integrationKind: ProviderIntegrationKind;
  providerName: string;
  status: ProviderConfigStatus;
  config: Record<string, string>;
  secrets: Record<string, string>;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedBusinessProviderConfig extends BusinessProviderConfig {
  source: ProviderConfigSource;
}

export interface ProviderConfigView {
  id: string;
  businessId: string;
  integrationKind: ProviderIntegrationKind;
  providerName: string;
  status: ProviderConfigStatus;
  source: ProviderConfigSource;
  hasBusinessOverride: boolean;
  isConfigured: boolean;
  config: Record<string, string>;
  metadata: Record<string, string>;
  secretPresence: Record<string, boolean>;
  updatedAt: string;
}

export interface ProviderVerification {
  id: string;
  businessId: string;
  integrationKind: ProviderIntegrationKind;
  status: ProviderVerificationStatus;
  mode: ProviderVerificationMode;
  lastCheckedAt?: string;
  summary: string;
  details: string;
  checkedByUserId?: string;
  checkedByEmail?: string;
}

export interface InstallWorkflowStep {
  id: string;
  key: InstallWorkflowStepKey;
  label: string;
  description: string;
  status: InstallWorkflowStepStatus;
  source: "automatic" | "manual" | "legacy";
  autoManaged: boolean;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority: InstallWorkflowStepPriority;
  isOverdue: boolean;
  lastCompletedAt?: string;
  completedByUserId?: string;
  completedByEmail?: string;
  summary?: string;
  notes?: string;
  history: InstallWorkflowEvent[];
}

export interface InstallWorkflowAssignee {
  userId: string;
  name: string;
  email: string;
}

export interface InstallWorkflowEvent {
  id: string;
  businessId: string;
  stepKey: InstallWorkflowStepKey;
  eventType: InstallWorkflowEventType;
  summary: string;
  notes?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority?: InstallWorkflowStepPriority;
  actorUserId?: string;
  actorEmail?: string;
  createdAt: string;
}

export interface InstallWorkflowSnapshot {
  totalSteps: number;
  completedSteps: number;
  canApproveLaunch: boolean;
  launchApproved: boolean;
  prerequisiteLabels: string[];
  blockedApprovalReasons: string[];
  overdueStepCount: number;
  unassignedOpenStepCount: number;
  availableAssignees: InstallWorkflowAssignee[];
  steps: InstallWorkflowStep[];
}

export interface InstallReminderEvent {
  id: string;
  businessId: string;
  stepId: string;
  stepKey: InstallWorkflowStepKey;
  reminderType: InstallReminderType;
  eventType: InstallReminderEventType;
  summary: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  actorUserId?: string;
  actorEmail?: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface InstallReminderSummary {
  businessId: string;
  stepId: string;
  stepKey: InstallWorkflowStepKey;
  lastReminderAt?: string;
  lastAcknowledgedAt?: string;
  hasOutstandingReminder: boolean;
  history: InstallReminderEvent[];
}

export interface InstallReminderSweepResult {
  remindersGenerated: InstallReminderEvent[];
  overdueGeneratedCount: number;
  upcomingGeneratedCount: number;
}

export interface OperatorNotification {
  id: string;
  businessId: string;
  businessName: string;
  stepId: string;
  stepKey: InstallWorkflowStepKey;
  stepLabel: string;
  operatorUserId: string;
  operatorName?: string;
  operatorEmail?: string;
  reminderEventId: string;
  reminderType: InstallReminderType;
  status: OperatorNotificationStatus;
  summary: string;
  createdAt: string;
  readAt?: string;
}

export interface OperatorInboxSnapshot {
  notifications: OperatorNotification[];
  unreadCount: number;
}

export interface OperatorWorkloadStep {
  businessId: string;
  businessName: string;
  stepKey: InstallWorkflowStepKey;
  stepLabel: string;
  status: InstallWorkflowStepStatus;
  dueDate?: string;
  isOverdue: boolean;
  priority: InstallWorkflowStepPriority;
  isBlockingStep: boolean;
  blockingContext?: string;
  reminder: InstallReminderSummary;
}

export interface OperatorWorkloadGroup {
  operatorUserId?: string;
  operatorName: string;
  operatorEmail?: string;
  assignedBusinessesCount: number;
  overdueStepsCount: number;
  outstandingReminderCount: number;
  steps: OperatorWorkloadStep[];
}

export interface OperatorWorkloadSnapshot {
  currentOperatorUserId?: string;
  myTasks: OperatorWorkloadStep[];
  groups: OperatorWorkloadGroup[];
  inbox: OperatorInboxSnapshot;
  totals: {
    totalAssignedSteps: number;
    overdueStepsCount: number;
    outstandingReminderCount: number;
    operatorsWithAssignments: number;
  };
}

export interface BusinessOpsRecentActivity {
  label: string;
  timestamp?: string;
}

export interface BusinessOpsSummary {
  businessClient: BusinessClient;
  membershipRole?: BusinessMembershipRole;
  isActiveBusiness: boolean;
  providerConfigSummary: {
    configuredCount: number;
    totalCount: number;
    usingFallbackCount: number;
  };
  providerVerificationSummary: {
    passedCount: number;
    failedCount: number;
    pendingCount: number;
    totalCount: number;
    lastCheckedAt?: string;
  };
  installWorkflow: InstallWorkflowSnapshot;
  launchReadiness: LaunchReadinessSnapshot;
  coordination: {
    overdueStepCount: number;
    unassignedOpenStepCount: number;
    nextBlockingStepLabel?: string;
    nextBlockingStepOwner?: string;
    outstandingReminderCount: number;
    notificationCount: number;
  };
  recentActivity: BusinessOpsRecentActivity;
}

export interface ClientOpsDashboardSnapshot {
  businesses: BusinessOpsSummary[];
  workload: OperatorWorkloadSnapshot;
  totals: {
    totalBusinesses: number;
    launchApprovedCount: number;
    blockedCount: number;
    readyForApprovalCount: number;
    verificationAttentionCount: number;
    overdueBusinessesCount: number;
    unassignedBusinessesCount: number;
    businessesWithOutstandingRemindersCount: number;
    unreadNotificationCount: number;
  };
}

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

export interface ActiveBusinessContext {
  businessId: string;
  businessClient: BusinessClient;
  source: ActiveBusinessContextSource;
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
  businessId?: string;
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
    | "payment_provider"
    | "messaging_provider"
    | "receptionist_provider";
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
