import { Schema, model, Document, Types } from "mongoose";
import { METRIC_EVENT_TYPES, MetricEventType } from "./enums";

export interface IMetricEvent extends Document {
  _id: Types.ObjectId;
  type: MetricEventType;
  projectId?: Types.ObjectId;
  at: Date;
  meta: Record<string, unknown>;
}

const metricEventSchema = new Schema<IMetricEvent>({
  type: { type: String, enum: METRIC_EVENT_TYPES, required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
  at: { type: Date, default: Date.now, index: true },
  meta: { type: Schema.Types.Mixed, default: {} },
});

metricEventSchema.index({ type: 1, at: 1 });

export const MetricEvent = model<IMetricEvent>("MetricEvent", metricEventSchema);
