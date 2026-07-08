import { Types } from "mongoose";
import { AuditLog } from "../models/AuditLog";

// Immutable audit trail for verification actions and wallet transitions (Tech Spec §3, §11).
// Call from services/controllers right after a mutation succeeds — never before, so a
// failed mutation never produces a misleading log entry.
export async function recordAudit(params: {
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}): Promise<void> {
  await AuditLog.create({
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    at: new Date(),
  });
}
