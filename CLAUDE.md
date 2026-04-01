# LeadLock — Claude Code Context File
> Drop this file into the root of your LeadLock repo as `CLAUDE.md`.
> Claude Code reads this automatically every session — no re-explaining needed.

---

## What LeadLock Is

LeadLock is a **field-service operating system** for local service businesses (plumbers, HVAC, contractors, roofers, electricians, landscapers). It is not a generic dashboard. It is a full operating system that replaces fragmented paper/phone/app chaos with one control center.

**The owner experience:** Wake up, see your schedule full, go to the first job, get paid, on to the next — all systemized under one app.

**The worker experience:** Jobs arrive like missions. Go here, do this, close it with proof.

**The core loop:**
```
Lead / Call → Booking → Confirmation → Calendar → Payment → Dispatch → Employee → Execution → Proof of Work → Dashboard → Recovery Automation
```

---

## Current Stack

- **Next.js App Router** (TypeScript)
- **Tailwind CSS**
- **React Hook Form + Zod**
- **Recharts**
- **SQLite** via `node:sqlite` (experimental — future migration to Postgres planned)
- **Service-layer architecture** — all business logic lives in `src/lib/services`, not in route handlers

---

## Project Structure

```
src/
  app/           # Next.js routes (marketing site + /app dashboard)
  components/    # Shared UI components
  features/      # Feature-scoped UI
  lib/
    services/    # All business logic (lead, appointment, payment, employee, etc.)
    data/        # Persistence adapter + SQLite implementation
    auth/        # Session, memberships, business context
    providers/   # Calendar, payment, messaging, receptionist abstractions
  types/
scripts/codex/   # Bootstrap, dev, lint, build scripts
```

---

## What Is Already Built

| Capability | Status | Notes |
|---|---|---|
| Lead capture | ✅ Done | Persisted, feeds dashboard + recovery |
| Call ingestion | ✅ Done | Webhook-driven via `POST /api/webhooks/calls` |
| Booking flow | ✅ Done | Persisted, settings-integrated |
| Confirmation messaging | ✅ Done | Provider-agnostic outbound workflow |
| Calendar sync | ✅ Done | Google Calendar + mock provider |
| Payments | ✅ Done | Stripe + webhook reconciliation |
| Dispatch loop | ✅ Done | scheduled → dispatched → en_route → on_site → completed → canceled |
| Employee model | ✅ Done | Persisted, assignment, performance, utilization |
| Proof of work | ✅ Done | Notes, signature text, photo uploads |
| Settings layer | ✅ Done | Persistent business config, templates, pricing |
| Onboarding wizard | ✅ Done | Ties directly into settings persistence |
| Launch readiness | ✅ Done | Auto + manual checks, client-facing visibility |
| Recovery automations | ✅ Done | Missed call, no-response lead, unpaid payment |
| Manual action controls | ✅ Done | Operator resend/retry with audit trail |
| Install checklist | ✅ Done | Internal delivery SOP support |
| Multi-client foundation | ✅ Done | `business_clients` table, `business_id` scoping on core tables |
| Persistence adapter | ✅ Done | `src/lib/data/adapter.ts` + `sqlite-adapter.ts` |
| Provider verification | ✅ Done | Config-validation checks per business |
| Operator notifications | ✅ Done | In-app inbox, reminder delivery, mark-read |
| Internal ops dashboard | ✅ Done | `/app/ops` — cross-business install progress |

---

## Demo Login

- **Email:** demo@leadlock.app
- **Password:** demo1234

---

## Key Architecture Rules (Never Break These)

1. **Everything must be `business_id` scoped** — no unscoped writes to operational tables
2. **No direct DB access from routes** — always go through the service layer and adapter
3. **No disconnected features** — every feature must strengthen the core operating loop
4. **Preserve MVP behavior** — backward-compatible changes only, never break the single-business demo flow
5. **Centralize logic** — heavy logic in services, keep routes and components thin
6. **Provider abstractions** — calendar, payment, messaging, and receptionist logic must stay behind their provider interfaces in `src/lib/providers`
7. **Audit trail** — all outbound message actions write to `outbound_messages` with `trigger_source` (automatic vs manual)
8. **Migration-safe DB changes** — add columns with defaults, never destructive migrations

---

## What Is NOT Done Yet (Priority Order)

### 🔴 Immediate — Real-World Phone Flow
The entire system has never been tested with a real phone call. This is the #1 gap.

**Goal:** A real person calls a phone number → AI receptionist answers → books the appointment → LeadLock ingests the call and appointment → owner sees it in the dashboard.

**What needs to be built:**
- Vapi.ai (or Retell AI) integration as the AI receptionist provider
- Agent prompt template auto-generated from business settings (services, hours, business name)
- Vapi tool call → `POST /api/appointments` (mid-conversation booking)
- End-of-call webhook → `POST /api/webhooks/calls` (already exists, needs Vapi payload mapping)
- Phone number provisioning flow during onboarding
- Web embed widget on `/` and `/book` pages (click-to-call)

**Why Vapi over Retell:** Better tool-call system for mid-conversation booking, cleaner white-label path for productizing across multiple client businesses. Retell is acceptable if already configured.

### 🟡 Next — Productized Onboarding of the Phone System
During onboarding, LeadLock should:
1. Pull business name, services, hours from settings
2. Auto-generate the AI receptionist agent prompt
3. Provision a phone number via Vapi API
4. Embed the web widget automatically on the client's site

Zero manual steps for the client.

### 🟡 Next — Remaining Adapter Migration
These domains still use direct SQLite, not the adapter:
- leads
- appointments
- payments
- messaging / calls / proof-work operational flows
- parts of settings storage and guard logic

Migrate these to go through `adapter.ts` so a future Postgres adapter can be swapped in cleanly.

### 🟢 Later — Timesheet / Payroll Foundation
The data is already there: `employees` table, `dispatched_at`, `en_route_at`, `on_site_at`, `completed_at` timestamps. Build the timesheet layer on top once phone + booking flow is proven in the real world.

### 🟢 Later — Production Database
Move off `node:sqlite` (experimental) to Postgres when the first real client is being onboarded. The adapter layer makes this a swap, not a rewrite.

---

## Current System Status

| Layer | Completeness |
|---|---|
| System / codebase | ~70% |
| Business / go-to-market | ~30% |
| Real-world proven | ~10% |

The code is sophisticated. The gap is real-world usage. The phone call flow is the first proof point.

---

## Immediate Next Task for Claude Code

**Wire Vapi.ai as the AI receptionist provider so a real call creates a real appointment.**

Specifically:
1. Add `vapi` as a supported value for the `RECEPTIONIST_PROVIDER` env var alongside `mock`
2. Create `src/lib/providers/receptionist/vapi-provider.ts` following the same pattern as the calendar and payment provider abstractions
3. Map the Vapi end-of-call webhook payload fields to the existing `POST /api/webhooks/calls` schema (Vapi uses `call.customer.number`, `call.summary`, `call.transcript`, `call.endedReason` etc.)
4. Add a Vapi tool call definition that the agent can use mid-conversation to POST to `/api/appointments`
5. Add the agent prompt template generator in settings-service that builds the receptionist script from `business_name`, `services`, and `working_hours`
6. Document required env vars: `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_WEBHOOK_SECRET`

---

## Business Context

- **Model:** Done-for-you install + monthly subscription. Client pays setup fee, gets a fully configured operating system. No software expertise required on their end.
- **Target:** Owner-operators in trades — plumbing, HVAC, roofing, electrical, landscaping, used oil collection, general contractors.
- **Pitch:** "We install a system that handles your calls, bookings, scheduling, payments, follow-ups, and job tracking in one place. You wake up and your schedule is already full."
- **Expansion path:** Single-business installs → repeatable delivery → multi-client platform → vertical templates

---

## Running the Project

```bash
cp .env.example .env.local
npm install
npm run dev
```

Codex-friendly scripts in `scripts/codex/`:
- `./scripts/codex/bootstrap.sh` — install deps
- `./scripts/codex/dev.sh` — start dev server
- `./scripts/codex/lint.sh` — lint
- `./scripts/codex/build.sh` — build

Enable git hooks once:
```bash
git config core.hooksPath .githooks
```

---

## Philosophy (Read Before Making Any Changes)

- Build complete loops, not disconnected features
- If a feature doesn't strengthen the core operating loop, delay it
- Autonomy matters, but operator control matters too
- Installability is as important as product power
- Repeatability across clients is the long-term business lever
- Keep the owner story obvious: captured demand → booked work → paid work → tracked execution → recovered leaks
- Clarity is a feature — don't overengineer before the go-to-market loop is proven
