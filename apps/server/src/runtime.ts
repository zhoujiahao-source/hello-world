import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { EngineKind } from "@usb-ai-workbench/shared";

export type RuntimeMode = "dev" | "portable" | "packaged";

function detectTarget(): string {
  if (process.env.APP_BUNDLE_TARGET) return process.env.APP_BUNDLE_TARGET;
  const platform = os.platform();
  const arch = os.arch();
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "win32" && arch === "x64") return "win-x64";
  return `${platform}-${arch}`;
}

export function resolveBundleRoot(): string {
  if (process.env.APP_BUNDLE_ROOT) return path.resolve(process.env.APP_BUNDLE_ROOT);
  if (process.env.APP_ROOT) return path.resolve(process.env.APP_ROOT);
  return path.resolve(process.cwd());
}

export function resolveRuntimeMode(): RuntimeMode {
  const root = resolveBundleRoot();
  const hasPortableApp = fs.existsSync(path.join(root, "app", "server")) || fs.existsSync(path.join(root, "app", "server-runtime"));
  const hasTarget = fs.existsSync(path.join(root, "target")) || fs.existsSync(path.join(root, "targets"));
  if (process.env.APP_BUNDLED === "1" && hasPortableApp) return "packaged";
  if (hasTarget || hasPortableApp || process.env.APP_PORTABLE_MODE === "1") return "portable";
  return "dev";
}

export function isPortableMode(): boolean {
  return resolveRuntimeMode() !== "dev";
}

export function resolvePortableDataDir(): string {
  if (process.env.APP_DATA_DIR) return path.resolve(process.env.APP_DATA_DIR);
  return path.join(resolveBundleRoot(), "portable-data");
}

export function resolveManifestPath(): string {
  return path.join(resolveBundleRoot(), "manifest.json");
}

export function resolveTargetRoot(): string {
  const root = resolveBundleRoot();
  const direct = path.join(root, "target");
  if (fs.existsSync(direct)) return direct;
  return path.join(root, "targets", detectTarget());
}

export function resolveBundledNodePath(): string | null {
  const targetRoot = resolveTargetRoot();
  const runtimeDir = path.join(targetRoot, "runtime");
  if (!fs.existsSync(runtimeDir)) return null;
  if (process.platform === "win32") {
    const win = path.join(runtimeDir, "node.exe");
    return fs.existsSync(win) ? win : null;
  }
  const direct = path.join(runtimeDir, "bin", "node");
  if (fs.existsSync(direct)) return direct;
  if (!fs.existsSync(runtimeDir)) return null;
  for (const entry of fs.readdirSync(runtimeDir)) {
    const nested = path.join(runtimeDir, entry, "bin", "node");
    if (fs.existsSync(nested)) return nested;
  }
  return null;
}

export function resolveBundledProviderPath(kind: EngineKind): string | null {
  const targetRoot = resolveTargetRoot();
  const exe = process.platform === "win32" ? `${kind}.exe` : kind;
  const candidates = [
    path.join(targetRoot, "providers", kind, "bin", exe),
    path.join(targetRoot, "providers", kind, exe),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function resolveWebDistPath(): string {
  if (process.env.APP_WEB_DIST_DIR) return path.resolve(process.env.APP_WEB_DIST_DIR);
  const root = resolveBundleRoot();
  const bundled = path.join(root, "app", "web");
  if (fs.existsSync(bundled)) return bundled;
  return path.join(root, "apps", "web", "dist");
}

export function getRuntimeContext() {
  const bundleRoot = resolveBundleRoot();
  const mode = resolveRuntimeMode();
  return {
    mode,
    portable: mode !== "dev",
    bundleRoot,
    target: detectTarget(),
    dataDir: resolvePortableDataDir(),
    manifestPath: resolveManifestPath(),
    webDistPath: resolveWebDistPath(),
    bundledNodePath: resolveBundledNodePath(),
    targetRoot: resolveTargetRoot(),
  };
}
