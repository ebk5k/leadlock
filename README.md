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

LeadLock now also includes a persistence adapter/repository foundation under [`src/lib/data`](/Users/user/leadlock/src/lib/data) so service logic can depend less directly on `node:sqlite`.

- Why it exists:
  - reduce direct runtime coupling to the current SQLite implementation
  - make future migration to a production-grade database safer and more incremental
  - keep business-scoped service logic stable while storage implementations evolve
- Domains abstracted behind the adapter in this pass:
  - business clients and memberships
  - business-scoped provider configs and provider verifications
  - install workflow state, history, reminder events, and operator notifications
- Still SQLite-specific for now:
  - leads
  - appointments
  - payments
  - messaging/call/proof-work operational flows
  - parts of settings and guard logic

SQLite remains the active adapter implementation today, so app behavior is unchanged while the storage boundary becomes more portable.

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

- `proof_assets`
  - `id`
  - `business_id`
  - `appointment_id`
  - `file_name`
  - `mime_type`
  - `size_bytes`
  - `storage_path`
  - `created_at`

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
  - `install_checklist_flags`

- `business_clients`
  - `id`
  - `name`
  - `status`
  - `created_at`

- `business_provider_configs`
  - `id`
  - `business_id`
  - `integration_kind`
  - `provider_name`
  - `status`
  - `config_json`
  - `secret_json`
  - `metadata_json`
  - `created_at`
  - `updated_at`

- `provider_verifications`
  - `id`
  - `business_id`
  - `integration_kind`
  - `verification_status`
  - `verification_mode`
  - `last_checked_at`
  - `summary`
  - `details`
  - `checked_by_user_id`
  - `checked_by_email`
  - `created_at`
  - `updated_at`

- `install_workflow_steps`
  - `id`
  - `business_id`
  - `step_key`
  - `step_status`
  - `notes`
  - `summary`
  - `owner_user_id`
  - `owner_name`
  - `owner_email`
  - `due_date`
  - `priority`
  - `last_completed_at`
  - `completed_by_user_id`
  - `completed_by_email`
  - `created_at`
  - `updated_at`

- `install_workflow_events`
  - `id`
  - `business_id`
  - `step_key`
  - `event_type`
  - `summary`
  - `notes`
  - `owner_user_id`
  - `owner_name`
  - `owner_email`
  - `due_date`
  - `priority`
  - `actor_user_id`
  - `actor_email`
  - `created_at`

- `install_workflow_reminder_events`
  - `id`
  - `business_id`
  - `step_id`
  - `step_key`
  - `reminder_type`
  - `event_type`
  - `summary`
  - `owner_user_id`
  - `owner_name`
  - `owner_email`
  - `actor_user_id`
  - `actor_email`
  - `created_at`
  - `acknowledged_at`

- `operator_notifications`
  - `id`
  - `business_id`
  - `step_id`
  - `step_key`
  - `step_label`
  - `operator_user_id`
  - `operator_name`
  - `operator_email`
  - `reminder_event_id`
  - `reminder_type`
  - `notification_status`
  - `summary`
  - `created_at`
  - `read_at`

## Client Foundation

LeadLock now includes a lightweight client foundation for future multi-business support.

- `business_clients` stores the current business/client record.
- `auth_users` stores authenticated internal/demo identities.
- `business_memberships` links those identities to one or more allowed businesses, with a simple `role` and active/inactive membership state for future expansion.
- `business_provider_configs` stores business-scoped provider configuration and secrets for integrations such as payments, messaging, calendar sync, and receptionist/webhook trust.
- `system_settings.business_id` associates settings, onboarding, install, and launch readiness data with that client.
- core operational records now also carry `business_id` for the current seeded business:
  - `leads`
  - `appointments`
  - `payments`
  - `employees`
  - `outbound_messages`
  - `calls`
- active business resolution now runs through a dedicated business context resolver:
  - first resolves the authenticated session identity
  - then refreshes allowed business ids from persisted memberships when available
  - then only honors `x-leadlock-business-id` or the `leadlock_business` cookie if that requested business is authorized for the current session
  - otherwise falls back safely to the session's active/default business
- core services now resolve business scope through that business context layer instead of reading the settings store as the primary source of truth
- auth/session cookies now carry:
  - authenticated user identity
  - allowed business ids
  - active business id
- active business switching now runs through a guarded internal auth route:
  - the requested business id must belong to the current session's persisted allowed membership set
  - the session cookie and `leadlock_business` cookie are updated together only after authorization succeeds
- provider resolution now runs through a shared business-scoped config resolver:
  - it first checks for an active `business_provider_configs` record for the authorized business
  - if none exists yet, it safely falls back to the current env-based MVP/demo configuration
  - Stripe, calendar, messaging, and receptionist webhook validation now use that centralized path
- internal operators can now manage those business-scoped provider settings directly from the dashboard settings flow for the active business:
  - payments
  - calendar
  - messaging
  - receptionist / webhook trust
- the install/settings UI shows whether each provider is using fallback/default config or a saved business-scoped override, which makes multi-client launch work more repeatable without code edits
- provider verification results now persist per business in `provider_verifications`, so install teams can see:
  - pass / fail / pending state
  - last checked timestamp
  - result summary and details
  - which authenticated identity last ran the check when available
- current verification coverage is intentionally honest and centralized:
  - payments: validates mock mode or required Stripe config presence
  - calendar: validates mock mode or required Google Calendar config presence
  - messaging: validates the currently configured provider path
  - receptionist: validates webhook trust secret presence
  - these are currently configuration-validation checks, not full live end-to-end probes
- launch readiness now distinguishes between provider config and provider verification more clearly:
  - payment and calendar readiness require a successful verification result unless manually overridden
  - messaging and receptionist verification now appear in the readiness view for the active business
- install delivery now also persists a business-scoped install workflow in `install_workflow_steps`:
  - provider config reviewed
  - payments verified
  - calendar verified
  - messaging verified
  - receptionist verified
  - test booking verified
  - test payment verified
  - launch approved
- provider verification now feeds install workflow automatically where appropriate:
  - provider verification steps are verification-driven and update from the latest saved provider check
  - operator-only steps such as provider review, booking/payment test confirmation, and launch signoff remain manual and auditable
- install workflow steps now also support accountable delivery coordination:
  - owner / assigned internal operator
  - due date
  - priority
  - append-only structured history in `install_workflow_events`
- structured install history records actions such as:
  - assigned / unassigned
  - marked complete / marked incomplete
  - force-approved
  - due date changed
  - note added
  - priority changed
- the settings workflow UI now shows current ownership, due dates, and recent history per step, and the cross-business `/app/ops` dashboard surfaces overdue or unassigned install work across allowed businesses
- overdue install reminder tracking now persists append-only events in `install_workflow_reminder_events`:
  - each reminder is linked directly to the persisted install step via `step_id`
  - reminder records also carry a `reminder_type` so future upcoming reminders can share the same model
  - overdue reminder generated
  - reminder acknowledged
- reminder sweeps now run through one centralized service:
  - manual/internal trigger today via `POST /api/install-reminders`
  - ready for scheduled automation later without rewriting install logic
  - can generate overdue reminders and upcoming-soon reminders
  - uses reminder throttling so repeat sweeps do not spam duplicate reminder events
- operator-targeted reminder delivery now persists to `operator_notifications`:
  - each generated reminder can create one operator inbox record for the assigned owner
  - notifications are stored business-scoped and tied back to the reminder event
  - notifications support unread/read state for lightweight in-app coordination
- operator workload views in `/app/ops` now group open install work by assigned operator and surface:
  - a "My tasks" slice for the currently authenticated operator
  - assigned businesses
  - assigned steps
  - due dates
  - overdue status
  - priority
  - blocking step context
- the ops dashboard now also includes an internal operator inbox:
  - unread reminder deliveries
  - recent upcoming/overdue coordination signals
  - mark-read handling for in-app notification hygiene
- overdue reminders are currently triggered through an internal manual flow:
  - `POST /api/install-reminders` runs a reminder sweep across the current authorized ops dataset
  - `PUT /api/install-reminders` acknowledges a reminder for a specific business step
  - `PUT /api/operator-notifications` marks a delivered operator notification as read
  - this is designed so scheduled automation can reuse the same service later
- launch approval is now controlled through the install workflow:
  - normal launch signoff is only allowed when required prerequisite steps are complete
  - a clearly labeled force-approve path exists for manual operator override when needed
- `/app/ops` now provides an internal client-ops dashboard for the businesses the current operator is allowed to access:
  - business name and workspace status
  - provider config and provider verification summaries
  - install workflow progress and launch approval state
  - recent delivery activity signals
  - safe jump/switch actions into the active business setup flow
- the client-ops dashboard reuses provider config, provider verification, install workflow, and launch readiness logic instead of duplicating cross-business status rules in the UI
- unauthorized cookie/header-only business switching is ignored safely, so provider/webhook and service guard layers now sit on top of an authorized business context instead of an implicit request hint
- webhook/provider and other write-sensitive paths now run through a shared business guard:
  - explicit incoming business ids are validated against known businesses
  - persisted record associations are preferred for payment and linked update mutations
  - mismatched cross-business writes are blocked and logged before mutation
- proof assets now carry direct `business_id` scope and inherit ownership from the guarded linked appointment
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
