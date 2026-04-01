import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATABASE_PATH = process.env.DATABASE_PATH ?? "./data/leadlock.sqlite";

let db: DatabaseSync | null = null;

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS business_clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'launching',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS business_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    business_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    business_name TEXT NOT NULL DEFAULT '',
    business_phone TEXT NOT NULL DEFAULT '',
    business_email TEXT NOT NULL DEFAULT '',
    services TEXT NOT NULL DEFAULT '[]',
    working_hours TEXT NOT NULL DEFAULT '[]',
    default_job_price_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'usd',
    confirmation_message_template TEXT NOT NULL DEFAULT '',
    reminder_message_template TEXT NOT NULL DEFAULT '',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    onboarding_completed_at TEXT,
    launch_readiness_flags TEXT NOT NULL DEFAULT '{}',
    install_checklist_flags TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    name TEXT NOT NULL,
    business TEXT,
    email TEXT,
    phone TEXT,
    service TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new',
    location TEXT NOT NULL DEFAULT '',
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    value REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    customer_name TEXT NOT NULL,
    service TEXT NOT NULL,
    scheduled_for TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    assigned_to TEXT,
    assigned_employee_id TEXT,
    dispatched_at TEXT,
    en_route_at TEXT,
    on_site_at TEXT,
    completed_at TEXT,
    canceled_at TEXT,
    payment_id TEXT,
    calendar_event_id TEXT,
    calendar_sync_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    appointment_id TEXT,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL DEFAULT 'mock',
    checkout_session_id TEXT,
    checkout_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    caller_name TEXT NOT NULL DEFAULT 'Unknown Caller',
    caller_number TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    summary TEXT NOT NULL DEFAULT '',
    transcript_preview TEXT NOT NULL DEFAULT '',
    call_status TEXT NOT NULL DEFAULT 'completed',
    outcome TEXT NOT NULL DEFAULT 'unknown',
    duration_minutes REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS outbound_messages (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    message_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    trigger_source TEXT NOT NULL DEFAULT 'automatic',
    recipient TEXT,
    body TEXT,
    related_id TEXT,
    related_type TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proof_assets (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    business_id TEXT,
    file_name TEXT NOT NULL DEFAULT '',
    file_type TEXT NOT NULL DEFAULT '',
    file_size INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS business_provider_configs (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    integration_kind TEXT NOT NULL,
    provider_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    config TEXT NOT NULL DEFAULT '{}',
    secrets TEXT NOT NULL DEFAULT '{}',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS provider_verifications (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    integration_kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    mode TEXT NOT NULL DEFAULT 'config_validation',
    summary TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    last_checked_at TEXT,
    checked_by_user_id TEXT,
    checked_by_email TEXT
  );

  CREATE TABLE IF NOT EXISTS install_workflow_steps (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT,
    summary TEXT,
    owner_user_id TEXT,
    owner_name TEXT,
    owner_email TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'normal',
    last_completed_at TEXT,
    completed_by_user_id TEXT,
    completed_by_email TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS install_workflow_events (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    step_key TEXT NOT NULL,
    event_type TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    notes TEXT,
    owner_user_id TEXT,
    owner_name TEXT,
    owner_email TEXT,
    due_date TEXT,
    priority TEXT,
    actor_user_id TEXT,
    actor_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS install_reminder_events (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    step_key TEXT NOT NULL,
    reminder_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    owner_user_id TEXT,
    owner_name TEXT,
    owner_email TEXT,
    actor_user_id TEXT,
    actor_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    acknowledged_at TEXT
  );

  CREATE TABLE IF NOT EXISTS operator_notifications (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT '',
    step_id TEXT NOT NULL,
    step_key TEXT NOT NULL,
    step_label TEXT NOT NULL DEFAULT '',
    operator_user_id TEXT NOT NULL,
    operator_name TEXT,
    operator_email TEXT,
    reminder_event_id TEXT NOT NULL,
    reminder_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    summary TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read_at TEXT
  );
`;

function initializeDatabase(): DatabaseSync {
  const resolvedPath = path.resolve(DATABASE_PATH);
  ensureDirectoryExists(resolvedPath);

  const instance = new DatabaseSync(resolvedPath);
  instance.exec(SCHEMA);
  return instance;
}

export function getDatabase(): DatabaseSync {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}
