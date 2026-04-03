# USB AI Workbench — Windows PowerShell portable start script
param(
  [int]$Port = 4000,
  [int]$VitePort = 5173
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir

$env:APP_ROOT = $AppRoot
$env:APP_BUNDLE_ROOT = $AppRoot
$env:APP_DATA_DIR = if ($env:APP_DATA_DIR) { $env:APP_DATA_DIR } else { Join-Path $AppRoot "portable-data" }
$env:APP_PORT = if ($env:APP_PORT) { $env:APP_PORT } else { $Port }
$env:VITE_PORT = if ($env:VITE_PORT) { $env:VITE_PORT } else { $VitePort }
$env:VITE_API_BASE_URL = "http://localhost:$($env:APP_PORT)"
$env:APP_RUNTIME_MODE = "portable"

Write-Host "==================================="
Write-Host "  USB AI Workbench (Portable)"
Write-Host "==================================="
Write-Host "  APP_ROOT:     $($env:APP_ROOT)"
Write-Host "  APP_DATA_DIR: $($env:APP_DATA_DIR)"
Write-Host "  APP_PORT:     $($env:APP_PORT)"
Write-Host "==================================="

Set-Location $AppRoot

$bundledNode = Join-Path $AppRoot "target\runtime\node.exe"
if (-not (Test-Path $bundledNode)) {
  $bundledNode = Join-Path $AppRoot "targets\win-x64\runtime\node.exe"
}

$nodeCommand = $null
if (Test-Path $bundledNode) {
  $nodeCommand = $bundledNode
} else {
  $systemNode = Get-Command node -ErrorAction SilentlyContinue
  if ($systemNode) {
    $nodeCommand = $systemNode.Source
    Write-Warning "Bundled Node runtime not found, falling back to system Node: $nodeCommand"
  } else {
    Write-Error "No bundled Node runtime found and system Node is unavailable."
    exit 1
  }
}

Write-Host "[INFO] Launching via: $nodeCommand"
$rootLauncher = Join-Path $AppRoot "launch-portable.ts"
if (Test-Path $rootLauncher) {
  & $nodeCommand $rootLauncher
} else {
  & $nodeCommand (Join-Path $AppRoot "scripts\launch-portable.ts")
}
