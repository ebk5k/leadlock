# LeadLock

LeadLock is a mobile-first web platform for local service businesses with two connected experiences:

- Public marketing site: `/`, `/demo`, `/book`, `/pricing`
- Private customer app: `/login`, `/app`, `/dashboard`

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Recharts
- SQLite via Node's built-in `node:sqlite`

## MVP Notes

- Uses mock data first for leads, appointments, calls, receptionist activity, follow-ups, analytics, and settings
- Uses a simple cookie-based demo auth flow for the dashboard
- Keeps future integration seams behind service interfaces in `src/lib/services`

## Demo Login

- Email: `demo@leadlock.app`
- Password: `demo1234`

## Getting Started

Once Node.js is installed:

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Codex-Friendly Local Setup

- Bootstrap dependencies: `./scripts/codex/bootstrap.sh`
- Dev server: `./scripts/codex/dev.sh`
- Lint: `./scripts/codex/lint.sh`
- Build: `./scripts/codex/build.sh`

To auto-bootstrap dependencies after switching branches or creating worktrees, enable the repo hooks path once:

```bash
git config core.hooksPath .githooks
```

## Project Shape

```text
src/
  app/
  components/
  features/
  lib/
  types/
```

## Persistence

Lead and appointment records now persist to a local SQLite database.

- Default database path: `./data/leadlock.sqlite`
- Override with `DATABASE_PATH` in `.env.local`

Current schema:

- `leads`
  - `id`
  - `name`
  - `business`
  - `email`
  - `phone`
  - `service`
  - `source`
  - `status`
  - `location`
  - `requested_at`
  - `value`

- `appointments`
  - `id`
  - `customer_name`
  - `service`
  - `scheduled_for`
  - `status`
  - `assigned_to`
  - `notes`
  - `external_calendar_event_id`
  - `calendar_sync_status`
  - `calendar_provider`
  - `calendar_sync_error`

- `calls`
  - `id`
  - `caller_name`
  - `caller_number`
  - `timestamp`
  - `summary`
  - `transcript_preview`
  - `call_status`
  - `outcome`
  - `duration_minutes`

- `outbound_messages`
  - `id`
  - `appointment_id`
  - `lead_name`
  - `channel`
  - `message_type`
  - `outcome`
  - `status`
  - `created_at`

## Webhook Ingestion

LeadLock now supports a secure webhook endpoint for AI receptionist call ingestion:

- Endpoint: `POST /api/webhooks/calls`
- Secret env var: `CALL_WEBHOOK_SECRET`
- Header support:
  - `x-leadlock-webhook-secret`
  - `x-webhook-secret`
  - `Authorization: Bearer <secret>`

Accepted payload fields:

- `id`
- `callerName` or `caller_name`
- `callerNumber` or `caller_number`
- `timestamp`
- `summary`
- `transcriptPreview` or `transcript_preview`
- `callStatus` or `call_status`
- `outcome`
- `durationMinutes` or `duration_minutes`

## Booking Confirmation Messaging

When a booking is created, LeadLock now triggers a provider-agnostic confirmation workflow.

- Current provider mode: `mock`
- Env var: `MESSAGING_PROVIDER`
- Message records persist to `outbound_messages`
- Dashboard follow-ups read from saved outbound message records rather than mock-only data

## Google Calendar Sync

When a booking is created, LeadLock now attempts to sync an external calendar event.

- Provider selection env var: `CALENDAR_PROVIDER`
- Supported values today: `mock`, `google`
- Appointment records persist:
  - `external_calendar_event_id`
  - `calendar_sync_status`
  - `calendar_provider`
  - `calendar_sync_error`
- Google Calendar env vars:
  - `GOOGLE_CALENDAR_ID`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN`
  - `GOOGLE_CALENDAR_TIMEZONE`
