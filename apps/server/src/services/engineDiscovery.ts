import { ClaudeAdapter } from "../adapters/claude.js";
import { CodexAdapter } from "../adapters/codex.js";
import { OpenCodeAdapter } from "../adapters/opencode.js";
import { OpenClawAdapter } from "../adapters/openclaw.js";
import type { EngineAdapter } from "../adapters/base.js";
import { upsertEngine, listEngines } from "../repositories/enginesRepo.js";
import { getConfig } from "../config.js";
import { logger } from "../logger.js";
import type { Engine } from "@usb-ai-workbench/shared";

export const adapters = new Map<string, EngineAdapter>([
  ["claude", new ClaudeAdapter()],
  ["codex", new CodexAdapter()],
  ["opencode", new OpenCodeAdapter()],
  ["openclaw", new OpenClawAdapter()],
]);

export function getAdapter(kind: string): EngineAdapter | null {
  return adapters.get(kind) ?? null;
}

export async function discoverAllEngines(): Promise<Engine[]> {
  const config = getConfig();
  const results: Engine[] = [];
  for (const [kind, adapter] of adapters.entries()) {
    const engineConfig = config.engines[kind as keyof typeof config.engines];
    if (!engineConfig) continue;
    try {
      const status = await adapter.discover();
      const engine = upsertEngine(adapter.kind, {
        name: kind,
        version: status.version,
        executablePath: status.executablePath,
        health: status.health,
        enabled: engineConfig.enabled,
      });
      results.push(engine);
      logger.info("Engine discovered", { kind, health: status.health });
    } catch (err) {
      logger.error("Engine discovery failed", { kind, err: String(err) });
      upsertEngine(adapter.kind, { name: kind, health: "unavailable", enabled: false });
    }
  }
  return results;
}
