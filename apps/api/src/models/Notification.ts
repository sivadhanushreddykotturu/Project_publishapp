import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  type NotificationChannel,
  type NotificationStatus,
  type NotificationType,
} from "@launchops/types";

export interface INotification {
  recipientId: Types.ObjectId; // User
  type: NotificationType;
  channel: NotificationChannel;
  payload: { title: string; body: string; link?: string };
  status: NotificationStatus;
  /** type + recipient + related id + date-bucket — reminder idempotency */
  idempotencyKey?: string;
  attempts: number;
  lastError?: string;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type NotificationDoc = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
    payload: {
      title: { type: String, required: true },
      body: { type: String, required: true },
      link: { type: String },
    },
    status: { type: String, enum: NOTIFICATION_STATUSES, default: "queued", index: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    readAt: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ status: 1, attempts: 1 });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ??
  mongoose.model<INotification>("Notification", notificationSchema);
