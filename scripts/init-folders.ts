#!/usr/bin/env tsx
/**
 * Initialize portable-data directory structure.
 * Safe to run multiple times.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.APP_DATA_DIR ?? path.join(APP_ROOT, "portable-data");

const DIRS = [
  "db",
  "logs",
  "runs",
  "artifacts",
  "state/claude",
  "state/codex",
  "state/opencode",
  "state/openclaw",
  "config",
  "cache",
  "temp",
  "workspaces",
];

console.log(`Initializing portable-data at: ${DATA_DIR}`);

for (const dir of DIRS) {
  const full = path.join(DATA_DIR, dir);
  fs.mkdirSync(full, { recursive: true });
  console.log(`  ✓ ${full}`);
}

// Create .gitkeep in key dirs
for (const dir of ["logs", "runs", "artifacts"]) {
  const keep = path.join(DATA_DIR, dir, ".gitkeep");
  if (!fs.existsSync(keep)) {
    fs.writeFileSync(keep, "");
  }
}

console.log("\nDone. portable-data initialized.");
