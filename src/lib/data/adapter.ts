import crypto from "node:crypto";

import { getDatabase } from "@/lib/data/database";
import { businessSettings as seededSettings } from "@/lib/mock-data/settings";
import type {
  BusinessClient,
  BusinessMembership,
  BusinessProviderConfig,
  AuthenticatedUserIdentity,
  InstallReminderEvent,
  InstallWorkflowEvent,
  InstallWorkflowAssignee,
  InstallWorkflowStepKey,
  InstallWorkflowStepPriority,
  InstallWorkflowStepStatus,
  OperatorNotification,
  ProviderIntegrationKind,
  ProviderVerification,
  ProviderVerificationMode,
  ProviderVerificationStatus
} from "@/types/domain";

// ---------------------------------------------------------------------------
// Business adapter
// ---------------------------------------------------------------------------

function getDefaultBusinessClient(): BusinessClient {
  const row = getDatabase()
    .prepare(
      `SELECT id, name, status, created_at FROM business_clients ORDER BY created_at ASC LIMIT 1`
    )
    .get() as Record<string, unknown> | undefined;

  if (row) {
    return mapBusinessClientRow(row);
  }

  // Seed the default business client on first access
  const defaultClient = seededSettings.businessClient;
  getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO business_clients (id, name, status, created_at) VALUES (?, ?, ?, ?)`
    )
    .run(defaultClient.id, defaultClient.name, defaultClient.status, defaultClient.createdAt);

  return defaultClient;
}

function findBusinessClientById(businessId: string): BusinessClient | null {
  const row = getDatabase()
    .prepare(`SELECT id, name, status, created_at FROM business_clients WHERE id = ? LIMIT 1`)
    .get(businessId) as Record<string, unknown> | undefined;

  return row ? mapBusinessClientRow(row) : null;
}

function listBusinessClientsByIds(businessIds: string[]): BusinessClient[] {
  if (businessIds.length === 0) return [];
  const placeholders = businessIds.map(() => "?").join(", ");
  const rows = getDatabase()
    .prepare(`SELECT id, name, status, created_at FROM business_clients WHERE id IN (${placeholders})`)
    .all(...businessIds) as Array<Record<string, unknown>>;
  return rows.map(mapBusinessClientRow);
}

function mapBusinessClientRow(row: Record<string, unknown>): BusinessClient {
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status) as BusinessClient["status"],
    createdAt: String(row.created_at)
  };
}

// -- Auth users --

function findUserByEmail(email: string): AuthenticatedUserIdentity | null {
  const row = getDatabase()
    .prepare(`SELECT id, email, name FROM auth_users WHERE email = ? LIMIT 1`)
    .get(email) as Record<string, unknown> | undefined;

  return row ? { id: String(row.id), email: String(row.email), name: String(row.name) } : null;
}

function findUserById(userId: string): AuthenticatedUserIdentity | null {
  const row = getDatabase()
    .prepare(`SELECT id, email, name FROM auth_users WHERE id = ? LIMIT 1`)
    .get(userId) as Record<string, unknown> | undefined;

  return row ? { id: String(row.id), email: String(row.email), name: String(row.name) } : null;
}

function upsertAuthUser(input: { id: string; email: string; name: string; createdAt: string }) {
  getDatabase()
    .prepare(
      `INSERT INTO auth_users (id, email, name, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name`
    )
    .run(input.id, input.email, input.name, input.createdAt);
}

// -- Memberships --

function listMembershipsForUser(userId: string): BusinessMembership[] {
  const rows = getDatabase()
    .prepare(
      `SELECT bm.id, bm.user_id, bm.business_id, bm.role, bm.status, bm.created_at,
              bc.name AS business_name, bc.status AS business_status, bc.created_at AS business_created_at
       FROM business_memberships bm
       LEFT JOIN business_clients bc ON bc.id = bm.business_id
       WHERE bm.user_id = ?
       ORDER BY bm.created_at ASC`
    )
    .all(userId) as Array<Record<string, unknown>>;

  return rows.map(mapMembershipRow);
}

function listActiveMembershipsForBusiness(businessId: string): BusinessMembership[] {
  const rows = getDatabase()
    .prepare(
      `SELECT bm.id, bm.user_id, bm.business_id, bm.role, bm.status, bm.created_at,
              bc.name AS business_name, bc.status AS business_status, bc.created_at AS business_created_at
       FROM business_memberships bm
       LEFT JOIN business_clients bc ON bc.id = bm.business_id
       WHERE bm.business_id = ? AND bm.status = 'active'
       ORDER BY bm.created_at ASC`
    )
    .all(businessId) as Array<Record<string, unknown>>;

  return rows.map(mapMembershipRow);
}

function upsertMembership(input: {
  id: string;
  userId: string;
  businessId: string;
  role: string;
  status: string;
  createdAt: string;
}) {
  getDatabase()
    .prepare(
      `INSERT INTO business_memberships (id, user_id, business_id, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET role = excluded.role, status = excluded.status`
    )
    .run(input.id, input.userId, input.businessId, input.role, input.status, input.createdAt);
}

function mapMembershipRow(row: Record<string, unknown>): BusinessMembership {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    businessId: String(row.business_id),
    role: String(row.role) as BusinessMembership["role"],
    status: String(row.status) as BusinessMembership["status"],
    createdAt: String(row.created_at),
    businessClient: {
      id: String(row.business_id),
      name: String(row.business_name ?? ""),
      status: (String(row.business_status ?? "launching")) as BusinessClient["status"],
      createdAt: String(row.business_created_at ?? row.created_at)
    }
  };
}

// ---------------------------------------------------------------------------
// Providers adapter
// ---------------------------------------------------------------------------

function findProviderConfig(
  businessId: string,
  integrationKind: ProviderIntegrationKind
): BusinessProviderConfig | null {
  const row = getDatabase()
    .prepare(
      `SELECT id, business_id, integration_kind, provider_name, status, config, secrets, metadata, created_at, updated_at
       FROM business_provider_configs
       WHERE business_id = ? AND integration_kind = ?
       LIMIT 1`
    )
    .get(businessId, integrationKind) as Record<string, unknown> | undefined;

  return row ? mapProviderConfigRow(row) : null;
}

function upsertProviderConfig(input: BusinessProviderConfig) {
  getDatabase()
    .prepare(
      `INSERT INTO business_provider_configs (id, business_id, integration_kind, provider_name, status, config, secrets, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         provider_name = excluded.provider_name,
         status = excluded.status,
         config = excluded.config,
         secrets = excluded.secrets,
         metadata = excluded.metadata,
         updated_at = excluded.updated_at`
    )
    .run(
      input.id,
      input.businessId,
      input.integrationKind,
      input.providerName,
      input.status,
      JSON.stringify(input.config),
      JSON.stringify(input.secrets),
      JSON.stringify(input.metadata),
      input.createdAt,
      input.updatedAt
    );
}

function mapProviderConfigRow(row: Record<string, unknown>): BusinessProviderConfig {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    integrationKind: String(row.integration_kind) as ProviderIntegrationKind,
    providerName: String(row.provider_name),
    status: String(row.status) as BusinessProviderConfig["status"],
    config: parseJson(row.config),
    secrets: parseJson(row.secrets),
    metadata: parseJson(row.metadata),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function findProviderVerification(
  businessId: string,
  integrationKind: ProviderIntegrationKind
): ProviderVerification | null {
  const row = getDatabase()
    .prepare(
      `SELECT id, business_id, integration_kind, status, mode, summary, details, last_checked_at, checked_by_user_id, checked_by_email
       FROM provider_verifications
       WHERE business_id = ? AND integration_kind = ?
       LIMIT 1`
    )
    .get(businessId, integrationKind) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    id: String(row.id),
    businessId: String(row.business_id),
    integrationKind: String(row.integration_kind) as ProviderIntegrationKind,
    status: String(row.status) as ProviderVerificationStatus,
    mode: String(row.mode) as ProviderVerificationMode,
    summary: String(row.summary),
    details: String(row.details),
    lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : undefined,
    checkedByUserId: row.checked_by_user_id ? String(row.checked_by_user_id) : undefined,
    checkedByEmail: row.checked_by_email ? String(row.checked_by_email) : undefined
  };
}

function upsertProviderVerification(input: {
  verification: ProviderVerification;
  checkedByUserId?: string;
  checkedByEmail?: string;
  checkedAt: string;
}) {
  const v = input.verification;
  getDatabase()
    .prepare(
      `INSERT INTO provider_verifications (id, business_id, integration_kind, status, mode, summary, details, last_checked_at, checked_by_user_id, checked_by_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         mode = excluded.mode,
         summary = excluded.summary,
         details = excluded.details,
         last_checked_at = excluded.last_checked_at,
         checked_by_user_id = excluded.checked_by_user_id,
         checked_by_email = excluded.checked_by_email`
    )
    .run(
      v.id,
      v.businessId,
      v.integrationKind,
      v.status,
      v.mode,
      v.summary,
      v.details,
      input.checkedAt,
      input.checkedByUserId ?? null,
      input.checkedByEmail ?? null
    );
}

// ---------------------------------------------------------------------------
// Install coordination adapter
// ---------------------------------------------------------------------------

function listWorkflowSteps(businessId: string) {
  const rows = getDatabase()
    .prepare(
      `SELECT id, business_id, key, status, notes, summary, owner_user_id, owner_name, owner_email, due_date, priority, last_completed_at, completed_by_user_id, completed_by_email
       FROM install_workflow_steps
       WHERE business_id = ?
       ORDER BY rowid ASC`
    )
    .all(businessId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    key: String(row.key) as InstallWorkflowStepKey,
    status: String(row.status) as InstallWorkflowStepStatus,
    notes: row.notes ? String(row.notes) : undefined,
    summary: row.summary ? String(row.summary) : undefined,
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
    ownerName: row.owner_name ? String(row.owner_name) : undefined,
    ownerEmail: row.owner_email ? String(row.owner_email) : undefined,
    dueDate: row.due_date ? String(row.due_date) : undefined,
    priority: (String(row.priority) || "normal") as InstallWorkflowStepPriority,
    lastCompletedAt: row.last_completed_at ? String(row.last_completed_at) : undefined,
    completedByUserId: row.completed_by_user_id ? String(row.completed_by_user_id) : undefined,
    completedByEmail: row.completed_by_email ? String(row.completed_by_email) : undefined
  }));
}

function upsertWorkflowStep(input: {
  businessId: string;
  key: InstallWorkflowStepKey;
  status: InstallWorkflowStepStatus;
  notes?: string;
  summary?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority: InstallWorkflowStepPriority;
  lastCompletedAt?: string;
  completedByUserId?: string;
  completedByEmail?: string;
}) {
  const id = `${input.businessId}:${input.key}`;
  getDatabase()
    .prepare(
      `INSERT INTO install_workflow_steps (id, business_id, key, status, notes, summary, owner_user_id, owner_name, owner_email, due_date, priority, last_completed_at, completed_by_user_id, completed_by_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         notes = excluded.notes,
         summary = excluded.summary,
         owner_user_id = excluded.owner_user_id,
         owner_name = excluded.owner_name,
         owner_email = excluded.owner_email,
         due_date = excluded.due_date,
         priority = excluded.priority,
         last_completed_at = excluded.last_completed_at,
         completed_by_user_id = excluded.completed_by_user_id,
         completed_by_email = excluded.completed_by_email`
    )
    .run(
      id,
      input.businessId,
      input.key,
      input.status,
      input.notes ?? null,
      input.summary ?? null,
      input.ownerUserId ?? null,
      input.ownerName ?? null,
      input.ownerEmail ?? null,
      input.dueDate ?? null,
      input.priority,
      input.lastCompletedAt ?? null,
      input.completedByUserId ?? null,
      input.completedByEmail ?? null
    );
}

function listWorkflowEvents(businessId: string): InstallWorkflowEvent[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, business_id, step_key, event_type, summary, notes, owner_user_id, owner_name, owner_email, due_date, priority, actor_user_id, actor_email, created_at
       FROM install_workflow_events
       WHERE business_id = ?
       ORDER BY created_at DESC`
    )
    .all(businessId) as Array<Record<string, unknown>>;

  return rows.map(mapWorkflowEventRow);
}

function appendWorkflowEvent(input: {
  businessId: string;
  stepKey: InstallWorkflowStepKey;
  eventType: string;
  summary: string;
  notes?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerEmail?: string;
  dueDate?: string;
  priority?: InstallWorkflowStepPriority;
  actorUserId?: string;
  actorEmail?: string;
}) {
  const id = `${input.businessId}:${input.stepKey}:${input.eventType}:${new Date().toISOString()}`;
  getDatabase()
    .prepare(
      `INSERT INTO install_workflow_events (id, business_id, step_key, event_type, summary, notes, owner_user_id, owner_name, owner_email, due_date, priority, actor_user_id, actor_email, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.businessId,
      input.stepKey,
      input.eventType,
      input.summary,
      input.notes ?? null,
      input.ownerUserId ?? null,
      input.ownerName ?? null,
      input.ownerEmail ?? null,
      input.dueDate ?? null,
      input.priority ?? null,
      input.actorUserId ?? null,
      input.actorEmail ?? null,
      new Date().toISOString()
    );
}

function mapWorkflowEventRow(row: Record<string, unknown>): InstallWorkflowEvent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    stepKey: String(row.step_key) as InstallWorkflowStepKey,
    eventType: String(row.event_type) as InstallWorkflowEvent["eventType"],
    summary: String(row.summary),
    notes: row.notes ? String(row.notes) : undefined,
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
    ownerName: row.owner_name ? String(row.owner_name) : undefined,
    ownerEmail: row.owner_email ? String(row.owner_email) : undefined,
    dueDate: row.due_date ? String(row.due_date) : undefined,
    priority: row.priority ? (String(row.priority) as InstallWorkflowStepPriority) : undefined,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : undefined,
    actorEmail: row.actor_email ? String(row.actor_email) : undefined,
    createdAt: String(row.created_at)
  };
}

function listBusinessAssignees(businessId: string): InstallWorkflowAssignee[] {
  const rows = getDatabase()
    .prepare(
      `SELECT DISTINCT au.id AS user_id, au.name, au.email
       FROM business_memberships bm
       JOIN auth_users au ON au.id = bm.user_id
       WHERE bm.business_id = ? AND bm.status = 'active'
       ORDER BY au.name ASC`
    )
    .all(businessId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    userId: String(row.user_id),
    name: String(row.name),
    email: String(row.email)
  }));
}

// -- Reminder events --

function appendReminderEvent(input: InstallReminderEvent) {
  getDatabase()
    .prepare(
      `INSERT OR REPLACE INTO install_reminder_events (id, business_id, step_id, step_key, reminder_type, event_type, summary, owner_user_id, owner_name, owner_email, actor_user_id, actor_email, created_at, acknowledged_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.id,
      input.businessId,
      input.stepId,
      input.stepKey,
      input.reminderType,
      input.eventType,
      input.summary,
      input.ownerUserId ?? null,
      input.ownerName ?? null,
      input.ownerEmail ?? null,
      input.actorUserId ?? null,
      input.actorEmail ?? null,
      input.createdAt,
      input.acknowledgedAt ?? null
    );
}

function listReminderEvents(businessId: string): InstallReminderEvent[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, business_id, step_id, step_key, reminder_type, event_type, summary, owner_user_id, owner_name, owner_email, actor_user_id, actor_email, created_at, acknowledged_at
       FROM install_reminder_events
       WHERE business_id = ?
       ORDER BY created_at DESC`
    )
    .all(businessId) as Array<Record<string, unknown>>;

  return rows.map(mapReminderEventRow);
}

function mapReminderEventRow(row: Record<string, unknown>): InstallReminderEvent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    stepId: String(row.step_id),
    stepKey: String(row.step_key) as InstallWorkflowStepKey,
    reminderType: String(row.reminder_type) as InstallReminderEvent["reminderType"],
    eventType: String(row.event_type) as InstallReminderEvent["eventType"],
    summary: String(row.summary),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
    ownerName: row.owner_name ? String(row.owner_name) : undefined,
    ownerEmail: row.owner_email ? String(row.owner_email) : undefined,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : undefined,
    actorEmail: row.actor_email ? String(row.actor_email) : undefined,
    createdAt: String(row.created_at),
    acknowledgedAt: row.acknowledged_at ? String(row.acknowledged_at) : undefined
  };
}

// -- Operator notifications --

function findOperatorNotificationByReminder(
  reminderEventId: string,
  operatorUserId: string
): OperatorNotification | null {
  const row = getDatabase()
    .prepare(
      `SELECT * FROM operator_notifications WHERE reminder_event_id = ? AND operator_user_id = ? LIMIT 1`
    )
    .get(reminderEventId, operatorUserId) as Record<string, unknown> | undefined;

  return row ? mapOperatorNotificationRow(row) : null;
}

function createOperatorNotification(input: {
  id: string;
  businessId: string;
  stepId: string;
  stepKey: InstallWorkflowStepKey;
  stepLabel: string;
  operatorUserId: string;
  operatorName?: string;
  operatorEmail?: string;
  reminderEventId: string;
  reminderType: string;
  status: string;
  summary: string;
  createdAt: string;
}) {
  const businessClient = findBusinessClientById(input.businessId);
  getDatabase()
    .prepare(
      `INSERT INTO operator_notifications (id, business_id, business_name, step_id, step_key, step_label, operator_user_id, operator_name, operator_email, reminder_event_id, reminder_type, status, summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.id,
      input.businessId,
      businessClient?.name ?? "",
      input.stepId,
      input.stepKey,
      input.stepLabel,
      input.operatorUserId,
      input.operatorName ?? null,
      input.operatorEmail ?? null,
      input.reminderEventId,
      input.reminderType,
      input.status,
      input.summary,
      input.createdAt
    );
}

function listOperatorNotificationsForOperator(
  operatorUserId: string,
  allowedBusinessIds: string[]
): OperatorNotification[] {
  if (allowedBusinessIds.length === 0) return [];
  const placeholders = allowedBusinessIds.map(() => "?").join(", ");
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM operator_notifications
       WHERE operator_user_id = ? AND business_id IN (${placeholders})
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .all(operatorUserId, ...allowedBusinessIds) as Array<Record<string, unknown>>;

  return rows.map(mapOperatorNotificationRow);
}

function countUnreadNotificationsByBusinessIds(
  businessIds: string[]
): Record<string, number> {
  if (businessIds.length === 0) return {};
  const placeholders = businessIds.map(() => "?").join(", ");
  const rows = getDatabase()
    .prepare(
      `SELECT business_id, COUNT(*) AS count
       FROM operator_notifications
       WHERE business_id IN (${placeholders}) AND status = 'unread'
       GROUP BY business_id`
    )
    .all(...businessIds) as Array<Record<string, unknown>>;

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[String(row.business_id)] = Number(row.count);
  }
  return result;
}

function findOperatorNotificationAccessRecord(notificationId: string) {
  const row = getDatabase()
    .prepare(`SELECT * FROM operator_notifications WHERE id = ? LIMIT 1`)
    .get(notificationId) as Record<string, unknown> | undefined;

  return row ? mapOperatorNotificationRow(row) : null;
}

function markOperatorNotificationRead(notificationId: string, readAt: string) {
  getDatabase()
    .prepare(`UPDATE operator_notifications SET status = 'read', read_at = ? WHERE id = ?`)
    .run(readAt, notificationId);
}

function mapOperatorNotificationRow(row: Record<string, unknown>): OperatorNotification {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    businessName: String(row.business_name ?? ""),
    stepId: String(row.step_id),
    stepKey: String(row.step_key) as InstallWorkflowStepKey,
    stepLabel: String(row.step_label ?? ""),
    operatorUserId: String(row.operator_user_id),
    operatorName: row.operator_name ? String(row.operator_name) : undefined,
    operatorEmail: row.operator_email ? String(row.operator_email) : undefined,
    reminderEventId: String(row.reminder_event_id),
    reminderType: String(row.reminder_type) as OperatorNotification["reminderType"],
    status: String(row.status) as OperatorNotification["status"],
    summary: String(row.summary),
    createdAt: String(row.created_at),
    readAt: row.read_at ? String(row.read_at) : undefined
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJson(value: unknown): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    if (typeof parsed === "object" && parsed !== null) {
      return Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")])
      );
    }
    return {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface PersistenceAdapter {
  business: {
    getDefaultBusinessClient(): BusinessClient;
    findBusinessClientById(businessId: string): BusinessClient | null;
    listBusinessClientsByIds(businessIds: string[]): BusinessClient[];
    findUserByEmail(email: string): AuthenticatedUserIdentity | null;
    findUserById(userId: string): AuthenticatedUserIdentity | null;
    listMembershipsForUser(userId: string): BusinessMembership[];
    listActiveMembershipsForBusiness(businessId: string): BusinessMembership[];
    upsertAuthUser(input: { id: string; email: string; name: string; createdAt: string }): void;
    upsertMembership(input: { id: string; userId: string; businessId: string; role: string; status: string; createdAt: string }): void;
  };
  providers: {
    findProviderConfig(businessId: string, integrationKind: ProviderIntegrationKind): BusinessProviderConfig | null;
    upsertProviderConfig(input: BusinessProviderConfig): void;
    findProviderVerification(businessId: string, integrationKind: ProviderIntegrationKind): ProviderVerification | null;
    upsertProviderVerification(input: { verification: ProviderVerification; checkedByUserId?: string; checkedByEmail?: string; checkedAt: string }): void;
  };
  installCoordination: {
    listWorkflowSteps(businessId: string): ReturnType<typeof listWorkflowSteps>;
    upsertWorkflowStep: typeof upsertWorkflowStep;
    listWorkflowEvents(businessId: string): InstallWorkflowEvent[];
    appendWorkflowEvent: typeof appendWorkflowEvent;
    listBusinessAssignees(businessId: string): InstallWorkflowAssignee[];
    appendReminderEvent(input: InstallReminderEvent): void;
    listReminderEvents(businessId: string): InstallReminderEvent[];
    findOperatorNotificationByReminder(reminderEventId: string, operatorUserId: string): OperatorNotification | null;
    createOperatorNotification: typeof createOperatorNotification;
    listOperatorNotificationsForOperator(operatorUserId: string, allowedBusinessIds: string[]): OperatorNotification[];
    countUnreadNotificationsByBusinessIds(businessIds: string[]): Record<string, number>;
    findOperatorNotificationAccessRecord(notificationId: string): OperatorNotification | null;
    markOperatorNotificationRead(notificationId: string, readAt: string): void;
  };
}

const sqliteAdapter: PersistenceAdapter = {
  business: {
    getDefaultBusinessClient,
    findBusinessClientById,
    listBusinessClientsByIds,
    findUserByEmail,
    findUserById,
    listMembershipsForUser,
    listActiveMembershipsForBusiness,
    upsertAuthUser,
    upsertMembership
  },
  providers: {
    findProviderConfig,
    upsertProviderConfig,
    findProviderVerification,
    upsertProviderVerification
  },
  installCoordination: {
    listWorkflowSteps,
    upsertWorkflowStep,
    listWorkflowEvents,
    appendWorkflowEvent,
    listBusinessAssignees,
    appendReminderEvent,
    listReminderEvents,
    findOperatorNotificationByReminder,
    createOperatorNotification,
    listOperatorNotificationsForOperator,
    countUnreadNotificationsByBusinessIds,
    findOperatorNotificationAccessRecord,
    markOperatorNotificationRead
  }
};

export function getPersistenceAdapter(): PersistenceAdapter {
  return sqliteAdapter;
}
