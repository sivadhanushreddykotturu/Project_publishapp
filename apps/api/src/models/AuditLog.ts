import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IAuditLog {
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  at: Date;
}
export type AuditLogDoc = HydratedDocument<IAuditLog>;

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

auditLogSchema.index({ entityType: 1, entityId: 1, at: -1 });

// immutable trail — no updates or deletes through Mongoose
auditLogSchema.pre("updateOne", () => {
  throw new Error("AuditLog is immutable");
});
auditLogSchema.pre("findOneAndUpdate", () => {
  throw new Error("AuditLog is immutable");
});
auditLogSchema.pre("deleteOne", () => {
  throw new Error("AuditLog is immutable");
});

export const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ??
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
