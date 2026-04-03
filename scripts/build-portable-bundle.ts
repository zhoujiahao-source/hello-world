#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const outRoot = path.join(appRoot, "dist-portable");

function run(command: string): void {
  console.log(`\n> ${command}`);
  execSync(command, { cwd: appRoot, stdio: "inherit", env: { ...process.env, PNPM_IGNORE_SCRIPTS: "false" } });
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

  console.log(`\nPortable bundle prepared at: ${outRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
