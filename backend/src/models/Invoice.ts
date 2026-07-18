import { Schema, model, Document, Types } from "mongoose";
import { PACKAGES, PackageTier, INVOICE_STATUSES, InvoiceStatus } from "./enums";

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  package: PackageTier;
  amount: number; // minor units (paise)
  gst: number;
  status: InvoiceStatus;
  gatewayRef?: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    package: { type: String, enum: PACKAGES, required: true },
    amount: { type: Number, required: true, min: 0 },
    gst: { type: Number, default: 0 },
    status: { type: String, enum: INVOICE_STATUSES, default: "pending", index: true },
    gatewayRef: { type: String },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);
