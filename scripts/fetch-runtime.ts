#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

type RuntimeEntry = { archive: string; sha256: string; binPath: string };
type RuntimeManifest = {
  nodeVersion: string;
  targets: Record<string, RuntimeEntry>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(appRoot, "portable", "manifests", "runtimes.json");
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

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as RuntimeManifest;
  for (const [target, runtime] of Object.entries(manifest.targets)) {
    const runtimeDir = path.join(targetsRoot, target, "runtime");
    fs.mkdirSync(runtimeDir, { recursive: true });
    const archiveName = path.basename(new URL(runtime.archive).pathname);
    const archivePath = path.join(runtimeDir, archiveName);
    if (!fs.existsSync(archivePath)) {
      console.log(`Downloading Node runtime for ${target}...`);
      await download(runtime.archive, archivePath);
    } else {
      console.log(`Runtime archive already exists for ${target}: ${archiveName}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
