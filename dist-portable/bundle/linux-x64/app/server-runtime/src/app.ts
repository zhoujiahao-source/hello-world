import Fastify from "fastify";
import cors from "@fastify/cors";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import { healthRoutes } from "./routes/health.js";
import { engineRoutes } from "./routes/engines.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { sessionRoutes } from "./routes/sessions.js";
import { runRoutes } from "./routes/runs.js";
import { scheduleRoutes } from "./routes/schedules.js";
import { logRoutes } from "./routes/logs.js";
import { configRoutes } from "./routes/config.js";
import { AppError } from "./utils/errors.js";
import fastifyStatic from "@fastify/static";
import path from "node:path";

export function createApp() {
  const config = getConfig();
  const app = Fastify({ logger: false });

  app.register(cors, {
    origin: config.security.allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  const webDistDir = process.env.APP_WEB_DIST_DIR ?? path.join(process.cwd(), "apps", "web", "dist");
  app.register(fastifyStatic, {
    root: webDistDir,
    prefix: "/",
    wildcard: false,
  });

  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message, code: error.code });
    }
    const errObj = error instanceof Error ? error : new Error(String(error));
    logger.error("Unhandled error", { err: errObj.message, stack: errObj.stack });
    return reply.status(500).send({ success: false, error: "Internal server error", code: "INTERNAL_ERROR" });
  });

  app.register(healthRoutes, { prefix: "/api/v1" });
  app.register(engineRoutes, { prefix: "/api/v1" });
  app.register(workspaceRoutes, { prefix: "/api/v1" });
  app.register(sessionRoutes, { prefix: "/api/v1" });
  app.register(runRoutes, { prefix: "/api/v1" });
  app.register(scheduleRoutes, { prefix: "/api/v1" });
  app.register(logRoutes, { prefix: "/api/v1" });
  app.register(configRoutes, { prefix: "/api/v1" });

  app.get("/", async (_req, reply) => {
    return reply.sendFile("index.html");
  });

  return app;
}
