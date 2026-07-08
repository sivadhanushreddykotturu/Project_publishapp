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

// Loads the LaunchOps User document that mirrors the authenticated Clerk identity
// (users.clerkUserId, per Tech Spec §4) and attaches it as req.dbUser.
export const attachDbUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (userId) {
    req.dbUser = (await User.findOne({ clerkUserId: userId })) ?? undefined;
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
