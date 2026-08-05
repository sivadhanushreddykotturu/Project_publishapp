import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { usersRouter } from "./routes/users.js";
import { uploadsRouter } from "./routes/uploads.js";
import { adminRouter } from "./routes/admin.js";
import { projectsRouter } from "./routes/projects.js";
import { invoicesRouter } from "./routes/invoices.js";
import { testersRouter } from "./routes/testers.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { verificationRouter } from "./routes/verification.js";
import { bugsRouter } from "./routes/bugs.js";
import { walletRouter } from "./routes/wallet.js";
import { supportRouter } from "./routes/support.js";
import { notificationsRouter } from "./routes/notifications.js";
import { redirectRouter } from "./routes/redirect.js";

export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // allow server-to-server (no origin) and allow-listed web origins only
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("CORS: origin not allowed"));
      },
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger, autoLogging: !env.isTest }));

  // capture raw body for webhook signature verification
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );

  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: () => env.isTest,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "launchops-api", env: env.NODE_ENV });
  });

  // --- routers ---
  app.use(
    "/api/v1/webhooks",
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: () => env.isTest,
    }),
    webhooksRouter,
  );
  app.use(
    "/api/v1/onboarding",
    rateLimit({
      windowMs: 60_000,
      limit: 20,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: () => env.isTest,
    }),
    onboardingRouter,
  );
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/uploads", uploadsRouter);
  app.use("/api/v1/projects", projectsRouter);
  app.use("/api/v1/invoices", invoicesRouter);
  app.use("/api/v1/testers", testersRouter);
  app.use("/api/v1/assignments", assignmentsRouter);
  app.use("/api/v1/verification", verificationRouter);
  app.use("/api/v1", bugsRouter);
  app.use("/api/v1/wallet", walletRouter);
  app.use("/api/v1/support-tickets", supportRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/t", redirectRouter); // public per-tester testing links

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
