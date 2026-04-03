import type { EngineKind, EngineStatus } from "@usb-ai-workbench/shared";
import type { ChildProcess } from "node:child_process";

export interface RunOptions {
  prompt: string;
  cwd: string;
  env?: Record<string, string>;
  onStdout: (chunk: string) => void;
  onStderr: (chunk: string) => void;
  onExit: (code: number | null) => void;
}

export interface EngineAdapter {
  readonly kind: EngineKind;

  /** Detect if this engine is available on the system */
  discover(): Promise<EngineStatus>;

  /** Validate that the engine can be used (e.g. API key present) */
  validate(): Promise<{ valid: boolean; message: string | null }>;

  /** Default environment variables this engine needs */
  getDefaultEnv(): Record<string, string>;

  /** Start a run — returns a handle to the spawned process */
  startRun(options: RunOptions): Promise<ChildProcess>;

  /** Format a prompt for this engine's CLI (return CLI args) */
  buildArgs(prompt: string, extra?: string[]): string[];
}
