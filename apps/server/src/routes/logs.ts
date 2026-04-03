import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import { logsDir, runsDir } from "../paths.js";
import { getRunById } from "../repositories/runsRepo.js";
import { NotFoundError } from "../utils/errors.js";

export async function logRoutes(app: FastifyInstance): Promise<void> {
  app.get("/logs", async () => {
    const files = fs.readdirSync(logsDir)
      .filter((f) => f.endsWith(".log"))
      .map((f) => ({
        name: f,
        path: path.join(logsDir, f),
        size: fs.statSync(path.join(logsDir, f)).size,
        modified: fs.statSync(path.join(logsDir, f)).mtime.toISOString(),
      }))
      .sort((a, b) => b.modified.localeCompare(a.modified));
    return { success: true, data: files };
  });

  app.get<{ Params: { name: string } }>("/logs/:name", async (req, reply) => {
    const safeName = path.basename(req.params.name);
    const logPath = path.join(logsDir, safeName);
    if (!fs.existsSync(logPath)) throw new NotFoundError("Log file", safeName);
    const tail = parseInt((req.query as Record<string, string>)["tail"] ?? "100", 10);
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n").filter(Boolean);
    const result = lines.slice(-tail);
    return { success: true, data: { name: safeName, lines: result, total: lines.length } };
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/log", async (req) => {
    const run = getRunById(req.params.runId);
    if (!run) throw new NotFoundError("Run", req.params.runId);
    if (!run.logPath || !fs.existsSync(run.logPath)) {
      return { success: true, data: { lines: [], total: 0 } };
    }
    const tail = parseInt((req.query as Record<string, string>)["tail"] ?? "500", 10);
    const content = fs.readFileSync(run.logPath, "utf8");
    const lines = content.split("\n").filter(Boolean);
    const result = lines.slice(-tail);
    return { success: true, data: { lines: result, total: lines.length } };
  });
}
