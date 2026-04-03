import type { FastifyInstance } from "fastify";
import { getConfig } from "../config.js";
import { appRoot, dataDir } from "../paths.js";
import { getClientCount } from "../sse.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return {
      status: "ok",
      version: "0.1.0",
      time: new Date().toISOString(),
      appRoot,
      dataDir,
      sseClients: getClientCount(),
      config: {
        port: getConfig().server.port,
      },
    };
  });
}
