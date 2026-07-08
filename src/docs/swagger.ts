import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { env } from "../config/env";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "LaunchOps API",
      version: "1.0.0",
      description:
        "LaunchOps Phase 1 MVP backend — the operating system for Play Store launch testing. " +
        "Covers client onboarding & payment, tester matching & queueing, the step-based " +
        "workflow engine, Google Play integration, bug reporting, tester wallet & UPI payouts, " +
        "and the admin console that replaces WhatsApp, Sheets, and manual reporting.",
    },
    servers: [
      { url: `${env.appBaseUrl}/api/v1`, description: env.nodeEnv },
    ],
    tags: [
      { name: "Users", description: "Clerk-linked identity + role provisioning" },
      { name: "Clients", description: "Client accounts, billing, communication history" },
      { name: "Testers", description: "Tester profiles, devices, UPI, status" },
      { name: "Projects", description: "Project lifecycle, joining, Play Console handoff" },
      { name: "Assignments", description: "Tester ↔ project lifecycle, proofs, verification" },
      { name: "Bug Reports", description: "Structured QA submissions, dedup, publishing" },
      { name: "Wallet", description: "Tester earnings ledger and UPI withdrawals" },
      { name: "Invoices", description: "Client billing, checkout, payment webhook" },
      { name: "Notifications", description: "Dispatch log for reminders and alerts" },
      { name: "Support", description: "In-platform support ticket threads" },
      { name: "Metrics", description: "PRD success-metric instrumentation" },
      { name: "Uploads", description: "Presigned R2 file upload/download URLs" },
      { name: "Testing Links", description: "Per-tester tracked redirects to Google Play" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Clerk session JWT — send as `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Resolved relative to this file's own directory (not process.cwd()) so JSDoc
  // discovery works identically under ts-node-dev (src/*.ts) and the compiled
  // dist build (dist/*.js — comments survive tsc since removeComments is false).
  // swagger-jsdoc's glob matcher requires forward slashes even on Windows, so
  // path.join's backslashes must be normalized or every path silently matches zero files.
  apis: [
    path.join(__dirname, "../routes/*.ts").split(path.sep).join("/"),
    path.join(__dirname, "../routes/*.js").split(path.sep).join("/"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
