#!/usr/bin/env tsx
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : path.resolve(__dirname, "..");
const appDataDir = process.env.APP_DATA_DIR ?? path.join(appRoot, "portable-data");
const appPort = process.env.APP_PORT ?? "4000";

function detectTarget(): string {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "win32" && arch === "x64") return "win-x64";
  throw new Error(`Unsupported host target: ${platform}-${arch}`);
}

function resolveBundledNode(target: string): string | null {
  const fromTargetDir = path.join(appRoot, "target", "runtime");
  const fromTargetsDir = path.join(appRoot, "targets", target, "runtime");
  const candidates = [fromTargetDir, fromTargetsDir];
  for (const runtimeDir of candidates) {
    if (!fs.existsSync(runtimeDir)) continue;
    if (process.platform === "win32") {
      const exe = path.join(runtimeDir, "node.exe");
      if (fs.existsSync(exe)) return exe;
    } else {
      const entries = fs.readdirSync(runtimeDir);
      for (const entry of entries) {
        const candidate = path.join(runtimeDir, entry, "bin", "node");
        if (fs.existsSync(candidate)) return candidate;
      }
      const direct = path.join(runtimeDir, "bin", "node");
      if (fs.existsSync(direct)) return direct;
    }
  }
  return null;
}

function main() {
  const target = detectTarget();
  const bundledNode = resolveBundledNode(target);
  const nodeCommand = bundledNode ?? process.execPath;
  const serverEntryCandidates = [
    path.join(appRoot, "app", "server", "index.cjs"),
    path.join(appRoot, "app", "server-runtime", "dist", "index.js"),
    path.join(appRoot, "apps", "server", "dist", "index.js"),
  ];
  const serverEntry = serverEntryCandidates.find((v) => fs.existsSync(v));
  if (!serverEntry) {
    throw new Error("Unable to locate server entry for portable launch.");
  }

  const child = spawn(nodeCommand, [serverEntry], {
    stdio: "inherit",
    cwd: appRoot,
    env: {
      ...process.env,
      APP_ROOT: appRoot,
      APP_DATA_DIR: appDataDir,
      APP_PORT: appPort,
      APP_BUNDLE_TARGET: target,
      APP_BUNDLED: "1",
      APP_PREFER_BUNDLED_BINARIES: "1",
      APP_BUNDLED_TARGET_ROOT: path.join(appRoot, "target"),
      APP_BUNDLED_PROVIDERS_ROOT: path.join(appRoot, "target", "providers"),
      APP_WEB_DIST_DIR: path.join(appRoot, "app", "web"),
    },
  });

  child.on("exit", (code) => process.exit(code ?? 1));
}

main();
