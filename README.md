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
