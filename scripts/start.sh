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
echo "  USB AI Workbench"
echo "==================================="
echo "  APP_ROOT:     $APP_ROOT"
echo "  APP_DATA_DIR: $APP_DATA_DIR"
echo "  APP_PORT:     $APP_PORT"
echo "==================================="

cd "$APP_ROOT"

if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js is not installed. Please install Node.js 20+."
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "[ERROR] Node.js 20+ is required. Found: $(node --version)"
  exit 1
fi

if ! command -v pnpm &>/dev/null; then
  echo "[INFO] pnpm not found, installing..."
  npm install -g pnpm
fi

if [ ! -d "$APP_ROOT/node_modules" ]; then
  echo "[INFO] Installing dependencies..."
  pnpm install --frozen-lockfile || pnpm install
fi

if [ ! -d "$APP_ROOT/apps/server/dist" ]; then
  echo "[INFO] Building server..."
  pnpm --filter @usb-ai-workbench/shared build
  pnpm --filter @usb-ai-workbench/server build
fi

if [ ! -d "$APP_ROOT/apps/web/dist" ]; then
  echo "[INFO] Building frontend..."
  pnpm --filter @usb-ai-workbench/web build
fi

echo "[INFO] Starting server on port $APP_PORT..."
node "$APP_ROOT/apps/server/dist/index.js" &
SERVER_PID=$!

echo "[INFO] Server PID: $SERVER_PID"
echo "[INFO] Open http://localhost:${APP_PORT}"
echo "[INFO] Press Ctrl+C to stop."

trap 'echo "[INFO] Stopping..."; kill $SERVER_PID 2>/dev/null; exit 0' INT TERM

wait $SERVER_PID
