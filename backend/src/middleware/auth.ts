import { clerkMiddleware, getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { Role } from "../models/enums";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// Verifies the Clerk session JWT (cookie or Authorization: Bearer) on every request
// and attaches `req.auth` when present. Never blocks unauthenticated requests itself —
// route-level guards (requireAuth / requireRole) do that.
export const clerkAuth = clerkMiddleware();

import { clerkClient } from "@clerk/express";
import { Client } from "../models/Client";
import { Tester } from "../models/Tester";

// Loads the LaunchOps User document that mirrors the authenticated Clerk identity
// and attaches it as req.dbUser. Auto-provisions if missing.
export const attachDbUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (userId) {
    let dbUser = await User.findOne({ clerkUserId: userId });
    if (!dbUser) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
          || clerkUser.emailAddresses[0]?.emailAddress
          || `user_${userId}@placeholder.local`;
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0] || "User";

        let existingUser = await User.findOne({ email });
        if (existingUser) {
          existingUser.clerkUserId = userId;
          await existingUser.save();
          dbUser = existingUser;
        } else {
          const url = req.originalUrl || req.url || "";
          const role: Role = url.includes("/admin") ? "admin" : url.includes("/client") ? "client" : "tester";
          dbUser = await User.create({
            clerkUserId: userId,
            email,
            name,
            role,
          });

          if (role === "client") {
            await Client.create({ userId: dbUser._id, companyName: name });
          } else if (role === "tester") {
            await Tester.create({ userId: dbUser._id });
          }
        }
      } catch (err) {
        console.warn("Auto-provisioning user failed in attachDbUser:", err);
      }
    }
    req.dbUser = dbUser ?? undefined;
  }
  next();
});

// RBAC layer 1: route guard. Enforced again at the query level (ownership filters)
// per resource, per Tech Spec §3 ("RBAC enforced twice").
export function requireAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.dbUser) throw ApiError.unauthorized();
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.dbUser) throw ApiError.unauthorized();
    if (!roles.includes(req.dbUser.role)) {
      throw ApiError.forbidden(`Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}
