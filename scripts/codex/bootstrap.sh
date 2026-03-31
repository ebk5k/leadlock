#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"

if [ ! -f package.json ]; then
  echo "No package.json found. Skipping bootstrap."
  exit 0
fi

if [ ! -d node_modules ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "Dependencies already installed."
fi

