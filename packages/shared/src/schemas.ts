import { z } from "zod";
import { ENGINE_KINDS, SESSION_STATUSES, RUN_STATUSES, WORKSPACE_STATUSES, SCHEDULE_STATUSES } from "./constants.js";

export const engineKindSchema = z.enum(ENGINE_KINDS);
export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export const runStatusSchema = z.enum(RUN_STATUSES);
export const workspaceStatusSchema = z.enum(WORKSPACE_STATUSES);
export const scheduleStatusSchema = z.enum(SCHEDULE_STATUSES);

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  path: z.string().min(1),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: workspaceStatusSchema.optional(),
});

export const createSessionSchema = z.object({
  workspaceId: z.string().uuid(),
  engineKind: engineKindSchema,
  title: z.string().max(500).optional(),
});

export const createRunSchema = z.object({
  sessionId: z.string().uuid(),
  engineKind: engineKindSchema,
  prompt: z.string().min(1).max(100000),
});

export const createScheduleSchema = z.object({
  workspaceId: z.string().uuid(),
  engineKind: engineKindSchema,
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(100000),
  cronExpr: z.string().min(1),
});

export const updateScheduleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  prompt: z.string().min(1).max(100000).optional(),
  cronExpr: z.string().min(1).optional(),
  status: scheduleStatusSchema.optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const settingSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string(),
});
