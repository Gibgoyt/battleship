#!/usr/bin/env bash
# Build the single-file bundle for the monopoly-game worker.
#
# Output:
#   src/worker.bundle.js  — paste this into the Cloudflare dashboard editor.
#
# Usage:
#   ./build.sh
#
# Requirements: node >= 16 (no other npm deps). Wrangler is NOT required for
# this script — it only writes a file. Use `npx wrangler deploy` separately
# if you'd rather deploy from the CLI than the dashboard.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

command -v node >/dev/null 2>&1 || {
  echo "node not found in PATH" >&2
  exit 1
}

node ./bundle.mjs
echo ""
echo "Next: open src/worker.bundle.js, copy it, and paste into the"
echo "Cloudflare dashboard worker editor. See DASHBOARD_DEPLOY.md."
