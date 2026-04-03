import cron from "node-cron";
import { listActiveSchedules, updateScheduleLastRun } from "../repositories/schedulesRepo.js";
import { getSessionById, listSessions } from "../repositories/sessionsRepo.js";
import { createSession } from "../repositories/sessionsRepo.js";
import { startRun } from "./runService.js";
import { getConfig } from "../config.js";
import { logger } from "../logger.js";
import type { Schedule } from "@usb-ai-workbench/shared";

const activeTasks = new Map<string, cron.ScheduledTask>();

export function startScheduler(): void {
  if (!getConfig().scheduler.enabled) {
    logger.info("Scheduler disabled by config");
    return;
  }
  logger.info("Scheduler starting");
  refreshSchedules();
}

export function stopScheduler(): void {
  for (const [id, task] of activeTasks.entries()) {
    task.stop();
    activeTasks.delete(id);
  }
  logger.info("Scheduler stopped");
}

export function refreshSchedules(): void {
  const schedules = listActiveSchedules();
  const seen = new Set<string>();

  for (const schedule of schedules) {
    seen.add(schedule.id);
    if (!activeTasks.has(schedule.id)) {
      registerSchedule(schedule);
    }
  }

  for (const [id, task] of activeTasks.entries()) {
    if (!seen.has(id)) {
      task.stop();
      activeTasks.delete(id);
    }
  }
}

function registerSchedule(schedule: Schedule): void {
  if (!cron.validate(schedule.cronExpr)) {
    logger.warn("Invalid cron expression", { id: schedule.id, expr: schedule.cronExpr });
    return;
  }
  const task = cron.schedule(schedule.cronExpr, async () => {
    logger.info("Running scheduled task", { id: schedule.id, title: schedule.title });
    try {
      // Find or create a session for this schedule
      const sessions = listSessions(schedule.workspaceId);
      let session = sessions.find((s) => s.engineKind === schedule.engineKind && s.status === "idle");
      if (!session) {
        session = createSession({
          workspaceId: schedule.workspaceId,
          engineKind: schedule.engineKind,
          title: `Scheduled: ${schedule.title}`,
        });
      }
      await startRun(session.id, schedule.engineKind, schedule.prompt);
      updateScheduleLastRun(schedule.id);
    } catch (err) {
      logger.error("Scheduled task failed", { id: schedule.id, err: String(err) });
    }
  });
  activeTasks.set(schedule.id, task);
  logger.info("Schedule registered", { id: schedule.id, expr: schedule.cronExpr });
}
