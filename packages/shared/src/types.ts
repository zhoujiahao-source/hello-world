import type { EngineKind, SessionStatus, RunStatus, WorkspaceStatus, ScheduleStatus, EngineHealth } from "./constants.js";

// ============================================================
// Engine
// ============================================================

export interface Engine {
  id: string;
  kind: EngineKind;
  name: string;
  version: string | null;
  executablePath: string | null;
  health: EngineHealth;
  enabled: boolean;
  lastCheckedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface EngineStatus {
  kind: EngineKind;
  health: EngineHealth;
  version: string | null;
  executablePath: string | null;
  message: string | null;
}

// ============================================================
// Workspace
// ============================================================

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  path: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  path: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  status?: WorkspaceStatus;
}

// ============================================================
// Session
// ============================================================

export interface Session {
  id: string;
  workspaceId: string;
  engineKind: EngineKind;
  title: string | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface CreateSessionInput {
  workspaceId: string;
  engineKind: EngineKind;
  title?: string;
}

// ============================================================
// Message
// ============================================================

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// ============================================================
// Run
// ============================================================

export interface Run {
  id: string;
  sessionId: string;
  engineKind: EngineKind;
  prompt: string;
  status: RunStatus;
  exitCode: number | null;
  startedAt: string | null;
  completedAt: string | null;
  logPath: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface CreateRunInput {
  sessionId: string;
  engineKind: EngineKind;
  prompt: string;
}

export interface RunOutput {
  runId: string;
  chunk: string;
  stream: "stdout" | "stderr";
  timestamp: string;
}

// ============================================================
// Artifact
// ============================================================

export interface Artifact {
  id: string;
  runId: string;
  name: string;
  path: string;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
}

// ============================================================
// Schedule
// ============================================================

export interface Schedule {
  id: string;
  workspaceId: string;
  engineKind: EngineKind;
  title: string;
  prompt: string;
  cronExpr: string;
  status: ScheduleStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  workspaceId: string;
  engineKind: EngineKind;
  title: string;
  prompt: string;
  cronExpr: string;
}

// ============================================================
// Settings
// ============================================================

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

// ============================================================
// API Response wrappers
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================
// SSE Events
// ============================================================

export interface SseRunOutput {
  runId: string;
  chunk: string;
  stream: "stdout" | "stderr";
  timestamp: string;
}

export interface SseRunStatus {
  runId: string;
  status: RunStatus;
  exitCode?: number | null;
}

export interface SseSessionStatus {
  sessionId: string;
  status: SessionStatus;
}
