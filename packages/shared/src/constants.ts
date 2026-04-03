export const ENGINE_KINDS = ["claude", "codex", "opencode", "openclaw"] as const;
export type EngineKind = (typeof ENGINE_KINDS)[number];

export const SESSION_STATUSES = ["idle", "running", "completed", "failed", "cancelled"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const RUN_STATUSES = ["pending", "running", "completed", "failed", "cancelled"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const WORKSPACE_STATUSES = ["active", "archived"] as const;
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const SCHEDULE_STATUSES = ["active", "paused", "completed", "failed"] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export const ENGINE_HEALTH = ["unknown", "healthy", "degraded", "unavailable"] as const;
export type EngineHealth = (typeof ENGINE_HEALTH)[number];

export const DEFAULT_PORT = 4000;
export const DEFAULT_DATA_DIR = "portable-data";

export const SSE_EVENTS = {
  RUN_OUTPUT: "run:output",
  RUN_STATUS: "run:status",
  SESSION_STATUS: "session:status",
  ENGINE_STATUS: "engine:status",
  PING: "ping",
} as const;
