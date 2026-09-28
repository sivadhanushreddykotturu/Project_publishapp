import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "./config/logger";
import { swaggerSpec } from "./docs/swagger";
import { clerkAuth, attachDbUser } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import apiRoutes from "./routes/index";
import paymentRoutes from "./routes/payment.routes";
import testingLinkRoutes from "./routes/testingLink.routes";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";

export function createApp() {
  const app = express();
  if (env.isProd) app.set("trust proxy", 1);

  app.use(helmet());
  const allowedOrigins = new Set([
    env.webBaseUrl.replace(/\/$/, ""),
    "https://uxos.in",
    "https://www.uxos.in",
    ...(env.isProd ? [] : ["http://localhost:3000", "http://localhost:3002"]),
  ]);
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use(pinoHttp({ logger }));

  app.use("/api/v1", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.isTest ? 10_000 : 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  app.use("/api/v1/users/sync", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.isTest ? 10_000 : 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  app.use("/t", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.isTest ? 10_000 : 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));

  // Mounted before express.json() — Razorpay webhook verification needs the raw
  // request body untouched (see routes/payment.routes.ts and services/payment.service.ts).
  app.use("/api/v1/payments", paymentRoutes);

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Public, unauthenticated tracked redirect — testers reach it straight from an email link.
  app.use("/t", testingLinkRoutes);

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.status(200).json(swaggerSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "LaunchOps API Docs" }));

  // clerkMiddleware() must run before any route that calls getAuth()/attachDbUser.
  app.use("/api/v1", clerkAuth, attachDbUser, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
