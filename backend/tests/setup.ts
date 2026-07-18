import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet: MongoMemoryReplSet;

// A one-node replica set is required so wallet.service's Mongo transactions actually
// exercise the transaction path in tests, not just the standalone fallback.
export async function connectTestDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);
}

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await replSet.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
