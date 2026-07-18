import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../config/db";
import { logger } from "../config/logger";
import {
  User,
  Client,
  Tester,
  Project,
  Assignment,
  BugReport,
  WalletTransaction,
  Invoice,
  Notification,
  SupportTicket,
  MetricEvent,
  AuditLog,
} from "../models";

/**
 * One-time (or idempotent, re-runnable) schema setup: connects to the configured
 * MongoDB (Atlas in staging/prod, per Tech Spec §12 environment separation) and forces
 * every collection + its declared indexes to exist up front, rather than waiting for
 * Mongoose to lazily create them on first write. Safe to re-run — Model.init() is a
 * no-op for indexes that already exist.
 *
 * Usage: npm run db:init
 */
const MODELS = [
  User,
  Client,
  Tester,
  Project,
  Assignment,
  BugReport,
  WalletTransaction,
  Invoice,
  Notification,
  SupportTicket,
  MetricEvent,
  AuditLog,
];

async function main() {
  await connectDb();
  logger.info({ db: mongoose.connection.name }, "Connected — initializing collections and indexes");

  for (const model of MODELS) {
    await model.init();
    const indexes = await model.collection.indexes();
    logger.info({ collection: model.collection.collectionName, indexCount: indexes.length }, "Ready");
  }

  const collections = await mongoose.connection.db!.listCollections().toArray();
  logger.info(
    { collections: collections.map((c) => c.name).sort() },
    `${collections.length} collection(s) present in the database`
  );

  await disconnectDb();
}

main().catch((err) => {
  logger.error({ err }, "Schema initialization failed");
  process.exit(1);
});
