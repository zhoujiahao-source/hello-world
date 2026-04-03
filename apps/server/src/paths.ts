import path from "node:path";
import fs from "node:fs";
import { resolveBundleRoot, resolvePortableDataDir } from "./runtime.js";

// APP_ROOT is set by start scripts; fallback to project root
const APP_ROOT = resolveBundleRoot();

const APP_DATA_DIR = resolvePortableDataDir();

export const appRoot = APP_ROOT;
export const dataDir = APP_DATA_DIR;
export const dbDir = path.join(APP_DATA_DIR, "db");
export const logsDir = path.join(APP_DATA_DIR, "logs");
export const runsDir = path.join(APP_DATA_DIR, "runs");
export const artifactsDir = path.join(APP_DATA_DIR, "artifacts");
export const stateDir = path.join(APP_DATA_DIR, "state");
export const tempDir = path.join(APP_DATA_DIR, "temp");
export const workspacesDir = path.join(APP_DATA_DIR, "workspaces");
export const configDir = path.join(APP_DATA_DIR, "config");
export const cacheDir = path.join(APP_DATA_DIR, "cache");

const STATE_SUBDIRS = ["claude", "codex", "opencode", "openclaw"];

export function ensurePortableDirs(): void {
  const dirs = [
    dbDir,
    logsDir,
    runsDir,
    artifactsDir,
    stateDir,
    tempDir,
    workspacesDir,
    configDir,
    cacheDir,
    ...STATE_SUBDIRS.map((s) => path.join(stateDir, s)),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
