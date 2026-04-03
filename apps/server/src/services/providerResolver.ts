import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../config.js";
import { resolveBundledProviderPath } from "../runtime.js";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { getSetting } from "../repositories/settingsRepo.js";

const IS_WIN = process.platform === "win32";

function candidatePathsFromBundled(provider: EngineKind): string[] {
  const providersRoot = process.env.APP_BUNDLED_PROVIDERS_ROOT;
  const targetRoot = process.env.APP_BUNDLED_TARGET_ROOT;
  const candidates: string[] = [];
  const binName = IS_WIN ? `${provider}.exe` : provider;

  const resolved = resolveBundledProviderPath(provider);
  if (resolved) candidates.push(resolved);

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

function candidatePathFromOverride(provider: EngineKind): string | null {
  const dbOverride = getSetting(`engine.${provider}.pathOverride`)?.value;
  if (dbOverride && dbOverride.trim().length > 0) {
    return path.resolve(dbOverride);
  }
  const config = getConfig();
  const entry = config.engines[provider];
  if (entry.pathOverride && entry.pathOverride.trim().length > 0) {
    return path.resolve(entry.pathOverride);
  }
  return null;
}

export interface ProviderResolution {
  command: string;
  source: "bundled" | "configured" | "system-path" | "not-found";
  bundledPath: string | null;
  overridePath: string | null;
  pathFallbackAllowed: boolean;
  warnings: string[];
}

export function resolveProviderCommand(
  provider: EngineKind,
): ProviderResolution {
  const warnings: string[] = [];
  for (const bundled of candidatePathsFromBundled(provider)) {
    if (fs.existsSync(bundled)) {
      return {
        command: bundled,
        source: "bundled",
        bundledPath: bundled,
        overridePath: candidatePathFromOverride(provider),
        pathFallbackAllowed: getConfig().runtime?.allowPathFallback !== false,
        warnings,
      };
    }
  }
  const override = candidatePathFromOverride(provider);
  if (override && fs.existsSync(override)) {
    return {
      command: override,
      source: "configured",
      bundledPath: resolveBundledProviderPath(provider),
      overridePath: override,
      pathFallbackAllowed: getConfig().runtime?.allowPathFallback !== false,
      warnings,
    };
  }
  if (override && !fs.existsSync(override)) {
    warnings.push(`Configured override path not found: ${override}`);
  }
  const pathFallbackAllowed = getConfig().runtime?.allowPathFallback !== false;
  if (!pathFallbackAllowed) {
    return {
      command: getConfig().engines[provider].command,
      source: "not-found",
      bundledPath: resolveBundledProviderPath(provider),
      overridePath: override,
      pathFallbackAllowed: false,
      warnings: [...warnings, "PATH fallback is disabled in current runtime mode"],
    };
  }
  return {
    command: getConfig().engines[provider].command,
    source: "system-path",
    bundledPath: resolveBundledProviderPath(provider),
    overridePath: override,
    pathFallbackAllowed,
    warnings,
  };
}
