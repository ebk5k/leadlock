# LeadLock

## Internal Install Checklist

LeadLock includes a lightweight internal delivery checklist layered on top of onboarding and launch readiness. The checklist lives in the dashboard settings and onboarding areas and tracks:

- onboarding completed
- services configured
- working hours configured
- calendar connected
- payment provider connected
- messaging templates configured
- phone / AI receptionist verified
- test booking verified
- test payment verified
- launch approved

Automatic checks are reused where possible, and manual completion flags are persisted for delivery steps that are not yet practical to detect automatically.

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
  - `business_id`
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
  - `business_id`
  - `customer_name`
  - `service`
  - `scheduled_for`
  - `status`
  - `assigned_to`
  - `assigned_employee_id`
  - `notes`
  - `external_calendar_event_id`
  - `calendar_sync_status`
  - `calendar_provider`
  - `calendar_sync_error`

- `employees`
  - `id`
  - `business_id`
  - `name`
  - `role`
  - `phone`
  - `email`
  - `active`

- `calls`
  - `id`
  - `business_id`
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
  - `business_id`
  - `appointment_id`
  - `related_call_id`
  - `related_lead_id`
  - `related_payment_id`
  - `trigger_source`
  - `lead_name`
  - `channel`
  - `message_type`
  - `outcome`
  - `status`
  - `created_at`

- `payments`
  - `id`
  - `business_id`
  - `appointment_id`
  - `amount_cents`
  - `currency`
  - `status`
  - `provider`
  - `description`
  - `checkout_url`
  - `external_checkout_session_id`
  - `external_payment_intent_id`
  - `external_charge_id`
  - `external_refund_id`
  - `failure_reason`
  - `created_at`
  - `updated_at`

- `system_settings`
  - `id`
  - `business_id`
  - `business_name`
  - `business_phone`
  - `business_email`
  - `services`
  - `working_hours`
  - `default_job_price_cents`
  - `currency`
  - `confirmation_message_template`
  - `reminder_message_template`
  - `onboarding_completed`
  - `onboarding_completed_at`
  - `launch_readiness_flags`

- `business_clients`
  - `id`
  - `name`
  - `status`
  - `created_at`

## Client Foundation

LeadLock now includes a lightweight client foundation for future multi-business support.

- `business_clients` stores the current business/client record.
- `system_settings.business_id` associates settings, onboarding, install, and launch readiness data with that client.
- core operational records now also carry `business_id` for the current seeded business:
  - `leads`
  - `appointments`
  - `payments`
  - `employees`
  - `outbound_messages`
  - `calls`
- The current MVP remains backward compatible by seeding and using a default business client.
- Routes and auth stay unchanged for now, but deeper tenant isolation can plug into this foundation later.

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

## Revenue Recovery Automation

LeadLock now creates a first-pass missed-call recovery follow-up when a call webhook is saved with a `missed` or `voicemail` outcome.

- Trigger source:
  - persisted call ingestion through `POST /api/webhooks/calls`
- Recovery records persist to `outbound_messages`
- Recovery records are linked back to the originating call through:
  - `related_call_id`
- Current automation type:
  - `missed_call_recovery`
- The same provider-agnostic messaging service now handles both booking confirmations and missed-call recovery, so unpaid invoice reminders, reactivation campaigns, and no-response lead follow-ups can plug into the same pattern later.

## No-Response Lead Recovery

LeadLock now creates a first-pass lead recovery follow-up for persisted leads that remain unbooked after a lightweight MVP delay check.

- Trigger source:
  - persisted leads loaded through the lead service
- Current MVP delay:
  - 30 minutes after `requested_at`
- Eligibility guardrails:
  - skips leads already marked `booked` or `won`
  - skips leads that already appear attributed to an appointment by customer name
  - skips leads that already have a saved `no_response_lead_recovery` outbound message
- Recovery records persist to `outbound_messages`
- Recovery records are linked back to the originating lead through:
  - `related_lead_id`
- Current automation type:
  - `no_response_lead_recovery`

## Payment Reminder Automation

LeadLock now creates a first-pass payment reminder follow-up for unpaid payment records after a lightweight MVP delay check.

- Trigger source:
  - persisted payments loaded through the payment service
- Current MVP delay:
  - 60 minutes after the payment record's `updated_at`
- Eligibility guardrails:
  - skips payments already marked `paid` or `refunded`
  - skips payments that already have a saved `payment_reminder` outbound message
- Reminder records persist to `outbound_messages`
- Reminder records are linked back to the originating payment through:
  - `related_payment_id`
- Current automation type:
  - `payment_reminder`

## Manual Automation Actions

LeadLock now supports manual trigger/resend controls for the key outbound automations.

- Supported manual actions:
  - booking confirmation
  - missed-call recovery
  - no-response lead recovery
  - payment reminder
- Manual actions use the same `outbound_messages` history table and create a new saved message record for each intentional resend.
- Message history now stores:
  - `trigger_source`
    - `automatic`
    - `manual`

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

## Payments

When a booking is created, LeadLock now creates a provider-agnostic payment request and persists the payment state separately from scheduling.

- Provider selection env var: `PAYMENT_PROVIDER`
- Supported values today: `mock`, `stripe`
- Stripe env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Currency and default pricing now come from persisted system settings
- Secure Stripe webhook endpoint:
  - `POST /api/webhooks/stripe`
  - Requires the standard `Stripe-Signature` header
- Current webhook handling updates persisted payment state for:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
  - `payment_intent.payment_failed`
  - `charge.refunded`

## Dispatch And Field Ops

Appointments now support a first-pass dispatch loop for field execution.

- Execution statuses:
  - `scheduled`
  - `dispatched`
  - `en_route`
  - `on_site`
  - `completed`
  - `canceled`
- Assignment remains intentionally simple for MVP:
  - `assigned_to`
  - `assigned_at`
- Additional job timestamps now persist for future ops analytics:
  - `created_at`
  - `updated_at`
  - `dispatched_at`
  - `en_route_at`
  - `on_site_at`
  - `completed_at`
  - `canceled_at`
- Worker-facing route:
  - `/app/jobs`
- Update endpoint:
  - `PATCH /api/appointments/:appointmentId`

## Employees

LeadLock now has a real employee foundation layer for dispatch assignment.

- Employee management route:
  - `/app/employees`
- Employee API:
  - `GET /api/employees`
  - `POST /api/employees`
- Appointments can now reference a real employee record through `assigned_employee_id`
- Backward compatibility:
  - legacy `assigned_to` text is still preserved and displayed if an older appointment does not yet point to a saved employee
- Employee performance is now computed from persisted appointments and latest payment records:
  - jobs assigned per employee
  - jobs completed per employee
  - active jobs per employee
  - paid revenue per employee where attribution is available
- Employee operations now also surface lightweight labor/utilization indicators:
  - jobs currently in progress per employee
  - average completion duration where timestamps are available
  - utilization snapshot based on in-progress jobs versus completed jobs

## Proof Of Work

Completed jobs can now store closeout details for field execution.

- Appointment fields:
  - `completion_notes`
  - `completion_signature_name`
- New `proof_assets` table:
  - `id`
  - `appointment_id`
  - `file_name`
  - `mime_type`
  - `size_bytes`
  - `storage_path`
  - `created_at`
- Completion route:
  - `POST /api/appointments/:appointmentId/complete`
  - accepts multipart form data with:
    - `completionNotes`
    - `completionSignatureName`
    - one or more `proofFiles`
- Proof asset delivery route:
  - `GET /api/proof-assets/:assetId`
- This stays modular so customer approvals, richer reports, and true signature capture can plug in later.

## Settings

LeadLock now has a persistent settings layer for core business configuration.

- Settings API:
  - `GET /api/settings`
  - `PUT /api/settings`
- Dashboard settings route:
  - `/app/settings`
- Guided onboarding route:
  - `/app/onboarding`
- Launch readiness is now surfaced in settings and onboarding with:
  - automatic checks for business info, services, working hours, templates, calendar provider, and payment provider
  - manual readiness overrides for provider setup when auto-detection is not enough yet
- Persisted settings now drive:
  - booking service options
  - default pricing and currency for payment requests
  - confirmation message templates
- Reminder templates are stored now so reminder automation can plug in later without changing the config model.
- Onboarding writes into the same `system_settings` record and marks setup complete with:
  - `onboarding_completed`
  - `onboarding_completed_at`
- The default `/app` entry now redirects unfinished accounts into onboarding until setup is completed.
