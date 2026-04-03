#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

function parseArgs(argv: string[]): { bundleDir: string; target?: string; json: boolean } {
  let bundleDir = path.join(appRoot, "dist-portable");
  let target: string | undefined;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--bundle-dir") {
      bundleDir = path.resolve(argv[++i] ?? bundleDir);
    } else if (arg === "--target") {
      target = argv[++i];
    } else if (arg === "--json") {
      json = true;
    }
  }
  return { bundleDir, target, json };
}

function detectTarget(): string {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "win32" && arch === "x64") return "win-x64";
  return `${platform}-${arch}`;
}

function resolveBundleRoot(bundleDir: string, target: string): string {
  if (fs.existsSync(path.join(bundleDir, "manifest.json"))) return bundleDir;
  const candidate = path.join(bundleDir, "bundle", target);
  if (fs.existsSync(path.join(candidate, "manifest.json"))) return candidate;
  return bundleDir;
}

function findNode(bundleRoot: string, target: string): string | null {
  const candidates = [
    path.join(bundleRoot, "target", "runtime", "node.exe"),
    path.join(bundleRoot, "target", "runtime", "bin", "node"),
    path.join(bundleRoot, "targets", target, "runtime", "node.exe"),
    path.join(bundleRoot, "targets", target, "runtime", "bin", "node"),
  ];
  return candidates.find((v) => fs.existsSync(v)) ?? null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = args.target ?? detectTarget();
  const bundleRoot = resolveBundleRoot(args.bundleDir, target);
  const manifestPath = path.join(bundleRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`manifest missing at ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    artifacts?: { serverEntry?: string; webDist?: string; defaultConfig?: string };
    knownLimitations?: string[];
  };
  const serverEntry = manifest.artifacts?.serverEntry;
  const webDist = manifest.artifacts?.webDist;
  const defaultConfig = manifest.artifacts?.defaultConfig;
  if (!serverEntry || !webDist || !defaultConfig) {
    throw new Error("manifest artifacts incomplete");
  }
  const checks = [
    path.join(bundleRoot, serverEntry),
    path.join(bundleRoot, webDist),
    path.join(bundleRoot, defaultConfig),
  ];
  for (const c of checks) {
    if (!fs.existsSync(c)) throw new Error(`artifact missing: ${c}`);
  }
  const bundledNode = findNode(bundleRoot, target);
  const nodeCommand = bundledNode ?? process.execPath;
  const launchScript = fs.existsSync(path.join(bundleRoot, "launch-portable.ts"))
    ? path.join(bundleRoot, "launch-portable.ts")
    : path.join(appRoot, "scripts", "launch-portable.ts");
  const launchResult = spawnSync(nodeCommand, [launchScript], {
    cwd: bundleRoot,
    env: {
      ...process.env,
      APP_ROOT: bundleRoot,
      APP_BUNDLE_ROOT: bundleRoot,
      APP_BUNDLED: "1",
      APP_RUNTIME_MODE: "portable",
      APP_BUNDLE_TARGET: target,
      APP_PORT: process.env.APP_PORT ?? "4000",
      APP_DATA_DIR: path.join(bundleRoot, "portable-data"),
      APP_WEB_DIST_DIR: path.join(bundleRoot, "app", "web"),
    },
    timeout: 8000,
  });

  const result = {
    target,
    bundleRoot,
    manifestPath,
    bundledNode: bundledNode ?? null,
    nodeCommand,
    launchExitCode: launchResult.status,
    launchSignal: launchResult.signal,
    launchStdout: launchResult.stdout?.toString() ?? "",
    launchStderr: launchResult.stderr?.toString() ?? "",
    knownLimitations: manifest.knownLimitations ?? [],
    note: "If sqlite native module fails here under restricted environment, this is a build-policy constraint, not architecture defect.",
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    console.log("Portable smoke summary:");
    console.log(`- target: ${result.target}`);
    console.log(`- bundleRoot: ${result.bundleRoot}`);
    console.log(`- bundledNode: ${result.bundledNode ?? "not found (fallback used)"}`);
    console.log(`- launchExitCode: ${result.launchExitCode ?? "null"} signal=${result.launchSignal ?? "none"}`);
    if (result.launchStderr.trim()) console.log(`- launchStderr: ${result.launchStderr.trim().slice(0, 400)}`);
    if (result.knownLimitations.length) {
      console.log("- knownLimitations:");
      for (const item of result.knownLimitations) console.log(`  - ${item}`);
    }
    console.log(`- ${result.note}`);
  }
}

main();
