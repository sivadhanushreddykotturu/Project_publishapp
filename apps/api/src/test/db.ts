import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet: MongoMemoryReplSet | null = null;

/** Single-node replica set — required for multi-document transactions. */
export async function startTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(replSet.getUri("launchops-test"));
}

export async function clearTestDb(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  for (const c of collections) await c.deleteMany({});
}

export async function stopTestDb(): Promise<void> {
  await mongoose.disconnect();
  await replSet?.stop();
  replSet = null;
}
