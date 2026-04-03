import { execa, type ExecaError } from "execa";
import type { ChildProcess } from "node:child_process";

export interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCommand(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string>; timeout?: number },
): Promise<SpawnResult> {
  try {
    const result = await execa(command, args, {
      cwd: options?.cwd,
      env: options?.env ? { ...process.env, ...options.env } : process.env,
      timeout: options?.timeout,
      reject: false,
    });
    return {
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } catch (err) {
    const execaErr = err as ExecaError;
    return {
      exitCode: execaErr.exitCode ?? 1,
      stdout: typeof execaErr.stdout === "string" ? execaErr.stdout : "",
      stderr: typeof execaErr.stderr === "string" ? execaErr.stderr : String(err),
    };
  }
}

export async function which(command: string): Promise<string | null> {
  const result = await runCommand("which", [command]);
  if (result.exitCode === 0) return result.stdout.trim();
  // Try 'where' on Windows only
  if (process.platform === "win32") {
    const result2 = await runCommand("where", [command]);
    if (result2.exitCode === 0) return result2.stdout.split("\n")[0]?.trim() ?? null;
  }
  return null;
}
