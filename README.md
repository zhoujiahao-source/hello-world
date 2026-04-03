# USB AI Workbench

A local-first, portable AI programming workbench designed to run from a USB drive.

## Quick Start

### Linux / macOS / WSL2
```bash
bash scripts/start.sh
```

### Windows (PowerShell)
```powershell
.\scripts\start.ps1
```

## Features

- Unified dashboard for multiple AI coding engines
- Supports Claude Code, Codex, OpenCode (OpenClaw reserved)
- All data stored locally in `portable-data/`
- Real-time session output via SSE
- Local task scheduling with node-cron
- SQLite database — no cloud dependencies
- Portable: runs entirely from the project directory

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full design.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Portable Distribution Build

```bash
pnpm portable:fetch-runtime
pnpm portable:fetch-providers
pnpm portable:verify
pnpm portable:build-bundle
pnpm portable:package
pnpm portable:smoke
pnpm portable:doctor -- --bundle-dir dist-portable --target linux-x64
pnpm portable:smoke-final -- --bundle-dir dist-portable --target linux-x64
```

More details: [docs/PORTABLE_BUNDLE.md](docs/PORTABLE_BUNDLE.md)
