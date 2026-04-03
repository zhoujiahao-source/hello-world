import type { FastifyInstance } from "fastify";
import { listEngines, getEngineByKind } from "../repositories/enginesRepo.js";
import { discoverAllEngines, getAdapter } from "../services/engineDiscovery.js";
import { NotFoundError } from "../utils/errors.js";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { ENGINE_KINDS } from "@usb-ai-workbench/shared";
import { resolveProviderCommand } from "../services/providerResolver.js";
import { getConfig } from "../config.js";
import { setSetting, deleteSetting } from "../repositories/settingsRepo.js";

export async function engineRoutes(app: FastifyInstance): Promise<void> {
  app.get("/engines", async () => {
    return { success: true, data: listEngines() };
  });

  app.get("/engines/diagnostics", async () => {
    const engines = listEngines();
    const config = getConfig();
    const diagnostics = await Promise.all(
      ENGINE_KINDS.map(async (kind) => {
        const adapter = getAdapter(kind);
        const resolved = resolveProviderCommand(kind);
        const status = adapter ? await adapter.discover() : null;
        const validation = adapter ? await adapter.validate() : { valid: false, message: "adapter missing" };
        const persisted = engines.find((e) => e.kind === kind);
        return {
          kind,
          enabled: config.engines[kind]?.enabled ?? false,
          openClawMvpDisabled: kind === "openclaw",
          source: resolved.source,
          command: resolved.command,
          bundledPath: resolved.bundledPath,
          overridePath: resolved.overridePath,
          pathFallbackAllowed: resolved.pathFallbackAllowed,
          warnings: resolved.warnings,
          status,
          validation,
          metadata: persisted?.metadata ?? {},
        };
      }),
    );
    return { success: true, data: diagnostics };
  });

  app.post("/engines/discover", async () => {
    const engines = await discoverAllEngines();
    return { success: true, data: engines };
  });

  app.post<{ Params: { kind: string } }>("/engines/:kind/validate", async (req) => {
    const kind = req.params.kind as EngineKind;
    if (!ENGINE_KINDS.includes(kind)) throw new NotFoundError("Engine", kind);
    const adapter = getAdapter(kind);
    if (!adapter) throw new NotFoundError("Engine adapter", kind);
    const result = await adapter.validate();
    return { success: true, data: result };
  });

  app.put<{ Params: { kind: string } }>("/engines/:kind/path", async (req) => {
    const kind = req.params.kind as EngineKind;
    if (!ENGINE_KINDS.includes(kind)) throw new NotFoundError("Engine", kind);
    const body = req.body as { path?: string };
    const overridePath = body?.path?.trim();
    if (overridePath) {
      setSetting(`engine.${kind}.pathOverride`, overridePath);
    } else {
      deleteSetting(`engine.${kind}.pathOverride`);
    }
    return { success: true, data: { kind, overridePath: overridePath ?? null } };
  });

  app.delete<{ Params: { kind: string } }>("/engines/:kind/path", async (req) => {
    const kind = req.params.kind as EngineKind;
    if (!ENGINE_KINDS.includes(kind)) throw new NotFoundError("Engine", kind);
    deleteSetting(`engine.${kind}.pathOverride`);
    return { success: true, data: { kind, overridePath: null } };
  });

  app.post<{ Params: { kind: string } }>("/engines/:kind/reset-bundled", async (req) => {
    const kind = req.params.kind as EngineKind;
    if (!ENGINE_KINDS.includes(kind)) throw new NotFoundError("Engine", kind);
    deleteSetting(`engine.${kind}.pathOverride`);
    const resolved = resolveProviderCommand(kind);
    return { success: true, data: { kind, source: resolved.source, command: resolved.command } };
  });

  app.get<{ Params: { kind: string } }>("/engines/:kind", async (req) => {
    const kind = req.params.kind as EngineKind;
    if (!ENGINE_KINDS.includes(kind)) {
      throw new NotFoundError("Engine", kind);
    }
    const engine = getEngineByKind(kind);
    if (!engine) throw new NotFoundError("Engine", kind);
    return { success: true, data: engine };
  });

  app.get<{ Params: { kind: string } }>("/engines/:kind/status", async (req) => {
    const kind = req.params.kind as EngineKind;
    const adapter = getAdapter(kind);
    if (!adapter) throw new NotFoundError("Engine adapter", kind);
    const status = await adapter.discover();
    return { success: true, data: status };
  });
}
