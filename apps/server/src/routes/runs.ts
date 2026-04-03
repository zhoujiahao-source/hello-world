import type { FastifyInstance } from "fastify";
import { listRuns, getRunById, getRecentRuns } from "../repositories/runsRepo.js";
import { startRun } from "../services/runService.js";
import { createRunSchema } from "@usb-ai-workbench/shared";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { ZodError } from "zod";
import { addSseClient, removeSseClient } from "../sse.js";
import { v4 as uuidv4 } from "uuid";
import { listArtifactsByRun } from "../repositories/artifactsRepo.js";
import fs from "node:fs";

export async function runRoutes(app: FastifyInstance): Promise<void> {
  app.get("/runs/recent", async (req) => {
    const limit = parseInt((req.query as Record<string, string>)["limit"] ?? "20", 10);
    return { success: true, data: getRecentRuns(limit) };
  });

  app.post("/runs", async (req) => {
    let input;
    try {
      input = createRunSchema.parse(req.body);
    } catch (e) {
      if (e instanceof ZodError) throw new ValidationError(e.errors.map(x => x.message).join("; "));
      throw e;
    }
    const run = await startRun(input.sessionId, input.engineKind, input.prompt);
    return { success: true, data: run };
  });

  app.get<{ Params: { sessionId: string } }>("/sessions/:sessionId/runs", async (req) => {
    return { success: true, data: listRuns(req.params.sessionId) };
  });

  app.get<{ Params: { id: string } }>("/runs/:id", async (req) => {
    const run = getRunById(req.params.id);
    if (!run) throw new NotFoundError("Run", req.params.id);
    return { success: true, data: run };
  });

  app.get<{ Params: { id: string } }>("/runs/:id/artifacts", async (req) => {
    const run = getRunById(req.params.id);
    if (!run) throw new NotFoundError("Run", req.params.id);
    return { success: true, data: listArtifactsByRun(req.params.id) };
  });

  app.get<{ Params: { id: string } }>("/runs/:id/diff", async (req) => {
    const run = getRunById(req.params.id);
    if (!run) throw new NotFoundError("Run", req.params.id);
    const artifacts = listArtifactsByRun(req.params.id);
    const summary = artifacts.find((a) => a.name === "diff-summary.json");
    const patch = artifacts.find((a) => a.name === "diff.patch");
    const summaryJson = summary && fs.existsSync(summary.path)
      ? JSON.parse(fs.readFileSync(summary.path, "utf8")) as Record<string, unknown>
      : null;
    const patchText = patch && fs.existsSync(patch.path) ? fs.readFileSync(patch.path, "utf8") : "";
    return { success: true, data: { source: (summaryJson?.source as string | undefined) ?? "unavailable", summary: summaryJson, patch: patchText, artifacts } };
  });

  // SSE stream for run output
  app.get<{ Params: { id: string } }>("/runs/:id/stream", async (req, reply) => {
    const run = getRunById(req.params.id);
    if (!run) throw new NotFoundError("Run", req.params.id);

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    reply.raw.flushHeaders();

    const clientId = uuidv4();
    addSseClient({ id: clientId, reply, runId: run.id });

    req.raw.on("close", () => {
      removeSseClient(clientId);
    });

    // Keep alive
    reply.raw.write(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    return reply;
  });

  // SSE stream for session (all runs in session)
  app.get<{ Params: { id: string } }>("/sessions/:id/stream", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    reply.raw.flushHeaders();

    const clientId = uuidv4();
    addSseClient({ id: clientId, reply, sessionId: req.params.id });

    req.raw.on("close", () => {
      removeSseClient(clientId);
    });

    reply.raw.write(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    return reply;
  });
}
