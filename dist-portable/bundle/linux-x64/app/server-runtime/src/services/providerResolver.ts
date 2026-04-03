import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../config.js";

const IS_WIN = process.platform === "win32";

function candidatePathsFromBundled(provider: string): string[] {
  const providersRoot = process.env.APP_BUNDLED_PROVIDERS_ROOT;
  const targetRoot = process.env.APP_BUNDLED_TARGET_ROOT;
  const candidates: string[] = [];
  const binName = IS_WIN ? `${provider}.exe` : provider;

  if (providersRoot) {
    candidates.push(path.join(providersRoot, provider, "bin", binName));
    candidates.push(path.join(providersRoot, provider, binName));
  }
  if (targetRoot) {
    candidates.push(path.join(targetRoot, "providers", provider, "bin", binName));
    candidates.push(path.join(targetRoot, "providers", provider, binName));
  }
  return candidates;
}

function candidatePathFromOverride(provider: "claude" | "codex" | "opencode" | "openclaw"): string | null {
  const config = getConfig();
  const entry = config.engines[provider];
  if (entry.pathOverride && entry.pathOverride.trim().length > 0) {
    return path.resolve(entry.pathOverride);
  }
  return null;
}

export function resolveProviderCommand(
  provider: "claude" | "codex" | "opencode" | "openclaw",
): { command: string; source: "bundled" | "override" | "path" } {
  for (const bundled of candidatePathsFromBundled(provider)) {
    if (fs.existsSync(bundled)) return { command: bundled, source: "bundled" };
  }
  const override = candidatePathFromOverride(provider);
  if (override && fs.existsSync(override)) return { command: override, source: "override" };
  return { command: getConfig().engines[provider].command, source: "path" };
}
