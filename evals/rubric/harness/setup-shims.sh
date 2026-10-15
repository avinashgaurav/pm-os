#!/bin/sh
# Eval-only. src/lib/ai.ts imports @sentry/nextjs and (via schemas) zod at module load.
# Instead of a full `npm ci`, put a no-op Sentry stub and a standalone zod into the
# gitignored ./node_modules so Bun can load the real buildModulePrompt.
# If a real install is already there, it is left alone (Bun can load it as is).
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SENTRY="$ROOT/node_modules/@sentry/nextjs"
if [ -f "$SENTRY/package.json" ] && ! grep -q '"0.0.0-eval"' "$SENTRY/package.json"; then
  echo "real @sentry/nextjs found; not overwriting it (no shim needed)"
else
  mkdir -p "$SENTRY"
  printf '{"name":"@sentry/nextjs","version":"0.0.0-eval","type":"module","main":"index.mjs"}' > "$SENTRY/package.json"
  printf 'export const captureException = () => {};\nexport const captureMessage = () => {};\n' > "$SENTRY/index.mjs"
fi
if [ -d "$ROOT/node_modules/zod" ]; then
  echo "zod already present; not overwriting it"
else
  TMP="$(mktemp -d)"; (cd "$TMP" && npm init -y >/dev/null && npm install zod@^4.4.3 --silent)
  cp -R "$TMP/node_modules/zod" "$ROOT/node_modules/zod"; rm -rf "$TMP"
fi
echo "shims ready in ./node_modules"
