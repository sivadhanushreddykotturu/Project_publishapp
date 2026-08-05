import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import { ROLES, type Role } from "@launchops/types";

export interface IUser {
  clerkUserId: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}
export type UserDoc = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ROLES, required: true },
    name: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>("User", userSchema);
