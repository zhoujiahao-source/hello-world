#!/usr/bin/env tsx
/**
 * Build the portable distribution.
 * Builds shared, server, and web, then copies web dist to server's static dir.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

function run(cmd: string, cwd: string = APP_ROOT): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

console.log("=== Building USB AI Workbench Portable ===\n");

run("pnpm --filter @usb-ai-workbench/shared build");
run("pnpm --filter @usb-ai-workbench/server build");
run("pnpm --filter @usb-ai-workbench/web build");

// Copy web dist into server's static directory
const webDist = path.join(APP_ROOT, "apps", "web", "dist");
const serverStatic = path.join(APP_ROOT, "apps", "server", "dist", "public");

if (fs.existsSync(webDist)) {
  fs.mkdirSync(serverStatic, { recursive: true });
  fs.cpSync(webDist, serverStatic, { recursive: true });
  console.log(`\n✓ Web assets copied to ${serverStatic}`);
}

console.log("\n=== Build complete ===");
console.log(`Start with: APP_ROOT=${APP_ROOT} node apps/server/dist/index.js`);
