import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import { v4 as uuidv4 } from "uuid";
import type { Run, RunStatus } from "@usb-ai-workbench/shared";
import type { EngineKind } from "@usb-ai-workbench/shared";

interface RunRow {
  id: string;
  session_id: string;
  engine_kind: string;
  prompt: string;
  status: string;
  exit_code: number | null;
  started_at: string | null;
  completed_at: string | null;
  log_path: string | null;
  created_at: string;
  metadata: string;
}

function rowToRun(row: RunRow): Run {
  return {
    id: row.id,
    sessionId: row.session_id,
    engineKind: row.engine_kind as EngineKind,
    prompt: row.prompt,
    status: row.status as RunStatus,
    exitCode: row.exit_code,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    logPath: row.log_path,
    createdAt: row.created_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  };
}

export function createRun(sessionId: string, engineKind: EngineKind, prompt: string): Run {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO runs (id, session_id, engine_kind, prompt, status, created_at, metadata)
    VALUES (?, ?, ?, ?, 'pending', ?, '{}')
  `).run(id, sessionId, engineKind, prompt, nowIso());
  return rowToRun(db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as RunRow);
}

export function listRuns(sessionId: string): Run[] {
  const rows = getDb().prepare("SELECT * FROM runs WHERE session_id = ? ORDER BY created_at DESC").all(sessionId) as RunRow[];
  return rows.map(rowToRun);
}

export function getRunById(id: string): Run | null {
  const row = getDb().prepare("SELECT * FROM runs WHERE id = ?").get(id) as RunRow | undefined;
  return row ? rowToRun(row) : null;
}

export function updateRunStatus(id: string, status: RunStatus, exitCode?: number | null): void {
  const now = nowIso();
  const db = getDb();
  if (status === "running") {
    db.prepare("UPDATE runs SET status=?, started_at=? WHERE id=?").run(status, now, id);
  } else if (status === "completed" || status === "failed" || status === "cancelled") {
    db.prepare("UPDATE runs SET status=?, completed_at=?, exit_code=? WHERE id=?").run(status, now, exitCode ?? null, id);
  } else {
    db.prepare("UPDATE runs SET status=? WHERE id=?").run(status, id);
  }
}

export function setRunLogPath(id: string, logPath: string): void {
  getDb().prepare("UPDATE runs SET log_path=? WHERE id=?").run(logPath, id);
}

export function getRecentRuns(limit = 20): Run[] {
  const rows = getDb().prepare("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?").all(limit) as RunRow[];
  return rows.map(rowToRun);
}
