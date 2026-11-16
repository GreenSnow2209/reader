#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
export PATH="/home/ttson/.nvm/versions/node/v24.21.0/bin:/home/ttson/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Execute the native Electron binary directly with no-sandbox and auto ozone platform
exec "$DIR/node_modules/electron/dist/electron" \
  --no-sandbox \
  --ozone-platform-hint=auto \
  "$DIR" "$@"
