#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export APP_ROOT
export APP_DATA_DIR="${APP_DATA_DIR:-${APP_ROOT}/portable-data}"
export APP_PORT="${APP_PORT:-4000}"
export VITE_PORT="${VITE_PORT:-5173}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${APP_PORT}}"

echo "==================================="
echo "  USB AI Workbench (Portable)"
echo "==================================="
echo "  APP_ROOT:     $APP_ROOT"
echo "  APP_DATA_DIR: $APP_DATA_DIR"
echo "  APP_PORT:     $APP_PORT"
echo "==================================="

cd "$APP_ROOT"

TARGET=""
UNAME_S="$(uname -s)"
UNAME_M="$(uname -m)"
if [[ "$UNAME_S" == "Linux" && "$UNAME_M" == "x86_64" ]]; then
  TARGET="linux-x64"
elif [[ "$UNAME_S" == "Linux" && "$UNAME_M" == "aarch64" ]]; then
  TARGET="linux-arm64"
elif [[ "$UNAME_S" == "Darwin" && "$UNAME_M" == "x86_64" ]]; then
  TARGET="darwin-x64"
elif [[ "$UNAME_S" == "Darwin" && "$UNAME_M" == "arm64" ]]; then
  TARGET="darwin-arm64"
fi

NODE_CMD=""
if [[ -n "$TARGET" ]]; then
  for C in \
    "$APP_ROOT/target/runtime/bin/node" \
    "$APP_ROOT/target/runtime/node" \
    "$APP_ROOT/targets/$TARGET/runtime/bin/node"; do
    if [[ -x "$C" ]]; then
      NODE_CMD="$C"
      break
    fi
  done
fi

if [[ -z "$NODE_CMD" && -x "$APP_ROOT/target/runtime/node.exe" ]]; then
  NODE_CMD="$APP_ROOT/target/runtime/node.exe"
fi

if [[ -z "$NODE_CMD" ]]; then
  if command -v node >/dev/null 2>&1; then
    NODE_CMD="$(command -v node)"
    echo "[WARN] Bundled Node runtime not found, falling back to system Node: $NODE_CMD"
  else
    echo "[ERROR] No bundled Node runtime found and system Node is unavailable."
    echo "[ERROR] Please use a packaged portable bundle or run portable build on a development machine."
    exit 1
  fi
fi

echo "[INFO] Launching via: $NODE_CMD"
if [[ -f "$APP_ROOT/launch-portable.ts" ]]; then
  exec "$NODE_CMD" "$APP_ROOT/launch-portable.ts"
fi
exec "$NODE_CMD" "$APP_ROOT/scripts/launch-portable.ts"
