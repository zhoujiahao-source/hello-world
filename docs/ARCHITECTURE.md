# USB AI Workbench — Architecture

## Overview

USB AI Workbench is a local-first, portable AI coding assistant platform designed to run from a USB drive or portable directory. All data is stored locally; no cloud services are required (except network calls to LLM APIs).

## Directory Structure

```
/
├── apps/
│   ├── server/         # Fastify API server (Node.js + TypeScript)
│   └── web/            # React + Vite frontend
├── packages/
│   └── shared/         # Shared types, schemas, constants
├── config/
│   └── default.yaml    # Default configuration
├── scripts/            # Start, dev, build, doctor scripts
├── docs/               # Documentation
└── portable-data/      # All runtime data (created on first run)
    ├── db/             # SQLite database
    ├── logs/           # Server and run logs
    ├── runs/           # Run output files
    ├── artifacts/      # Generated files from runs
    ├── state/          # Engine state dirs (claude/, codex/, etc.)
    ├── config/         # User overrides
    ├── cache/          # Temporary cache
    ├── temp/           # Temp files
    └── workspaces/     # Workspace data
```

## Backend (apps/server)

- **Fastify** HTTP server with JSON API
- **better-sqlite3** for SQLite database (single file, WAL mode)
- **SSE** (Server-Sent Events) for streaming run output
- **node-cron** for local task scheduling
- **Adapter pattern** for engine integrations

### Adapter Layer

Each AI engine has an adapter implementing `EngineAdapter`:
- `ClaudeAdapter` — Claude Code CLI
- `CodexAdapter` — OpenAI Codex CLI
- `OpenCodeAdapter` — OpenCode CLI
- `OpenClawAdapter` — STUB (reserved, disabled)

Adapters are responsible for:
- `discover()` — detect if CLI is installed
- `validate()` — check API keys
- `getDefaultEnv()` — provide portable env vars
- `startRun()` — spawn the CLI process
- `buildArgs()` — format CLI arguments

### Database Schema

Tables: `engines`, `workspaces`, `sessions`, `messages`, `runs`, `artifacts`, `schedules`, `settings`

### API Routes

All routes under `/api/v1/`:
- `GET /health` — server health check
- `GET/POST /engines` — list/discover engines
- `GET/POST/PATCH/DELETE /workspaces` — workspace CRUD
- `GET/POST/DELETE /sessions` — session management
- `GET/POST /runs` — run management + SSE streams
- `GET/POST/PATCH/DELETE /schedules` — scheduled tasks
- `GET /logs` — log file access
- `GET/PUT/DELETE /settings` — key-value settings

## Frontend (apps/web)

- **React 18** + **Vite**
- **React Router v6** for navigation
- **TanStack Query** for server state
- **Zustand** for UI state
- **Tailwind CSS** for styling

### Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/dashboard` | Overview, recent runs, engine status |
| Engines | `/engines` | Engine discovery and health |
| Workspaces | `/workspaces` | Workspace management |
| Sessions | `/sessions` | Session list and management |
| Session Detail | `/sessions/:id` | Run history, prompt composer, live output |
| Schedules | `/schedules` | Cron-based automation |
| Logs | `/logs` | View server and run logs |
| Settings | `/settings` | Key-value configuration store |

## Portable Mode

See [PORTABLE_MODE.md](PORTABLE_MODE.md) for details.

## Security

See [SECURITY.md](SECURITY.md) for details.
