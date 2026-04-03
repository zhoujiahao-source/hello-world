#!/usr/bin/env tsx
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
const limitationNotes: string[] = [];

function parseArgs(argv: string[]): { target?: string; bundleDir: string; json: boolean } {
  let target: string | undefined;
  let bundleDir = path.join(APP_ROOT, "dist-portable");
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target") {
      target = argv[i + 1];
      i++;
    } else if (arg === "--bundle-dir") {
      bundleDir = path.resolve(argv[i + 1] ?? bundleDir);
      i++;
    } else if (arg === "--json") {
      json = true;
    }
  }
  return { target, bundleDir, json };
}

function detectHostTarget(): string {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "win32" && arch === "x64") return "win-x64";
  return `${platform}-${arch}`;
}

const args = parseArgs(process.argv.slice(2));
const target = args.target ?? detectHostTarget();

function resolveBundleRoot(inputDir: string, detectedTarget: string): string {
  const directManifest = path.join(inputDir, "manifest.json");
  if (fs.existsSync(directManifest)) return inputDir;
  const nested = path.join(inputDir, "bundle", detectedTarget);
  if (fs.existsSync(path.join(nested, "manifest.json"))) return nested;
  return inputDir;
}

const BUNDLE_DIR = resolveBundleRoot(args.bundleDir, target);

function existsExecutable(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  if (process.platform === "win32") return true;
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

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

check("current runtime mode", () => {
  if (fs.existsSync(path.join(BUNDLE_DIR, "manifest.json"))) return "portable";
  return "dev";
});

check("Node.js >= 20", () => {
  const v = process.version;
  const major = parseInt(v.slice(1).split(".")[0]!, 10);
  if (major < 20) throw new Error(`Found ${v}, need >= 20`);
  return v;
});

warn("pnpm installed", () => {
  return execSync("pnpm --version", { encoding: "utf8" }).trim();
});

check("manifest exists and parseable", () => {
  const manifestPath = path.join(BUNDLE_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`missing ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    artifacts?: { serverEntry?: string; webDist?: string; defaultConfig?: string };
  };
  if (!manifest.artifacts?.serverEntry || !manifest.artifacts?.webDist || !manifest.artifacts?.defaultConfig) {
    throw new Error("manifest missing artifact fields");
  }
  return manifestPath;
});

check("portable-data writable", () => {
  const dir = path.join(BUNDLE_DIR, "portable-data");
  fs.mkdirSync(dir, { recursive: true });
  const testFile = path.join(dir, ".write-test");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
  return dir;
});

check("bundled Node exists and executable", () => {
  const candidates = [
    path.join(BUNDLE_DIR, "target", "runtime", "node.exe"),
    path.join(BUNDLE_DIR, "target", "runtime", "bin", "node"),
    path.join(BUNDLE_DIR, "targets", target, "runtime", "node.exe"),
    path.join(BUNDLE_DIR, "targets", target, "runtime", "bin", "node"),
  ];
  const found = candidates.find(existsExecutable);
  if (!found) throw new Error("bundled node binary not found/executable");
  return found;
});

for (const provider of ["claude", "codex", "opencode"]) {
  warn(`bundled provider exists (${provider})`, () => {
    const exe = process.platform === "win32" ? `${provider}.exe` : provider;
    const candidates = [
      path.join(BUNDLE_DIR, "target", "providers", provider, "bin", exe),
      path.join(BUNDLE_DIR, "target", "providers", provider, exe),
      path.join(BUNDLE_DIR, "targets", target, "providers", provider, "bin", exe),
      path.join(BUNDLE_DIR, "targets", target, "providers", provider, exe),
    ];
    const found = candidates.find((v) => fs.existsSync(v));
    if (!found) throw new Error("provider binary missing");
    if (!existsExecutable(found)) throw new Error("provider binary not executable");
    return found;
  });
}

check("web dist exists", () => {
  const direct = path.join(BUNDLE_DIR, "app", "web", "index.html");
  if (!fs.existsSync(direct)) throw new Error("web dist index.html missing");
  return direct;
});

check("server entry exists", () => {
  const candidates = [
    path.join(BUNDLE_DIR, "app", "server", "index.cjs"),
    path.join(BUNDLE_DIR, "app", "server-runtime", "dist", "index.js"),
  ];
  const found = candidates.find((v) => fs.existsSync(v));
  if (!found) throw new Error("server entry missing");
  return found;
});

warn("sqlite native module status", () => {
  const nativeCandidates = [
    path.join(BUNDLE_DIR, "app", "server-runtime", "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"),
    path.join(BUNDLE_DIR, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"),
  ];
  const found = nativeCandidates.find((v) => fs.existsSync(v));
  if (!found) {
    limitationNotes.push("better-sqlite3 native module appears unavailable in current environment.");
    limitationNotes.push("This is typically due to native build/pnpm script policy restrictions, not application architecture.");
    limitationNotes.push("Re-run packaging/smoke on CI/build machine that allows native build scripts.");
    throw new Error("better-sqlite3 native binary not found");
  }
  return found;
});

warn("native-build policy", () => {
  if (process.env.PNPM_IGNORE_SCRIPTS === "true" || process.env.npm_config_ignore_scripts === "true") {
    throw new Error("native build scripts are blocked in current environment");
  }
  return "native build scripts appear allowed";
});

let hasError = false;

if (args.json) {
  for (const r of results) {
    if (r.status === "error") hasError = true;
  }
  process.stdout.write(JSON.stringify({
    bundleDir: BUNDLE_DIR,
    target,
    results,
    limitations: limitationNotes,
    ok: !hasError,
  }, null, 2) + "\n");
} else {
  console.log("\n=== USB AI Workbench Doctor ===\n");
  console.log(`bundleDir: ${BUNDLE_DIR}`);
  console.log(`target: ${target}\n`);
  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : r.status === "warn" ? "⚠" : "✗";
    const color = r.status === "ok" ? "\x1b[32m" : r.status === "warn" ? "\x1b[33m" : "\x1b[31m";
    console.log(`${color}${icon}\x1b[0m  ${r.name}: ${r.message}`);
    if (r.status === "error") hasError = true;
  }
  if (limitationNotes.length > 0) {
    console.log("\nKnown limitation notes:");
    for (const note of limitationNotes) console.log(`- ${note}`);
  }
  console.log("");
}

if (hasError) {
  if (!args.json) console.error("Some checks failed. Please fix the errors above.");
  process.exit(1);
} else {
  if (!args.json) console.log("All critical checks passed.");
}
