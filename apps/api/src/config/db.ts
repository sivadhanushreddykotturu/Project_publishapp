import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDb(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri ?? env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not configured");
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(mongoUri);
  logger.info({ host: conn.connection.host }, "mongodb connected");
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
