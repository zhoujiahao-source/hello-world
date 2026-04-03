#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const outRoot = path.join(appRoot, "dist-portable");
const packageJson = JSON.parse(fs.readFileSync(path.join(appRoot, "package.json"), "utf8")) as { name: string; version: string };

function run(command: string): void {
  console.log(`\n> ${command}`);
  execSync(command, { cwd: appRoot, stdio: "inherit", env: { ...process.env, PNPM_IGNORE_SCRIPTS: "false" } });
}

function sha256(filePath: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
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

function findBundledNode(target: string): string | null {
  const runtimeDir = path.join(outRoot, "targets", target, "runtime");
  if (!fs.existsSync(runtimeDir)) return null;
  if (process.platform === "win32") {
    const p = path.join("targets", target, "runtime", "node.exe");
    return fs.existsSync(path.join(outRoot, p)) ? p : null;
  }
  const direct = path.join("targets", target, "runtime", "bin", "node");
  if (fs.existsSync(path.join(outRoot, direct))) return direct;
  for (const entry of fs.readdirSync(runtimeDir)) {
    const nested = path.join("targets", target, "runtime", entry, "bin", "node");
    if (fs.existsSync(path.join(outRoot, nested))) return nested;
  }
  return null;
}

function findProvider(target: string, provider: string): { path: string | null; detected: boolean } {
  const exe = process.platform === "win32" ? `${provider}.exe` : provider;
  const candidates = [
    path.join("targets", target, "providers", provider, "bin", exe),
    path.join("targets", target, "providers", provider, exe),
  ];
  for (const rel of candidates) {
    if (fs.existsSync(path.join(outRoot, rel))) return { path: rel, detected: true };
  }
  return { path: null, detected: false };
}

function writeManifest(target: string): void {
  const serverEntry = "app/server/index.cjs";
  const webDist = "app/web";
  const defaultConfig = "config/default.yaml";
  const bundledNodePath = findBundledNode(target);
  const providers = {
    claude: findProvider(target, "claude"),
    codex: findProvider(target, "codex"),
    opencode: findProvider(target, "opencode"),
    openclaw: { path: null, detected: false },
  };

  const checksums: Record<string, string> = {};
  const checksumArtifacts = [serverEntry, defaultConfig, "manifests/providers.json", "manifests/runtimes.json"];
  for (const rel of checksumArtifacts) {
    const abs = path.join(outRoot, rel);
    if (fs.existsSync(abs)) checksums[rel] = sha256(abs);
  }
  const webIndex = path.join(outRoot, webDist, "index.html");
  if (fs.existsSync(webIndex)) checksums[`${webDist}/index.html`] = sha256(webIndex);

  const manifest = {
    appName: "USB AI Workbench",
    appVersion: packageJson.version,
    target,
    buildTime: new Date().toISOString(),
    portableMode: true,
    nodeVersion: process.version,
    bundledNodePath,
    providers: {
      claude: {
        enabled: true,
        source: providers.claude.detected ? "bundled" : "not-found",
        version: null,
        binaryPath: providers.claude.path,
        detected: providers.claude.detected,
      },
      codex: {
        enabled: true,
        source: providers.codex.detected ? "bundled" : "not-found",
        version: null,
        binaryPath: providers.codex.path,
        detected: providers.codex.detected,
      },
      opencode: {
        enabled: true,
        source: providers.opencode.detected ? "bundled" : "not-found",
        version: null,
        binaryPath: providers.opencode.path,
        detected: providers.opencode.detected,
      },
      openclaw: {
        enabled: false,
        source: "disabled",
        version: null,
        binaryPath: null,
        detected: false,
      },
    },
    artifacts: {
      serverEntry,
      webDist,
      defaultConfig,
    },
    checksums,
    buildHost: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
    },
    notes: [
      "Portable runtime prefers bundled binaries and only falls back to PATH when enabled.",
      "All state/logs/database are stored under portable-data.",
    ],
    knownLimitations: [
      "better-sqlite3 native module requires build scripts to be allowed on packaging machine.",
      "In restricted sandbox environments, native-build smoke tests may fail due to policy, not architecture.",
    ],
  };
  fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
}

async function bundleServer(): Promise<void> {
  const serverOut = path.join(outRoot, "app", "server");
  fs.mkdirSync(serverOut, { recursive: true });
  await build({
    entryPoints: [path.join(appRoot, "apps", "server", "src", "index.ts")],
    outfile: path.join(serverOut, "index.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node20",
    sourcemap: false,
    minify: false,
    external: ["better-sqlite3"],
  });
}

async function main() {
  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });

  run("pnpm --filter @usb-ai-workbench/shared build");
  run("pnpm --filter @usb-ai-workbench/web build");
  await bundleServer();

  const webDist = path.join(appRoot, "apps", "web", "dist");
  const webOut = path.join(outRoot, "app", "web");
  fs.mkdirSync(path.dirname(webOut), { recursive: true });
  fs.cpSync(webDist, webOut, { recursive: true });

  const portableTargets = path.join(appRoot, "portable", "targets");
  const outTargets = path.join(outRoot, "targets");
  fs.cpSync(portableTargets, outTargets, { recursive: true });

  fs.cpSync(path.join(appRoot, "config"), path.join(outRoot, "config"), { recursive: true });
  fs.cpSync(path.join(appRoot, "portable-data"), path.join(outRoot, "portable-data"), {
    recursive: true,
  });
  fs.cpSync(path.join(appRoot, "portable", "manifests"), path.join(outRoot, "manifests"), {
    recursive: true,
  });

  const deployDir = path.join(outRoot, "app", "server-runtime");
  fs.rmSync(deployDir, { recursive: true, force: true });
  run(`pnpm --filter @usb-ai-workbench/server deploy --prod --legacy ${deployDir}`);
  run(`pnpm --dir ${deployDir} rebuild better-sqlite3`);
  writeManifest(process.env.PORTABLE_TARGET ?? detectTarget());

  console.log(`\nPortable bundle prepared at: ${outRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
