#!/usr/bin/env tsx
/**
 * USB AI Workbench — Doctor script
 * Checks system requirements and configuration.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => string): void {
  try {
    const msg = fn();
    results.push({ name, status: "ok", message: msg });
  } catch (err) {
    results.push({ name, status: "error", message: String(err) });
  }
}

function warn(name: string, fn: () => string): void {
  try {
    const msg = fn();
    results.push({ name, status: "ok", message: msg });
  } catch (err) {
    results.push({ name, status: "warn", message: String(err) });
  }
}

// Node.js version
check("Node.js >= 20", () => {
  const v = process.version;
  const major = parseInt(v.slice(1).split(".")[0]!, 10);
  if (major < 20) throw new Error(`Found ${v}, need >= 20`);
  return v;
});

// pnpm
check("pnpm installed", () => {
  return execSync("pnpm --version", { encoding: "utf8" }).trim();
});

// Directories
check("portable-data directory writable", () => {
  const dir = path.join(APP_ROOT, "portable-data");
  fs.mkdirSync(dir, { recursive: true });
  const testFile = path.join(dir, ".write-test");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
  return dir;
});

// Engines
for (const engine of ["claude", "codex", "opencode"]) {
  warn(`Engine: ${engine}`, () => {
    execSync(`which ${engine}`, { encoding: "utf8", stdio: "pipe" });
    return "found in PATH";
  });
}

// Portable runtime
warn("portable manifest", () => {
  const manifestPath = path.join(APP_ROOT, "dist-portable", "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error("dist-portable/manifest.json not found");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { target?: string; knownLimitations?: string[] };
  return `target=${manifest.target ?? "unknown"}`;
});

warn("portable target runtime dir", () => {
  const platform = os.platform();
  const arch = os.arch();
  const target =
    platform === "linux" && arch === "x64"
      ? "linux-x64"
      : platform === "linux" && arch === "arm64"
      ? "linux-arm64"
      : platform === "darwin" && arch === "x64"
      ? "darwin-x64"
      : platform === "darwin" && arch === "arm64"
      ? "darwin-arm64"
      : platform === "win32" && arch === "x64"
      ? "win-x64"
      : null;
  if (!target) throw new Error("unsupported host target");
  const runtimeDir = path.join(APP_ROOT, "portable", "targets", target, "runtime");
  if (!fs.existsSync(runtimeDir)) throw new Error(`missing runtime dir: ${runtimeDir}`);
  return runtimeDir;
});

warn("native-build policy", () => {
  if (process.env.PNPM_IGNORE_SCRIPTS === "true" || process.env.npm_config_ignore_scripts === "true") {
    throw new Error("native build scripts are blocked in current environment");
  }
  return "native build scripts appear allowed";
});

// API keys
warn("ANTHROPIC_API_KEY", () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("not set (needed for Claude)");
  return "set";
});

warn("OPENAI_API_KEY", () => {
  if (!process.env.OPENAI_API_KEY) throw new Error("not set (needed for Codex)");
  return "set";
});

// Config
check("config/default.yaml exists", () => {
  const cfgPath = path.join(APP_ROOT, "config", "default.yaml");
  if (!fs.existsSync(cfgPath)) throw new Error(`Missing: ${cfgPath}`);
  return cfgPath;
});

// Print results
console.log("\n=== USB AI Workbench Doctor ===\n");
let hasError = false;
for (const r of results) {
  const icon = r.status === "ok" ? "✓" : r.status === "warn" ? "⚠" : "✗";
  const color = r.status === "ok" ? "\x1b[32m" : r.status === "warn" ? "\x1b[33m" : "\x1b[31m";
  console.log(`${color}${icon}\x1b[0m  ${r.name}: ${r.message}`);
  if (r.status === "error") hasError = true;
}
console.log("");

if (hasError) {
  console.error("Some checks failed. Please fix the errors above.");
  process.exit(1);
} else {
  console.log("All critical checks passed.");
}
