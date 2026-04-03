import fs from "node:fs";
import path from "node:path";
import { logsDir } from "./paths.js";

const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_VALUES: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const configuredLevel: Level =
  (process.env.LOG_LEVEL as Level | undefined) ?? "info";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function now(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

let logStream: fs.WriteStream | null = null;

function getLogStream(): fs.WriteStream {
  if (!logStream) {
    const date = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logsDir, `server-${date}.log`);
    logStream = fs.createWriteStream(logFile, { flags: "a" });
  }
  return logStream;
}

function write(level: Level, msg: string, meta?: unknown): void {
  if (LEVEL_VALUES[level] < LEVEL_VALUES[configuredLevel]) return;
  const line = JSON.stringify({
    time: now(),
    level,
    msg,
    ...(meta !== undefined ? { meta } : {}),
  });
  process.stdout.write(line + "\n");
  try {
    getLogStream().write(line + "\n");
  } catch {
    // ignore log file errors
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => write("debug", msg, meta),
  info: (msg: string, meta?: unknown) => write("info", msg, meta),
  warn: (msg: string, meta?: unknown) => write("warn", msg, meta),
  error: (msg: string, meta?: unknown) => write("error", msg, meta),
};
