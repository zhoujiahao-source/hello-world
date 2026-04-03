#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

type ProviderTarget = { url: string; sha256: string; binaryPath: string };
type ProviderManifest = {
  providers: Record<string, Record<string, ProviderTarget> | { enabled: false }>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(appRoot, "portable", "manifests", "providers.json");
const targetsRoot = path.join(appRoot, "portable", "targets");

function download(url: string, toFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(toFile), { recursive: true });
    const file = fs.createWriteStream(toFile);
    https
      .get(url, (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", reject);
  });
}

function isDisabled(value: unknown): value is { enabled: false } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "enabled" in value &&
      (value as { enabled?: boolean }).enabled === false,
  );
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ProviderManifest;
  for (const [provider, mapping] of Object.entries(manifest.providers)) {
    if (isDisabled(mapping)) {
      console.log(`Skipping disabled provider: ${provider}`);
      continue;
    }
    for (const [target, entry] of Object.entries(mapping)) {
      const providerDir = path.join(targetsRoot, target, "providers", provider);
      fs.mkdirSync(providerDir, { recursive: true });
      const archiveName = path.basename(new URL(entry.url).pathname);
      const archivePath = path.join(providerDir, archiveName);
      if (!fs.existsSync(archivePath)) {
        console.log(`Downloading provider ${provider} for ${target}...`);
        await download(entry.url, archivePath);
      } else {
        console.log(`Provider archive already exists for ${provider}/${target}: ${archiveName}`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
