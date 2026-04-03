import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import { v4 as uuidv4 } from "uuid";
import type { Schedule, CreateScheduleInput, ScheduleStatus } from "@usb-ai-workbench/shared";
import type { EngineKind } from "@usb-ai-workbench/shared";

interface ScheduleRow {
  id: string;
  workspace_id: string;
  engine_kind: string;
  title: string;
  prompt: string;
  cron_expr: string;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    engineKind: row.engine_kind as EngineKind,
    title: row.title,
    prompt: row.prompt,
    cronExpr: row.cron_expr,
    status: row.status as ScheduleStatus,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSchedule(input: CreateScheduleInput): Schedule {
  const db = getDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(`
    INSERT INTO schedules (id, workspace_id, engine_kind, title, prompt, cron_expr, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(id, input.workspaceId, input.engineKind, input.title, input.prompt, input.cronExpr, now, now);
  return rowToSchedule(db.prepare("SELECT * FROM schedules WHERE id = ?").get(id) as ScheduleRow);
}

export function listSchedules(workspaceId?: string): Schedule[] {
  const db = getDb();
  const rows = workspaceId
    ? (db.prepare("SELECT * FROM schedules WHERE workspace_id = ? ORDER BY created_at DESC").all(workspaceId) as ScheduleRow[])
    : (db.prepare("SELECT * FROM schedules ORDER BY created_at DESC").all() as ScheduleRow[]);
  return rows.map(rowToSchedule);
}

export function getScheduleById(id: string): Schedule | null {
  const row = getDb().prepare("SELECT * FROM schedules WHERE id = ?").get(id) as ScheduleRow | undefined;
  return row ? rowToSchedule(row) : null;
}

export function updateScheduleLastRun(id: string): void {
  getDb().prepare("UPDATE schedules SET last_run_at=?, updated_at=? WHERE id=?").run(nowIso(), nowIso(), id);
}

export function updateScheduleStatus(id: string, status: ScheduleStatus): void {
  getDb().prepare("UPDATE schedules SET status=?, updated_at=? WHERE id=?").run(status, nowIso(), id);
}

export function deleteSchedule(id: string): boolean {
  const result = getDb().prepare("DELETE FROM schedules WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listActiveSchedules(): Schedule[] {
  const rows = getDb().prepare("SELECT * FROM schedules WHERE status = 'active'").all() as ScheduleRow[];
  return rows.map(rowToSchedule);
}
