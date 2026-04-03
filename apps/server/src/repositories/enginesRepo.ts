import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import type { Engine, EngineHealth } from "@usb-ai-workbench/shared";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { v4 as uuidv4 } from "uuid";

interface EngineRow {
  id: string;
  kind: string;
  name: string;
  version: string | null;
  executable_path: string | null;
  health: string;
  enabled: number;
  last_checked_at: string | null;
  metadata: string;
}

function rowToEngine(row: EngineRow): Engine {
  return {
    id: row.id,
    kind: row.kind as EngineKind,
    name: row.name,
    version: row.version,
    executablePath: row.executable_path,
    health: row.health as EngineHealth,
    enabled: row.enabled === 1,
    lastCheckedAt: row.last_checked_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  };
}

export function upsertEngine(kind: EngineKind, data: Partial<Omit<Engine, "id" | "kind">>): Engine {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM engines WHERE kind = ?").get(kind) as EngineRow | undefined;
  if (existing) {
    db.prepare(`
      UPDATE engines SET name=?, version=?, executable_path=?, health=?, enabled=?, last_checked_at=?, metadata=?
      WHERE kind=?
    `).run(
      data.name ?? existing.name,
      data.version ?? existing.version,
      data.executablePath ?? existing.executable_path,
      data.health ?? existing.health,
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : existing.enabled,
      nowIso(),
      JSON.stringify(data.metadata ?? {}),
      kind,
    );
    return rowToEngine(db.prepare("SELECT * FROM engines WHERE kind = ?").get(kind) as EngineRow);
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO engines (id, kind, name, version, executable_path, health, enabled, last_checked_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, kind,
    data.name ?? kind,
    data.version ?? null,
    data.executablePath ?? null,
    data.health ?? "unknown",
    data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    nowIso(),
    JSON.stringify(data.metadata ?? {}),
  );
  return rowToEngine(db.prepare("SELECT * FROM engines WHERE id = ?").get(id) as EngineRow);
}

export function listEngines(): Engine[] {
  const rows = getDb().prepare("SELECT * FROM engines ORDER BY kind").all() as EngineRow[];
  return rows.map(rowToEngine);
}

export function getEngineByKind(kind: EngineKind): Engine | null {
  const row = getDb().prepare("SELECT * FROM engines WHERE kind = ?").get(kind) as EngineRow | undefined;
  return row ? rowToEngine(row) : null;
}
