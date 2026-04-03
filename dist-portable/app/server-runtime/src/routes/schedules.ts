import type { FastifyInstance } from "fastify";
import {
  createSchedule, listSchedules, getScheduleById, updateScheduleStatus, deleteSchedule
} from "../repositories/schedulesRepo.js";
import { createScheduleSchema } from "@usb-ai-workbench/shared";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { refreshSchedules } from "../services/schedulerService.js";
import { ZodError } from "zod";

export async function scheduleRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { workspaceId?: string } }>("/schedules", async (req) => {
    return { success: true, data: listSchedules(req.query.workspaceId) };
  });

  app.post("/schedules", async (req) => {
    let input;
    try {
      input = createScheduleSchema.parse(req.body);
    } catch (e) {
      if (e instanceof ZodError) throw new ValidationError(e.errors.map(x => x.message).join("; "));
      throw e;
    }
    const schedule = createSchedule(input);
    refreshSchedules();
    return { success: true, data: schedule };
  });

  app.get<{ Params: { id: string } }>("/schedules/:id", async (req) => {
    const schedule = getScheduleById(req.params.id);
    if (!schedule) throw new NotFoundError("Schedule", req.params.id);
    return { success: true, data: schedule };
  });

  app.patch<{ Params: { id: string }; Body: { status: string } }>("/schedules/:id/status", async (req) => {
    const schedule = getScheduleById(req.params.id);
    if (!schedule) throw new NotFoundError("Schedule", req.params.id);
    updateScheduleStatus(req.params.id, req.body.status as "active" | "paused");
    refreshSchedules();
    return { success: true, data: getScheduleById(req.params.id) };
  });

  app.delete<{ Params: { id: string } }>("/schedules/:id", async (req) => {
    const ok = deleteSchedule(req.params.id);
    if (!ok) throw new NotFoundError("Schedule", req.params.id);
    refreshSchedules();
    return { success: true, data: null };
  });
}
