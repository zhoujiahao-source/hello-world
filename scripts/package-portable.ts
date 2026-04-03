#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const bundleRoot = path.join(appRoot, "dist-portable");

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

function main() {
  const target = process.env.PORTABLE_TARGET ?? detectTarget();
  const targetBundleRoot = path.join(bundleRoot, "bundle", target);
  fs.rmSync(targetBundleRoot, { recursive: true, force: true });
  fs.mkdirSync(targetBundleRoot, { recursive: true });

  fs.cpSync(path.join(bundleRoot, "app"), path.join(targetBundleRoot, "app"), { recursive: true });
  fs.cpSync(path.join(bundleRoot, "config"), path.join(targetBundleRoot, "config"), { recursive: true });
  if (fs.existsSync(path.join(bundleRoot, "manifest.json"))) {
    fs.cpSync(path.join(bundleRoot, "manifest.json"), path.join(targetBundleRoot, "manifest.json"));
  }
  fs.cpSync(path.join(bundleRoot, "portable-data"), path.join(targetBundleRoot, "portable-data"), {
    recursive: true,
  });
  fs.cpSync(path.join(bundleRoot, "targets", target), path.join(targetBundleRoot, "target"), {
    recursive: true,
  });
  fs.cpSync(path.join(appRoot, "scripts", "start.sh"), path.join(targetBundleRoot, "start.sh"));
  fs.cpSync(path.join(appRoot, "scripts", "start.ps1"), path.join(targetBundleRoot, "start.ps1"));
  fs.cpSync(
    path.join(appRoot, "scripts", "launch-portable.ts"),
    path.join(targetBundleRoot, "launch-portable.ts"),
  );

  const archiveName = `usb-ai-workbench-portable-${target}.tar.gz`;
  const archivePath = path.join(bundleRoot, archiveName);
  execSync(`tar -czf ${archivePath} -C ${path.join(bundleRoot, "bundle")} ${target}`, { stdio: "inherit" });
  console.log(`Created portable archive: ${archivePath}`);
}

main();
