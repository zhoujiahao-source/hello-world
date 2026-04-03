import fs from "node:fs";
import path from "node:path";
import { runCommand } from "../utils/process.js";

export interface WorkspaceDiffResult {
  provider: "git" | "internal";
  diff: string;
  files: string[];
  truncated: boolean;
  warnings: string[];
}

function listTextFiles(root: string, current: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      listTextFiles(root, full, out);
    } else {
      out.push(path.relative(root, full));
    }
  }
  return out;
}

function readSafe(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.length > 20_000 ? `${content.slice(0, 20_000)}\n...<truncated>` : content;
  } catch {
    return "";
  }
}

function buildInternalDiff(cwd: string): WorkspaceDiffResult {
  const files = listTextFiles(cwd, cwd).slice(0, 200);
  const chunks: string[] = [];
  for (const rel of files.slice(0, 40)) {
    const abs = path.join(cwd, rel);
    const content = readSafe(abs).split("\n").slice(0, 40).join("\n");
    chunks.push(`--- ${rel}\n+++ ${rel}\n@@\n${content}`);
  }
  return {
    provider: "internal",
    diff: chunks.join("\n\n"),
    files,
    truncated: files.length > 40,
    warnings: ["System git unavailable or failed; using internal diff fallback."],
  };
}

export async function getWorkspaceDiff(cwd: string): Promise<WorkspaceDiffResult> {
  const gitCheck = await runCommand("git", ["--version"], { cwd, timeout: 3000 });
  if (gitCheck.exitCode === 0) {
    const diff = await runCommand("git", ["--no-pager", "diff", "--", "."], { cwd, timeout: 8000 });
    const files = await runCommand("git", ["--no-pager", "status", "--short"], { cwd, timeout: 5000 });
    if (diff.exitCode === 0 || files.exitCode === 0) {
      return {
        provider: "git",
        diff: diff.stdout,
        files: files.stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        truncated: false,
        warnings: [],
      };
    }
  }
  return buildInternalDiff(cwd);
}
