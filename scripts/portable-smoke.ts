#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const distRoot = path.join(appRoot, "dist-portable");

function ensure(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main() {
  const manifestPath = path.join(distRoot, "manifest.json");
  ensure(fs.existsSync(manifestPath), "dist-portable/manifest.json missing");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    artifacts?: { serverEntry?: string; webDist?: string; defaultConfig?: string };
    bundledNodePath?: string | null;
    knownLimitations?: string[];
  };
  const serverEntry = manifest.artifacts?.serverEntry;
  const webDist = manifest.artifacts?.webDist;
  const defaultConfig = manifest.artifacts?.defaultConfig;
  ensure(Boolean(serverEntry), "manifest.artifacts.serverEntry missing");
  ensure(Boolean(webDist), "manifest.artifacts.webDist missing");
  ensure(Boolean(defaultConfig), "manifest.artifacts.defaultConfig missing");
  ensure(fs.existsSync(path.join(distRoot, serverEntry!)), "server entry artifact missing");
  ensure(fs.existsSync(path.join(distRoot, webDist!)), "web dist artifact missing");
  ensure(fs.existsSync(path.join(distRoot, defaultConfig!)), "default config artifact missing");
  if (!manifest.bundledNodePath) {
    console.warn("[warn] bundledNodePath not found in current build output.");
  }
  if (manifest.knownLimitations?.length) {
    console.warn("[info] known limitations:");
    for (const l of manifest.knownLimitations) console.warn(`- ${l}`);
  }
  console.log("Portable smoke checks passed.");
}

main();
