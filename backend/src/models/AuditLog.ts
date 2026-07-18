import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  at: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  at: { type: Date, default: Date.now },
});

// Immutable trail — no update/delete routes are ever exposed for this collection.
export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
