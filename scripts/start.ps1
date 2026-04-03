# USB AI Workbench — Windows PowerShell start script
param(
  [int]$Port = 4000,
  [int]$VitePort = 5173
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir

$env:APP_ROOT = $AppRoot
$env:APP_DATA_DIR = if ($env:APP_DATA_DIR) { $env:APP_DATA_DIR } else { Join-Path $AppRoot "portable-data" }
$env:APP_PORT = if ($env:APP_PORT) { $env:APP_PORT } else { $Port }
$env:VITE_PORT = if ($env:VITE_PORT) { $env:VITE_PORT } else { $VitePort }
$env:VITE_API_BASE_URL = "http://localhost:$($env:APP_PORT)"

Write-Host "==================================="
Write-Host "  USB AI Workbench"
Write-Host "==================================="
Write-Host "  APP_ROOT:     $($env:APP_ROOT)"
Write-Host "  APP_DATA_DIR: $($env:APP_DATA_DIR)"
Write-Host "  APP_PORT:     $($env:APP_PORT)"
Write-Host "==================================="
Write-Host ""
Write-Host "[INFO] Note: On Windows, some providers may not be available natively."
Write-Host "[INFO] Consider using WSL2 for full compatibility."
Write-Host ""

Set-Location $AppRoot

$nodeVersion = & node --version 2>$null
if (-not $?) {
  Write-Error "Node.js is not installed. Please install Node.js 20+."
  exit 1
}

$nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 20) {
  Write-Error "Node.js 20+ required. Found: $nodeVersion"
  exit 1
}

$pnpmExists = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmExists) {
  Write-Host "[INFO] Installing pnpm..."
  & npm install -g pnpm
}

if (-not (Test-Path (Join-Path $AppRoot "node_modules"))) {
  Write-Host "[INFO] Installing dependencies..."
  & pnpm install
}

if (-not (Test-Path (Join-Path $AppRoot "apps/server/dist"))) {
  Write-Host "[INFO] Building..."
  & pnpm --filter @usb-ai-workbench/shared build
  & pnpm --filter @usb-ai-workbench/server build
  & pnpm --filter @usb-ai-workbench/web build
}

Write-Host "[INFO] Starting server on port $($env:APP_PORT)..."
$serverProcess = Start-Process -FilePath "node" -ArgumentList "$AppRoot\apps\server\dist\index.js" -NoNewWindow -PassThru

Write-Host "[INFO] Open http://localhost:$($env:APP_PORT)"
Write-Host "[INFO] Press Ctrl+C to stop."

try {
  Wait-Process -Id $serverProcess.Id
} finally {
  Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}
