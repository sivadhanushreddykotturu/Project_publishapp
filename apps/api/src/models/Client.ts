import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IClient {
  userId: Types.ObjectId;
  companyName: string;
  contactName: string;
  billingInfo: { gstin?: string; billingAddress?: string };
  activePackage?: string;
  projects: Types.ObjectId[];
  /** communication history — support replies & admin notes land here */
  communications: Array<{
    type: "support" | "admin_note" | "email";
    subject: string;
    snippet: string;
    at: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
export type ClientDoc = HydratedDocument<IClient>;

const clientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, default: "" },
    contactName: { type: String, default: "" },
    billingInfo: {
      gstin: { type: String, uppercase: true, trim: true },
      billingAddress: { type: String },
    },
    activePackage: { type: String },
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    communications: [
      {
        type: { type: String, enum: ["support", "admin_note", "email"], required: true },
        subject: { type: String, required: true },
        snippet: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Client: Model<IClient> =
  (mongoose.models.Client as Model<IClient>) ??
  mongoose.model<IClient>("Client", clientSchema);
