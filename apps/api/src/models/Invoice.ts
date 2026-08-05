import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { INVOICE_STATUSES, type InvoiceStatus } from "@launchops/types";

export interface IInvoice {
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  packageKey: string;
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
  status: InvoiceStatus;
  gatewayRef?: string;
  dueDate: Date;
  paidAt?: Date;
  markedPaidBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type InvoiceDoc = HydratedDocument<IInvoice>;

const invoiceSchema = new Schema<IInvoice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    packageKey: { type: String, required: true },
    amountPaise: { type: Number, required: true, min: 0 },
    gstPaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
    status: { type: String, enum: INVOICE_STATUSES, default: "pending", index: true },
    gatewayRef: { type: String },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    markedPaidBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Invoice: Model<IInvoice> =
  (mongoose.models.Invoice as Model<IInvoice>) ??
  mongoose.model<IInvoice>("Invoice", invoiceSchema);
