#!/bin/sh
# Eval-only. src/lib/ai.ts imports @sentry/nextjs and (via schemas) zod at module load.
# Instead of a full `npm ci`, put a no-op Sentry stub and a standalone zod into the
# gitignored ./node_modules so Bun can load the real buildModulePrompt.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
mkdir -p "$ROOT/node_modules/@sentry/nextjs"
printf '{"name":"@sentry/nextjs","version":"0.0.0-eval","type":"module","main":"index.mjs"}' > "$ROOT/node_modules/@sentry/nextjs/package.json"
printf 'export const captureException = () => {};\nexport const captureMessage = () => {};\n' > "$ROOT/node_modules/@sentry/nextjs/index.mjs"
if [ ! -d "$ROOT/node_modules/zod" ]; then
  TMP="$(mktemp -d)"; (cd "$TMP" && npm init -y >/dev/null && npm install zod@^4.4.3 --silent)
  cp -R "$TMP/node_modules/zod" "$ROOT/node_modules/zod"; rm -rf "$TMP"
fi
echo "shims ready in $ROOT/node_modules"
