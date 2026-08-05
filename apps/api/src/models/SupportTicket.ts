import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { TICKET_STATUSES, type TicketStatus } from "@launchops/types";

export interface ISupportMessage {
  senderId: Types.ObjectId;
  isAdmin: boolean;
  body: string;
  at: Date;
}

export interface ISupportTicket {
  raisedBy: Types.ObjectId; // User
  projectId?: Types.ObjectId;
  subject: string;
  status: TicketStatus;
  messages: ISupportMessage[];
  assignedAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type SupportTicketDoc = HydratedDocument<ISupportTicket>;

const messageSchema = new Schema<ISupportMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAdmin: { type: Boolean, default: false },
    body: { type: String, required: true, maxlength: 5000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    subject: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: TICKET_STATUSES, default: "open", index: true },
    messages: [messageSchema],
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const SupportTicket: Model<ISupportTicket> =
  (mongoose.models.SupportTicket as Model<ISupportTicket>) ??
  mongoose.model<ISupportTicket>("SupportTicket", supportTicketSchema);
