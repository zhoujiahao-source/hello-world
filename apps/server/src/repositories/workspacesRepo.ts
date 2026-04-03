import { getDb } from "../db.js";
import { nowIso } from "../utils/dates.js";
import { v4 as uuidv4 } from "uuid";
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from "@usb-ai-workbench/shared";

interface WorkspaceRow {
  id: string;
  name: string;
  description: string | null;
  path: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: string;
}

function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    path: row.path,
    status: row.status as Workspace["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  };
}

export function createWorkspace(input: CreateWorkspaceInput): Workspace {
  const db = getDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(`
    INSERT INTO workspaces (id, name, description, path, status, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, 'active', ?, ?, '{}')
  `).run(id, input.name, input.description ?? null, input.path, now, now);
  return rowToWorkspace(db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as WorkspaceRow);
}

export function listWorkspaces(): Workspace[] {
  const rows = getDb().prepare("SELECT * FROM workspaces ORDER BY created_at DESC").all() as WorkspaceRow[];
  return rows.map(rowToWorkspace);
}

export function getWorkspaceById(id: string): Workspace | null {
  const row = getDb().prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as WorkspaceRow | undefined;
  return row ? rowToWorkspace(row) : null;
}

export function updateWorkspace(id: string, input: UpdateWorkspaceInput): Workspace | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as WorkspaceRow | undefined;
  if (!existing) return null;
  db.prepare(`
    UPDATE workspaces SET name=?, description=?, status=?, updated_at=? WHERE id=?
  `).run(
    input.name ?? existing.name,
    input.description !== undefined ? input.description : existing.description,
    input.status ?? existing.status,
    nowIso(),
    id,
  );
  return rowToWorkspace(db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as WorkspaceRow);
}

export function deleteWorkspace(id: string): boolean {
  const result = getDb().prepare("DELETE FROM workspaces WHERE id = ?").run(id);
  return result.changes > 0;
}
