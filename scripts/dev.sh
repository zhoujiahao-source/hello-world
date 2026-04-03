#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export APP_ROOT
export APP_DATA_DIR="${APP_DATA_DIR:-${APP_ROOT}/portable-data}"
export APP_PORT="${APP_PORT:-4000}"
export VITE_PORT="${VITE_PORT:-5173}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${APP_PORT}}"

echo "[DEV] USB AI Workbench — development mode"
echo "[DEV] APP_ROOT: $APP_ROOT"

cd "$APP_ROOT"

if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi

if [ ! -d "$APP_ROOT/node_modules" ]; then
  echo "[DEV] Installing dependencies..."
  pnpm install
fi

echo "[DEV] Building shared package..."
pnpm --filter @usb-ai-workbench/shared build

echo "[DEV] Starting dev servers..."

# Start server in dev mode
(cd "$APP_ROOT/apps/server" && pnpm dev) &
SERVER_PID=$!

# Start frontend in dev mode
(cd "$APP_ROOT/apps/web" && pnpm dev) &
WEB_PID=$!

echo "[DEV] Server:   http://localhost:${APP_PORT}"
echo "[DEV] Frontend: http://localhost:${VITE_PORT}"
echo "[DEV] Press Ctrl+C to stop all."

trap 'echo "[DEV] Stopping..."; kill $SERVER_PID $WEB_PID 2>/dev/null; exit 0' INT TERM

wait
