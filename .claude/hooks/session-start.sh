#!/bin/bash
# SessionStart hook — installs the screenshot tooling so a session can launch
# and screenshot the app. The site itself is static (no build/deps); this only
# sets up headless Chrome via Puppeteer.
#
# Synchronous (no async wrapper) so Chrome is guaranteed ready before the
# session starts. Idempotent: npm install + Puppeteer's install are no-ops once
# node_modules and the browser are cached.
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# Only needed in Claude Code on the web; skip on local machines that already
# have their own browser/tooling.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Installs puppeteer and, via its postinstall, downloads Chrome to the cache
# (Google's CDN, which the network policy allows — unlike Playwright's).
npm install --no-audit --no-fund

# Belt-and-suspenders: ensure the browser binary is present even if a cached
# node_modules skipped the postinstall download.
npx puppeteer browsers install chrome

echo "✅ Screenshot tooling ready — run: npm run screenshot -- schedule"
