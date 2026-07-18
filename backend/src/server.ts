import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { startScheduler, stopScheduler } from "./jobs/scheduler";

async function main() {
  await connectDb();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`LaunchOps API listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`Swagger docs: ${env.appBaseUrl}/api-docs`);
  });

  startScheduler();

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    stopScheduler();
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal error during startup");
  process.exit(1);
});
