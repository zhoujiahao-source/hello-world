import type { FastifyInstance } from "fastify";
import { listEngines, getEngineByKind } from "../repositories/enginesRepo.js";
import { discoverAllEngines, getAdapter } from "../services/engineDiscovery.js";
import { NotFoundError } from "../utils/errors.js";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { ENGINE_KINDS } from "@usb-ai-workbench/shared";

export async function engineRoutes(app: FastifyInstance): Promise<void> {
  app.get("/engines", async () => {
    return { success: true, data: listEngines() };
  });

  app.post("/engines/discover", async () => {
    const engines = await discoverAllEngines();
    return { success: true, data: engines };
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
