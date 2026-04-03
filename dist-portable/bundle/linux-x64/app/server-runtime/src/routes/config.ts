import type { FastifyInstance } from "fastify";
import { getConfig } from "../config.js";
import { listSettings, setSetting, getSetting, deleteSetting } from "../repositories/settingsRepo.js";
import { settingSchema } from "@usb-ai-workbench/shared";
import { ValidationError } from "../utils/errors.js";
import { ZodError } from "zod";

export async function configRoutes(app: FastifyInstance): Promise<void> {
  app.get("/config", async () => {
    const config = getConfig();
    // Don't expose sensitive data
    return {
      success: true,
      data: {
        server: config.server,
        frontend: config.frontend,
        engines: Object.fromEntries(
          Object.entries(config.engines).map(([k, v]) => [k, { enabled: v.enabled, stub: v.stub ?? false }])
        ),
        scheduler: config.scheduler,
      },
    };
  });

  app.get("/settings", async () => {
    return { success: true, data: listSettings() };
  });

  app.put<{ Params: { key: string } }>("/settings/:key", async (req) => {
    let input;
    try {
      input = settingSchema.parse({ key: req.params.key, ...(req.body as object) });
    } catch (e) {
      if (e instanceof ZodError) throw new ValidationError(e.errors.map(x => x.message).join("; "));
      throw e;
    }
    const setting = setSetting(input.key, input.value);
    return { success: true, data: setting };
  });

  app.delete<{ Params: { key: string } }>("/settings/:key", async (req) => {
    deleteSetting(req.params.key);
    return { success: true, data: null };
  });
}
