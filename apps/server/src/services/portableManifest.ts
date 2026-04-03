import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { resolveManifestPath, resolveRuntimeMode } from "../runtime.js";
import type { EngineKind } from "@usb-ai-workbench/shared";

export interface ManifestProviderInfo {
  enabled: boolean;
  source: "bundled" | "configured" | "system-path" | "not-found" | "disabled";
  version: string | null;
  binaryPath: string | null;
  detected: boolean;
}

export interface PortableManifest {
  appName: string;
  appVersion: string;
  target: string;
  buildTime: string;
  portableMode: boolean;
  nodeVersion: string;
  bundledNodePath: string | null;
  providers: Record<EngineKind, ManifestProviderInfo>;
  artifacts: {
    serverEntry: string;
    webDist: string;
    defaultConfig: string;
  };
  checksums: Record<string, string>;
  buildHost: { platform: string; arch: string; hostname: string };
  notes: string[];
  knownLimitations: string[];
}

export interface ManifestReadResult {
  manifest: PortableManifest | null;
  exists: boolean;
  valid: boolean;
  errors: string[];
  path: string;
}

const REQUIRED_TOP_LEVEL = [
  "appName",
  "appVersion",
  "target",
  "buildTime",
  "portableMode",
  "nodeVersion",
  "bundledNodePath",
  "providers",
  "artifacts",
  "checksums",
  "buildHost",
  "notes",
  "knownLimitations",
] as const;

export function readPortableManifest(): ManifestReadResult {
  const manifestPath = resolveManifestPath();
  if (!fs.existsSync(manifestPath)) {
    return { manifest: null, exists: false, valid: false, errors: ["manifest.json missing"], path: manifestPath };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PortableManifest;
    const errors: string[] = [];
    for (const key of REQUIRED_TOP_LEVEL) {
      if (!(key in raw)) errors.push(`Missing field: ${key}`);
    }
    if (typeof raw.providers !== "object") errors.push("providers must be an object");
    if (typeof raw.artifacts !== "object") errors.push("artifacts must be an object");
    if (raw.portableMode !== (resolveRuntimeMode() !== "dev")) {
      errors.push("portableMode does not match runtime mode");
    }
    return { manifest: raw, exists: true, valid: errors.length === 0, errors, path: manifestPath };
  } catch (err) {
    return {
      manifest: null,
      exists: true,
      valid: false,
      errors: [`manifest parse error: ${String(err)}`],
      path: manifestPath,
    };
  }
}

export function getManifestSummary() {
  const manifestState = readPortableManifest();
  return {
    ...manifestState,
    summary: manifestState.manifest
      ? {
          appName: manifestState.manifest.appName,
          appVersion: manifestState.manifest.appVersion,
          target: manifestState.manifest.target,
          buildTime: manifestState.manifest.buildTime,
          portableMode: manifestState.manifest.portableMode,
        }
      : null,
  };
}

export function checksumForArtifact(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

export function resolveArtifactPath(artifactRelativePath: string): string {
  const root = path.dirname(resolveManifestPath());
  return path.resolve(root, artifactRelativePath);
}

export function verifyManifestArtifacts(): { ok: boolean; errors: string[] } {
  const { manifest, valid, errors } = readPortableManifest();
  if (!manifest || !valid) return { ok: false, errors };
  const artifactErrors: string[] = [];
  const artifactPaths = [
    manifest.artifacts.serverEntry,
    manifest.artifacts.webDist,
    manifest.artifacts.defaultConfig,
  ];
  for (const rel of artifactPaths) {
    const abs = resolveArtifactPath(rel);
    if (!fs.existsSync(abs)) artifactErrors.push(`Missing artifact: ${rel}`);
  }
  return { ok: artifactErrors.length === 0, errors: artifactErrors };
}
