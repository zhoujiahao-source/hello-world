import fs from "node:fs";
import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import { v4 as uuidv4 } from "uuid";
import type { Artifact } from "@usb-ai-workbench/shared";

interface ArtifactRow {
  id: string;
  run_id: string;
  name: string;
  path: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
}

function rowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    runId: row.run_id,
    name: row.name,
    path: row.path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export function createArtifact(runId: string, name: string, filePath: string, mimeType: string | null): Artifact {
  const db = getDb();
  const id = uuidv4();
  const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  db.prepare(`
    INSERT INTO artifacts (id, run_id, name, path, mime_type, size_bytes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, runId, name, filePath, mimeType, size, nowIso());
  return rowToArtifact(db.prepare("SELECT * FROM artifacts WHERE id=?").get(id) as ArtifactRow);
}

export function listArtifactsByRun(runId: string): Artifact[] {
  const rows = getDb().prepare("SELECT * FROM artifacts WHERE run_id = ? ORDER BY created_at DESC").all(runId) as ArtifactRow[];
  return rows.map(rowToArtifact);
}
