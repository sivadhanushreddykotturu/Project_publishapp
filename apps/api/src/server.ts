import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startJobs } from "./jobs/cron.js";

async function main(): Promise<void> {
  await connectDb();
  startJobs();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "defineux-api listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "fatal boot error");
  process.exit(1);
});
