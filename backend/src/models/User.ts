import { Schema, model, Document, Types } from "mongoose";
import { ROLES, Role } from "./enums";

export interface IUser extends Document {
  _id: Types.ObjectId;
  clerkUserId: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ROLES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
