#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type RuntimeEntry = { archive: string; sha256: string; binPath: string };
type RuntimeManifest = {
  nodeVersion: string;
  targets: Record<string, RuntimeEntry>;
};

type ProviderTarget = { url: string; sha256: string; binaryPath: string };
type ProviderManifest = {
  providers: Record<string, Record<string, ProviderTarget> | { enabled: false }>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const targetsRoot = path.join(appRoot, "portable", "targets");

function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function ensureVerified(filePath: string, expected: string, label: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
  if (!expected || expected === "REPLACE_WITH_REAL_SHA256") {
    throw new Error(`Missing checksum for ${label}`);
  }
  const actual = sha256File(filePath);
  if (actual !== expected) {
    throw new Error(`Checksum mismatch for ${label}: expected=${expected}, actual=${actual}`);
  }
}

function isDisabled(value: unknown): value is { enabled: false } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "enabled" in value &&
      (value as { enabled?: boolean }).enabled === false,
  );
}

function main() {
  const runtimeManifest = JSON.parse(
    fs.readFileSync(path.join(appRoot, "portable", "manifests", "runtimes.json"), "utf8"),
  ) as RuntimeManifest;
  const providerManifest = JSON.parse(
    fs.readFileSync(path.join(appRoot, "portable", "manifests", "providers.json"), "utf8"),
  ) as ProviderManifest;

  for (const [target, runtime] of Object.entries(runtimeManifest.targets)) {
    const runtimeArchive = path.basename(new URL(runtime.archive).pathname);
    const runtimeFile = path.join(targetsRoot, target, "runtime", runtimeArchive);
    ensureVerified(runtimeFile, runtime.sha256, `runtime ${target}`);
  }

  for (const [provider, mapping] of Object.entries(providerManifest.providers)) {
    if (isDisabled(mapping)) continue;
    for (const [target, entry] of Object.entries(mapping)) {
      const archiveName = path.basename(new URL(entry.url).pathname);
      const archivePath = path.join(targetsRoot, target, "providers", provider, archiveName);
      ensureVerified(archivePath, entry.sha256, `provider ${provider}/${target}`);
    }
  }

  const distManifestPath = path.join(appRoot, "dist-portable", "manifest.json");
  if (fs.existsSync(distManifestPath)) {
    const distManifest = JSON.parse(fs.readFileSync(distManifestPath, "utf8")) as {
      artifacts?: { serverEntry?: string; webDist?: string; defaultConfig?: string };
      checksums?: Record<string, string>;
    };
    const artifacts = [
      distManifest.artifacts?.serverEntry,
      distManifest.artifacts?.defaultConfig,
    ].filter((v): v is string => Boolean(v));
    for (const rel of artifacts) {
      const abs = path.join(appRoot, "dist-portable", rel);
      if (!fs.existsSync(abs)) {
        throw new Error(`dist-portable manifest artifact missing: ${rel}`);
      }
      const expected = distManifest.checksums?.[rel];
      if (expected) ensureVerified(abs, expected, `manifest artifact ${rel}`);
    }
  }

  console.log("All runtime/provider archives are present and checksum verified.");
}

main();
