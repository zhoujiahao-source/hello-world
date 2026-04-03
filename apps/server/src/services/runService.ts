import path from "node:path";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import { runsDir, workspacesDir, artifactsDir } from "../paths.js";
import { createRun, updateRunStatus, setRunLogPath, getRunById } from "../repositories/runsRepo.js";
import { addMessage } from "../repositories/messagesRepo.js";
import { updateSessionStatus, getSessionById } from "../repositories/sessionsRepo.js";
import { getWorkspaceById } from "../repositories/workspacesRepo.js";
import { createArtifact } from "../repositories/artifactsRepo.js";
import { getAdapter } from "./engineDiscovery.js";
import { broadcastRunEvent, broadcastSessionEvent } from "../sse.js";
import { SSE_EVENTS } from "@usb-ai-workbench/shared";
import { logger } from "../logger.js";
import { appendLine } from "../utils/files.js";
import type { Run } from "@usb-ai-workbench/shared";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { captureSnapshot, createRunDiffArtifacts } from "./diffService.js";

export async function startRun(sessionId: string, engineKind: EngineKind, prompt: string): Promise<Run> {
  const session = getSessionById(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const adapter = getAdapter(engineKind);
  if (!adapter) throw new Error(`No adapter for engine: ${engineKind}`);

  const run = createRun(sessionId, engineKind, prompt);
  const runLogDir = path.join(runsDir, run.id);
  fs.mkdirSync(runLogDir, { recursive: true });
  const logFile = path.join(runLogDir, "output.log");
  setRunLogPath(run.id, logFile);

  // Add user message
  addMessage(sessionId, "user", prompt);
  updateSessionStatus(sessionId, "running");
  broadcastSessionEvent(sessionId, SSE_EVENTS.SESSION_STATUS, { sessionId, status: "running" });

  updateRunStatus(run.id, "running");
  broadcastRunEvent(run.id, SSE_EVENTS.RUN_STATUS, { runId: run.id, status: "running" });

  // Use the workspace's actual path as the CWD, falling back to workspacesDir
  const workspace = getWorkspaceById(session.workspaceId);
  const cwd = workspace?.path && fs.existsSync(workspace.path) ? workspace.path : workspacesDir;
  const snapshotBefore = captureSnapshot(cwd);
  const runArtifactsRoot = path.join(artifactsDir, run.id);
  fs.mkdirSync(runArtifactsRoot, { recursive: true });

  try {
    const child = await adapter.startRun({
      prompt,
      cwd,
      onStdout: (chunk) => {
        appendLine(logFile, chunk);
        broadcastRunEvent(run.id, SSE_EVENTS.RUN_OUTPUT, {
          runId: run.id,
          chunk,
          stream: "stdout",
          timestamp: new Date().toISOString(),
        });
      },
      onStderr: (chunk) => {
        appendLine(logFile, chunk);
        broadcastRunEvent(run.id, SSE_EVENTS.RUN_OUTPUT, {
          runId: run.id,
          chunk,
          stream: "stderr",
          timestamp: new Date().toISOString(),
        });
      },
      onExit: async (code) => {
        const status = code === 0 ? "completed" : "failed";
        let diffSource: string = "unavailable";
        try {
          const snapshotAfter = captureSnapshot(cwd);
          const diffArtifacts = await createRunDiffArtifacts({
            workspaceRoot: cwd,
            runArtifactsDir: runArtifactsRoot,
            before: snapshotBefore,
            after: snapshotAfter,
          });
          createArtifact(run.id, "diff-summary.json", diffArtifacts.summaryPath, "application/json");
          createArtifact(run.id, "diff.patch", diffArtifacts.patchPath, "text/plain");
          createArtifact(run.id, "snapshot-before.json", diffArtifacts.beforePath, "application/json");
          createArtifact(run.id, "snapshot-after.json", diffArtifacts.afterPath, "application/json");
          diffSource = diffArtifacts.summary.source;
        } catch (err) {
          logger.warn("Failed to persist diff artifacts", { runId: run.id, err: String(err) });
        }
        updateRunStatus(run.id, status, code);
        updateSessionStatus(sessionId, "idle");
        broadcastRunEvent(run.id, SSE_EVENTS.RUN_STATUS, { runId: run.id, status, exitCode: code });
        broadcastSessionEvent(sessionId, SSE_EVENTS.SESSION_STATUS, { sessionId, status: "idle" });
        logger.info("Run finished", { runId: run.id, status, exitCode: code, diffSource });
      },
    });
    logger.info("Run started", { runId: run.id, pid: child.pid });
  } catch (err) {
    updateRunStatus(run.id, "failed", -1);
    updateSessionStatus(sessionId, "failed");
    broadcastRunEvent(run.id, SSE_EVENTS.RUN_STATUS, { runId: run.id, status: "failed" });
    logger.error("Failed to start run", { runId: run.id, err: String(err) });
  }

  return getRunById(run.id)!;
}
