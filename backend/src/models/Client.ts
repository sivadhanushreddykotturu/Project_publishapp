import { Schema, model, Document, Types } from "mongoose";
import { PACKAGES, PackageTier } from "./enums";

export interface IClientCommunication {
  channel: "email" | "support_ticket" | "manual_note";
  subject?: string;
  body: string;
  createdAt: Date;
  createdBy?: Types.ObjectId;
}

export interface IClient extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  companyName?: string;
  contactName: string;
  billingInfo: {
    gstin?: string;
    billingAddress?: string;
  };
  activePackage?: PackageTier;
  projects: Types.ObjectId[];
  communications: IClientCommunication[];
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<IClientCommunication>(
  {
    channel: { type: String, enum: ["email", "support_ticket", "manual_note"], required: true },
    subject: { type: String },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const clientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    companyName: { type: String, trim: true },
    contactName: { type: String, required: true, trim: true },
    billingInfo: {
      gstin: { type: String, trim: true },
      billingAddress: { type: String, trim: true },
    },
    activePackage: { type: String, enum: PACKAGES },
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    communications: [communicationSchema],
  },
  { timestamps: true }
);

export const Client = model<IClient>("Client", clientSchema);
