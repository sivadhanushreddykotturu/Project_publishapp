import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { METRIC_TYPES, type MetricType } from "@defineux/types";

export interface IMetricEvent {
  type: MetricType;
  projectId?: Types.ObjectId;
  actorId?: Types.ObjectId;
  meta: Record<string, unknown>;
  at: Date;
}
export type MetricEventDoc = HydratedDocument<IMetricEvent>;

const metricEventSchema = new Schema<IMetricEvent>(
  {
    type: { type: String, enum: METRIC_TYPES, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    meta: { type: Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

metricEventSchema.index({ type: 1, at: -1 });
metricEventSchema.index({ projectId: 1, type: 1, at: -1 });

export const MetricEvent: Model<IMetricEvent> =
  (mongoose.models.MetricEvent as Model<IMetricEvent>) ??
  mongoose.model<IMetricEvent>("MetricEvent", metricEventSchema);
