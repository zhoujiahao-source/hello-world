import Database from "better-sqlite3";
import path from "node:path";
import { dbDir } from "./paths.js";
import { logger } from "./logger.js";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = path.join(dbDir, "workbench.db");
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  logger.info("Database opened", { path: dbPath });
  runMigrations(_db);
  return _db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS engines (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      version TEXT,
      executable_path TEXT,
      health TEXT NOT NULL DEFAULT 'unknown',
      enabled INTEGER NOT NULL DEFAULT 1,
      last_checked_at TEXT,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      engine_kind TEXT NOT NULL,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      engine_kind TEXT NOT NULL,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      exit_code INTEGER,
      started_at TEXT,
      completed_at TEXT,
      log_path TEXT,
      created_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      engine_kind TEXT NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      cron_expr TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_run_at TEXT,
      next_run_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_runs_session ON runs(session_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_run ON artifacts(run_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_workspace ON schedules(workspace_id);
  `);
  logger.info("DB migrations applied");
}
