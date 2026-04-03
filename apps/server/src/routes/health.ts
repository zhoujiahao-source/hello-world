import type { FastifyInstance } from "fastify";
import { getConfig } from "../config.js";
import { appRoot, dataDir } from "../paths.js";
import { getClientCount } from "../sse.js";
import { getRuntimeContext } from "../runtime.js";
import { getManifestSummary } from "../services/portableManifest.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    const runtime = getRuntimeContext();
    const manifest = getManifestSummary();
    const limitations: string[] = [];
    if (!manifest.valid) {
      limitations.push("Portable manifest missing or incomplete.");
    }
    if (process.env.PNPM_IGNORE_SCRIPTS === "true" || process.env.npm_config_ignore_scripts === "true") {
      limitations.push("Native build scripts are restricted in this environment.");
    }
    return {
      success: true,
      data: {
        status: "ok",
        version: "0.1.0",
        time: new Date().toISOString(),
        appRoot,
        dataDir,
        sseClients: getClientCount(),
        runtime,
        manifest,
        limitations,
        config: {
          port: getConfig().server.port,
        },
      },
    };
  });
}
