import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import { v4 as uuidv4 } from "uuid";
import type { Session, CreateSessionInput, SessionStatus } from "@usb-ai-workbench/shared";
import type { EngineKind } from "@usb-ai-workbench/shared";

interface SessionRow {
  id: string;
  workspace_id: string;
  engine_kind: string;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    engineKind: row.engine_kind as EngineKind,
    title: row.title,
    status: row.status as SessionStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  };
}

export function createSession(input: CreateSessionInput): Session {
  const db = getDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(`
    INSERT INTO sessions (id, workspace_id, engine_kind, title, status, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, 'idle', ?, ?, '{}')
  `).run(id, input.workspaceId, input.engineKind, input.title ?? null, now, now);
  return rowToSession(db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow);
}

export function listSessions(workspaceId?: string): Session[] {
  const db = getDb();
  const rows = workspaceId
    ? (db.prepare("SELECT * FROM sessions WHERE workspace_id = ? ORDER BY created_at DESC").all(workspaceId) as SessionRow[])
    : (db.prepare("SELECT * FROM sessions ORDER BY created_at DESC").all() as SessionRow[]);
  return rows.map(rowToSession);
}

export function getSessionById(id: string): Session | null {
  const row = getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow | undefined;
  return row ? rowToSession(row) : null;
}

export function updateSessionStatus(id: string, status: SessionStatus): void {
  getDb().prepare("UPDATE sessions SET status=?, updated_at=? WHERE id=?").run(status, nowIso(), id);
}

export function deleteSession(id: string): boolean {
  const result = getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
  return result.changes > 0;
}
