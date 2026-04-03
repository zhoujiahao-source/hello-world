import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { runCommand } from "../utils/process.js";
import { ensureDir, writeJsonFile } from "../utils/files.js";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "portable-data",
  ".next",
  ".turbo",
  ".cache",
]);

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yaml",
  ".yml",
  ".txt",
  ".css",
  ".html",
  ".sh",
  ".ps1",
]);

const MAX_TEXT_SIZE = 512 * 1024;
const MAX_DIFF_TEXT = 2000;

export interface SnapshotEntry {
  path: string;
  size: number;
  mtimeMs: number;
  hash: string;
  binary: boolean;
}

export interface WorkspaceSnapshot {
  createdAt: string;
  root: string;
  files: SnapshotEntry[];
}

export interface DiffSummary {
  source: "git-native" | "internal-diff" | "unavailable";
  addedFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  warnings: string[];
}

function isBinaryFile(filePath: string, ext: string): boolean {
  if (TEXT_EXTS.has(ext)) return false;
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(512);
    const read = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    for (let i = 0; i < read; i++) {
      if (buf[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

function hashFile(filePath: string): string {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex");
}

function collectFiles(root: string, current: string, out: SnapshotEntry[]): void {
  const entries = fs.readdirSync(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && ![".env", ".eslintrc", ".prettierrc"].includes(entry.name) && IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      collectFiles(root, full, out);
      continue;
    }
    const stat = fs.statSync(full);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    const ext = path.extname(full).toLowerCase();
    const binary = isBinaryFile(full, ext);
    const hash = stat.size <= MAX_TEXT_SIZE ? hashFile(full) : `${stat.size}:${stat.mtimeMs}`;
    out.push({
      path: rel,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      hash,
      binary,
    });
  }
}

export function captureSnapshot(root: string): WorkspaceSnapshot {
  const files: SnapshotEntry[] = [];
  if (fs.existsSync(root)) {
    collectFiles(root, root, files);
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return {
    createdAt: new Date().toISOString(),
    root,
    files,
  };
}

function toMap(snapshot: WorkspaceSnapshot): Map<string, SnapshotEntry> {
  return new Map(snapshot.files.map((f) => [f.path, f]));
}

function buildInternalPatch(root: string, before: WorkspaceSnapshot, after: WorkspaceSnapshot, summary: DiffSummary): string {
  const beforeMap = toMap(before);
  const afterMap = toMap(after);
  const chunks: string[] = [];
  for (const file of summary.addedFiles) {
    const entry = afterMap.get(file);
    if (!entry) continue;
    if (entry.binary || entry.size > MAX_TEXT_SIZE) {
      chunks.push(`--- /dev/null\n+++ ${file}\n@@\n+ [added binary or large file: ${entry.size} bytes]`);
      continue;
    }
    const content = fs.readFileSync(path.join(root, file), "utf8").slice(0, MAX_DIFF_TEXT);
    chunks.push(`--- /dev/null\n+++ ${file}\n@@\n+${content.split("\n").join("\n+")}`);
  }
  for (const file of summary.modifiedFiles) {
    const b = beforeMap.get(file);
    const a = afterMap.get(file);
    if (!b || !a) continue;
    if (b.binary || a.binary || b.size > MAX_TEXT_SIZE || a.size > MAX_TEXT_SIZE) {
      chunks.push(`--- ${file}\n+++ ${file}\n@@\n~ [modified binary or large file]`);
      continue;
    }
    const afterText = fs.readFileSync(path.join(root, file), "utf8").slice(0, MAX_DIFF_TEXT);
    chunks.push(
      `--- ${file}\n+++ ${file}\n@@\n- [before hash: ${b.hash}]\n+ [after hash: ${a.hash}]\n+ ${afterText.split("\n").join("\n+ ")}`,
    );
  }
  for (const file of summary.deletedFiles) {
    const entry = beforeMap.get(file);
    if (!entry) continue;
    chunks.push(`--- ${file}\n+++ /dev/null\n@@\n- [deleted file${entry.binary ? " (binary)" : ""}]`);
  }
  return chunks.join("\n\n");
}

function compareSnapshots(before: WorkspaceSnapshot, after: WorkspaceSnapshot): Omit<DiffSummary, "source" | "warnings"> {
  const beforeMap = toMap(before);
  const afterMap = toMap(after);
  const addedFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const deletedFiles: string[] = [];
  for (const file of afterMap.keys()) {
    if (!beforeMap.has(file)) addedFiles.push(file);
    else if (beforeMap.get(file)!.hash !== afterMap.get(file)!.hash) modifiedFiles.push(file);
  }
  for (const file of beforeMap.keys()) {
    if (!afterMap.has(file)) deletedFiles.push(file);
  }
  return { addedFiles, modifiedFiles, deletedFiles };
}

async function tryGitPatch(cwd: string): Promise<{ ok: boolean; patch: string }> {
  const version = await runCommand("git", ["--version"], { cwd, timeout: 3000 });
  if (version.exitCode !== 0) return { ok: false, patch: "" };
  const diff = await runCommand("git", ["--no-pager", "diff", "--", "."], { cwd, timeout: 10_000 });
  if (diff.exitCode !== 0) return { ok: false, patch: "" };
  return { ok: true, patch: diff.stdout };
}

export async function createRunDiffArtifacts(params: {
  workspaceRoot: string;
  runArtifactsDir: string;
  before: WorkspaceSnapshot;
  after: WorkspaceSnapshot;
}): Promise<{ summaryPath: string; patchPath: string; beforePath: string; afterPath: string; summary: DiffSummary }> {
  const { workspaceRoot, runArtifactsDir, before, after } = params;
  ensureDir(runArtifactsDir);
  const delta = compareSnapshots(before, after);
  const warnings: string[] = [];
  let source: DiffSummary["source"] = "internal-diff";
  let patch = "";
  const git = await tryGitPatch(workspaceRoot);
  if (git.ok) {
    source = "git-native";
    patch = git.patch;
  } else {
    source = "internal-diff";
    warnings.push("git unavailable or failed; using internal-diff fallback");
    patch = buildInternalPatch(workspaceRoot, before, after, { ...delta, source, warnings: [] });
  }
  if (!patch && delta.addedFiles.length === 0 && delta.modifiedFiles.length === 0 && delta.deletedFiles.length === 0) {
    source = "unavailable";
    warnings.push("no diff changes detected");
    patch = "# no changes detected";
  }
  const summary: DiffSummary = {
    source,
    ...delta,
    warnings,
  };
  const summaryPath = path.join(runArtifactsDir, "diff-summary.json");
  const patchPath = path.join(runArtifactsDir, "diff.patch");
  const beforePath = path.join(runArtifactsDir, "snapshot-before.json");
  const afterPath = path.join(runArtifactsDir, "snapshot-after.json");
  writeJsonFile(summaryPath, summary);
  fs.writeFileSync(patchPath, patch, "utf8");
  writeJsonFile(beforePath, before);
  writeJsonFile(afterPath, after);
  return { summaryPath, patchPath, beforePath, afterPath, summary };
}
