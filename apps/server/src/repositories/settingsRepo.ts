import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import type { Setting } from "@usb-ai-workbench/shared";

interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

function rowToSetting(row: SettingRow): Setting {
  return { key: row.key, value: row.value, updatedAt: row.updated_at };
}

export function getSetting(key: string): Setting | null {
  const row = getDb().prepare("SELECT * FROM settings WHERE key = ?").get(key) as SettingRow | undefined;
  return row ? rowToSetting(row) : null;
}

export function setSetting(key: string, value: string): Setting {
  const db = getDb();
  const now = nowIso();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
  `).run(key, value, now);
  return rowToSetting(db.prepare("SELECT * FROM settings WHERE key = ?").get(key) as SettingRow);
}

export function listSettings(): Setting[] {
  const rows = getDb().prepare("SELECT * FROM settings ORDER BY key").all() as SettingRow[];
  return rows.map(rowToSetting);
}

export function deleteSetting(key: string): boolean {
  const result = getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
  return result.changes > 0;
}
