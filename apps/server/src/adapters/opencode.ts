import type { EngineStatus } from "@usb-ai-workbench/shared";
import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import path from "node:path";
import { stateDir } from "../paths.js";
import { which, runCommand } from "../utils/process.js";
import type { EngineAdapter, RunOptions } from "./base.js";
import { getConfig } from "../config.js";

export class OpenCodeAdapter implements EngineAdapter {
  readonly kind = "opencode" as const;

  private getCommand(): string {
    return getConfig().engines.opencode.command;
  }

  async discover(): Promise<EngineStatus> {
    const cmd = this.getCommand();
    const execPath = await which(cmd);
    if (!execPath) {
      return { kind: "opencode", health: "unavailable", version: null, executablePath: null, message: "opencode CLI not found in PATH" };
    }
    const res = await runCommand(execPath, ["--version"], { timeout: 5000 });
    const version = res.exitCode === 0 ? res.stdout.trim().split("\n")[0] ?? null : null;
    return {
      kind: "opencode",
      health: res.exitCode === 0 ? "healthy" : "degraded",
      version,
      executablePath: execPath,
      message: res.exitCode === 0 ? null : res.stderr,
    };
  }

  async validate(): Promise<{ valid: boolean; message: string | null }> {
    return { valid: true, message: null };
  }

  getDefaultEnv(): Record<string, string> {
    return {
      OPENCODE_HOME: path.join(stateDir, "opencode"),
    };
  }

  buildArgs(prompt: string, extra: string[] = []): string[] {
    return ["run", "--prompt", prompt, ...extra];
  }

  async startRun(options: RunOptions): Promise<ChildProcess> {
    const cmd = this.getCommand();
    const args = this.buildArgs(options.prompt);
    const env: Record<string, string> = {
      ...(process.env as Record<string, string>),
      ...this.getDefaultEnv(),
      ...(options.env ?? {}),
    };
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (d: Buffer) => options.onStdout(d.toString()));
    child.stderr?.on("data", (d: Buffer) => options.onStderr(d.toString()));
    child.on("exit", (code) => options.onExit(code));
    return child;
  }
}
