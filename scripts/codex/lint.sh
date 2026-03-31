#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
"$repo_root/scripts/codex/bootstrap.sh"
cd "$repo_root"
npm run lint

