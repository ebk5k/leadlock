# LeadLock Agent Notes

LeadLock is a Next.js App Router project for a public marketing site and a private dashboard.

## Setup

- Run `./scripts/codex/bootstrap.sh` after cloning or creating a new worktree.
- If Git hooks are enabled for the repo, `post-checkout` will call the same bootstrap script automatically.

## Common Commands

- Dev server: `./scripts/codex/dev.sh`
- Lint: `./scripts/codex/lint.sh`
- Build: `./scripts/codex/build.sh`

## Project Guidance

- Keep marketing and dashboard styling aligned under one brand.
- Use the existing mock data and service layer for product UX work.
- Avoid adding real integrations unless explicitly requested.

