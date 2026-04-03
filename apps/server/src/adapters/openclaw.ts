// OpenClaw adapter — STUB only. Feature flag: engines.openclaw.enabled = false
import type { EngineStatus } from "@usb-ai-workbench/shared";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import type { EngineAdapter, RunOptions } from "./base.js";

export class OpenClawAdapter implements EngineAdapter {
  readonly kind = "openclaw" as const;

  async discover(): Promise<EngineStatus> {
    return {
      kind: "openclaw",
      health: "unavailable",
      version: null,
      executablePath: null,
      message: "OpenClaw is reserved for future use (stub adapter)",
    };
  }

  async validate(): Promise<{ valid: boolean; message: string | null }> {
    return { valid: false, message: "OpenClaw is not yet implemented" };
  }

  getDefaultEnv(): Record<string, string> {
    return {};
  }

  buildArgs(_prompt: string, _extra: string[] = []): string[] {
    return [];
  }

  async startRun(_options: RunOptions): Promise<ChildProcess> {
    throw new Error("OpenClaw is not yet implemented");
  }
}
