import type { Types } from "mongoose";
import { AuditLog } from "../models/index.js";
import { logger } from "../config/logger.js";

export interface AuditEntry {
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/** Immutable audit trail on verification, merges, ratings, and money moves. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    // audit failure must not break the business op, but it must be loud
    logger.error({ err, entry }, "audit write failed");
  }
}
