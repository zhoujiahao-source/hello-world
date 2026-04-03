# Portable Bundle Guide

## Goal

USB AI Workbench portable distribution focuses on **runtime install-free delivery**:

- target machine does **not** require Node.js
- target machine does **not** require pnpm/npm
- target machine does **not** require global provider CLI installs
- bundle ships runtime/provider binaries and launches locally

## Build Flow (on build machine)

```bash
pnpm install
pnpm portable:fetch-runtime
pnpm portable:fetch-providers
pnpm portable:verify
pnpm portable:build-bundle
pnpm portable:package
pnpm portable:smoke
pnpm portable:doctor -- --bundle-dir dist-portable --target linux-x64
pnpm portable:smoke-final -- --bundle-dir dist-portable --target linux-x64
```

Artifacts:

- `dist-portable/manifest.json`
- `dist-portable/usb-ai-workbench-portable-<target>.tar.gz`

## Runtime Start

- Linux/macOS: `bash start.sh`
- Windows: `.\start.ps1`

Launcher priority:

1. bundled Node runtime
2. system Node fallback (last resort)

Provider resolution priority:

1. bundled provider binary
2. configured override path
3. system PATH fallback (if allowed)

## Manifest

`manifest.json` includes:

- app/version/target/build metadata
- runtime mode and bundled Node path
- per-provider status
- artifact paths/checksums
- build host info
- notes + known limitations

UI pages use runtime and manifest APIs to show portable diagnostics.

## Known Limitation: better-sqlite3 Native Build

In restricted sandbox/CI policy environments, native build scripts may be blocked, causing better-sqlite3 smoke test failures.

This is a **build environment policy limitation**, not an architecture defect of the application.

In build environments that allow native builds, final portable smoke validation should pass.

## Doctor Script Flags

`pnpm portable:doctor -- [options]`

- `--target <target>`: override target auto-detection
- `--bundle-dir <dir>`: set bundle root/dist directory (default `dist-portable`)
- `--json`: machine-readable output

## Final Smoke Script

`pnpm portable:smoke-final -- [options]`

- validates manifest + artifact presence
- resolves bundled Node fallback behavior
- performs short launch probe in portable mode
- supports `--bundle-dir`, `--target`, `--json`
