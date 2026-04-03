import { ensurePortableDirs } from "./paths.js";
import { getConfig } from "./config.js";
import { getDb } from "./db.js";
import { logger } from "./logger.js";
import { createApp } from "./app.js";
import { discoverAllEngines } from "./services/engineDiscovery.js";
import { startScheduler } from "./services/schedulerService.js";
import { pingAllClients } from "./sse.js";

async function main() {
  ensurePortableDirs();
  const config = getConfig();
  getDb(); // initialize DB

  const app = createApp();

  // Background ping for SSE keep-alive
  setInterval(pingAllClients, 30_000);

  // Discover engines at startup
  discoverAllEngines().catch((err) => logger.error("Engine discovery failed", { err: String(err) }));

  // Start scheduler
  startScheduler();

  const port = config.server.port;
  const host = config.server.host;

  try {
    await app.listen({ port, host });
    logger.info(`Server started on http://${host}:${port}`);
    logger.info(`API: http://${host}:${port}/api/v1`);
    logger.info(`Health: http://${host}:${port}/api/v1/health`);
    logger.info(`UI: http://${host}:${port}/`);
  } catch (err) {
    logger.error("Failed to start server", { err: String(err) });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
