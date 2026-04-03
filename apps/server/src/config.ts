import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { appRoot, configDir } from "./paths.js";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { resolveRuntimeMode } from "./runtime.js";

export interface EngineConfig {
  enabled: boolean;
  command: string;
  args: string[];
  timeout: number;
  stub?: boolean;
  pathOverride?: string;
  bundledBinary?: string;
}

export interface AppConfig {
  server: { port: number; host: string; logLevel: string };
  frontend: { port: number };
  engines: Record<EngineKind, EngineConfig>;
  scheduler: { enabled: boolean; concurrency: number };
  storage: { maxLogSizeBytes: number; maxRunArtifacts: number };
  security: { allowedOrigins: string[] };
  runtime?: { mode: "dev" | "portable" | "packaged"; allowPathFallback: boolean };
}

function loadDefaultConfig(): AppConfig {
  const defaultPath = path.join(appRoot, "config", "default.yaml");
  if (fs.existsSync(defaultPath)) {
    return yaml.load(fs.readFileSync(defaultPath, "utf8")) as AppConfig;
  }
  return {
    server: { port: 4000, host: "127.0.0.1", logLevel: "info" },
    frontend: { port: 5173 },
      engines: {
        claude: { enabled: true, command: "claude", args: [], timeout: 300000 },
        codex: { enabled: true, command: "codex", args: [], timeout: 300000 },
        opencode: { enabled: true, command: "opencode", args: [], timeout: 300000 },
        openclaw: { enabled: false, command: "openclaw", args: [], timeout: 300000, stub: true },
      },
      scheduler: { enabled: true, concurrency: 2 },
      storage: { maxLogSizeBytes: 104857600, maxRunArtifacts: 100 },
      security: { allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"] },
      runtime: { mode: "dev", allowPathFallback: true },
    };
}

function mergeUserConfig(base: AppConfig): AppConfig {
  const userPath = path.join(configDir, "user.yaml");
  if (fs.existsSync(userPath)) {
    const user = yaml.load(fs.readFileSync(userPath, "utf8")) as Partial<AppConfig>;
    return { ...base, ...user };
  }
  return base;
}

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = mergeUserConfig(loadDefaultConfig());
    const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : undefined;
    if (port) _config.server.port = port;
    _config.runtime = {
      mode: resolveRuntimeMode(),
      allowPathFallback: process.env.APP_ALLOW_PATH_FALLBACK !== "0",
    };
  }
  return _config;
}
