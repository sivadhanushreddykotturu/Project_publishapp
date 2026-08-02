import { Schema, model, Document, Types } from "mongoose";
import {
  NOTIFICATION_CHANNELS,
  NotificationChannel,
  NOTIFICATION_STATUSES,
  NotificationStatus,
  NOTIFICATION_TYPES,
  NotificationType,
} from "./enums";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  idempotencyKey: string;
  attempts: number;
  lastError?: string;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: NOTIFICATION_STATUSES, default: "queued", index: true },
    // type + recipient + related id + date-bucket, per Tech Spec §10 reminder idempotency rule.
    idempotencyKey: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    sentAt: { type: Date },
    readAt: { type: Date, index: true },
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);
