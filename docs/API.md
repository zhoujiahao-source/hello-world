# API Reference

Base URL: `http://localhost:4000/api/v1`

All responses follow this envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message", "code": "ERROR_CODE" }
```

## Health

### GET /health
Returns server status.

## Engines

### GET /engines
List all discovered engines.

### POST /engines/discover
Run engine discovery (scans PATH for CLIs).

### GET /engines/:kind
Get a specific engine by kind (`claude`, `codex`, `opencode`, `openclaw`).

### GET /engines/:kind/status
Run live discovery for a specific engine.

## Workspaces

### GET /workspaces
List all workspaces.

### POST /workspaces
Create a workspace.
```json
{ "name": "my-project", "description": "optional", "path": "/path/to/project" }
```

### GET /workspaces/:id
Get workspace by ID.

### PATCH /workspaces/:id
Update workspace (name, description, status).

### DELETE /workspaces/:id
Delete workspace (cascades to sessions, runs).

## Sessions

### GET /sessions?workspaceId=<id>
List sessions (optionally filtered by workspace).

### POST /sessions
Create a session.
```json
{ "workspaceId": "uuid", "engineKind": "claude", "title": "optional" }
```

### GET /sessions/:id
Get session by ID.

### GET /sessions/:id/messages
Get messages in session.

### GET /sessions/:id/stream
SSE stream for session events.

### DELETE /sessions/:id

## Runs

### POST /runs
Start a run (spawns engine CLI).
```json
{ "sessionId": "uuid", "engineKind": "claude", "prompt": "your prompt here" }
```

### GET /runs/recent?limit=20
Get recent runs across all sessions.

### GET /runs/:id
Get run by ID.

### GET /runs/:id/stream
SSE stream for run output.
Events: `run:output`, `run:status`, `ping`

### GET /sessions/:sessionId/runs
Get all runs in a session.

### GET /runs/:runId/log?tail=500
Get run log lines.

## Schedules

### GET /schedules?workspaceId=<id>
List schedules.

### POST /schedules
Create a scheduled task.
```json
{
  "workspaceId": "uuid",
  "engineKind": "claude",
  "title": "Daily review",
  "prompt": "Review recent changes",
  "cronExpr": "0 9 * * *"
}
```

### GET /schedules/:id
### PATCH /schedules/:id/status — `{ "status": "active" | "paused" }`
### DELETE /schedules/:id

## Logs

### GET /logs
List log files.

### GET /logs/:name?tail=100
Get lines from a log file.

## Config

### GET /config
Get active configuration (non-sensitive).

### GET /settings
List all settings.

### PUT /settings/:key
```json
{ "value": "..." }
```

### DELETE /settings/:key
