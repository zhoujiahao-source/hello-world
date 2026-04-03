# Portable Mode

## Design Goals

USB AI Workbench is designed to run entirely from a portable directory (e.g. a USB drive). No files are written to system directories, user home directories, or any path outside the project root.

## Path Resolution

All paths are resolved relative to `APP_ROOT`:

```
APP_ROOT/
└── portable-data/
    ├── db/          ← SQLite database
    ├── logs/        ← Server logs
    ├── runs/        ← Run output
    ├── state/       ← Engine-specific state
    │   ├── claude/  ← $CLAUDE_CONFIG_DIR
    │   ├── codex/   ← $CODEX_HOME
    │   ├── opencode/← $OPENCODE_HOME
    │   └── openclaw/← reserved
    └── config/      ← User config overrides
```

## Environment Variables

The start scripts set these variables automatically:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ROOT` | Script parent dir | Project root |
| `APP_DATA_DIR` | `$APP_ROOT/portable-data` | All runtime data |
| `APP_PORT` | `4000` | Server port |
| `VITE_PORT` | `5173` | Dev server port |

## Engine State Redirection

Engines are configured to use portable state directories:

- Claude Code: `CLAUDE_CONFIG_DIR=$APP_DATA_DIR/state/claude`
- Codex: `CODEX_HOME=$APP_DATA_DIR/state/codex`
- OpenCode: `OPENCODE_HOME=$APP_DATA_DIR/state/opencode`

## First Run

On first run:
1. `portable-data/` directory is created automatically
2. SQLite database is initialized
3. Engine discovery runs
4. Server starts

## Transferring to a New Machine

1. Copy the entire project directory to the new machine
2. Run `scripts/start.sh` (or `start.ps1` on Windows)
3. Dependencies are reinstalled automatically if needed
