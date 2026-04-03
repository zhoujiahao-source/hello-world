import type { EngineStatus } from "@usb-ai-workbench/shared";
import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import path from "node:path";
import { stateDir } from "../paths.js";
import { which } from "../utils/process.js";
import { runCommand } from "../utils/process.js";
import type { EngineAdapter, RunOptions } from "./base.js";
import { getConfig } from "../config.js";

export class ClaudeAdapter implements EngineAdapter {
  readonly kind = "claude" as const;

  private getCommand(): string {
    return getConfig().engines.claude.command;
  }

  async discover(): Promise<EngineStatus> {
    const cmd = this.getCommand();
    const execPath = await which(cmd);
    if (!execPath) {
      return { kind: "claude", health: "unavailable", version: null, executablePath: null, message: "claude CLI not found in PATH" };
    }
    const res = await runCommand(execPath, ["--version"], { timeout: 5000 });
    const version = res.exitCode === 0 ? res.stdout.trim().split("\n")[0] ?? null : null;
    return {
      kind: "claude",
      health: res.exitCode === 0 ? "healthy" : "degraded",
      version,
      executablePath: execPath,
      message: res.exitCode === 0 ? null : res.stderr,
    };
  }

  async validate(): Promise<{ valid: boolean; message: string | null }> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return { valid: false, message: "ANTHROPIC_API_KEY not set" };
    return { valid: true, message: null };
  }

  getDefaultEnv(): Record<string, string> {
    return {
      CLAUDE_CONFIG_DIR: path.join(stateDir, "claude"),
    };
  }

  buildArgs(prompt: string, extra: string[] = []): string[] {
    return ["--print", prompt, ...extra];
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
