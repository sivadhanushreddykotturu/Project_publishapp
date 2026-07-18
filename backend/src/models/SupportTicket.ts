import { Schema, model, Document, Types } from "mongoose";
import { SUPPORT_TICKET_STATUSES, SupportTicketStatus } from "./enums";

export interface ISupportMessage {
  authorId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  raisedBy: Types.ObjectId;
  projectId?: Types.ObjectId;
  subject: string;
  status: SupportTicketStatus;
  messages: ISupportMessage[];
  assignedAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    subject: { type: String, required: true, trim: true },
    status: { type: String, enum: SUPPORT_TICKET_STATUSES, default: "open", index: true },
    messages: { type: [supportMessageSchema], default: [] },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);
