import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "@clerk/backend";
import type { Role } from "@defineux/types";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User, Client, Tester } from "../models/index.js";
import { resolveIdentity, setClerkRole } from "../services/clerk.js";
import { unauthorized, forbidden } from "../utils/errors.js";
import { ah } from "../utils/asyncHandler.js";

export interface AuthContext {
  clerkUserId: string;
  role: Role | null;
  sessionId: string | null;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

async function resolveAuth(req: Request): Promise<AuthContext> {
  // Test-only escape hatch — never active outside NODE_ENV=test.
  if (env.isTest) {
    const testId = req.header("x-test-clerk-id");
    if (testId) {
      return {
        clerkUserId: testId,
        role: (req.header("x-test-role") as Role) ?? null,
        sessionId: "test-session",
      };
    }
  }

  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized();
  if (!env.clerkConfigured) throw unauthorized("Auth not configured");

  const token = header.slice("Bearer ".length);
  try {
    const claims = (await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
    })) as Record<string, unknown>;

    const clerkUserId = claims.sub as string;
    const metadata = (claims.metadata || claims.public_metadata || claims.publicMetadata) as
      | { role?: Role }
      | undefined;
    let role: Role | null = metadata?.role ?? null;

    if (clerkUserId) {
      let dbUser = await User.findOne({ clerkUserId });

      if (!dbUser) {
        try {
          const identity = await resolveIdentity(clerkUserId).catch(() => null);
          const email = identity?.email || `user_${clerkUserId}@placeholder.local`;
          const name = identity?.name || email.split("@")[0] || "User";

          const existingUser = await User.findOne({ email });
          if (existingUser) {
            existingUser.clerkUserId = clerkUserId;
            if (!existingUser.role) existingUser.role = "tester";
            await existingUser.save();
            dbUser = existingUser;
          } else {
            const url = req.originalUrl || req.url || "";
            const defaultRole: Role =
              metadata?.role ||
              (url.includes("/admin") ? "admin" : url.includes("/client") ? "client" : "tester");

            dbUser = await User.create({
              clerkUserId,
              email,
              name,
              role: defaultRole,
            });

            if (defaultRole === "client") {
              await Client.create({ userId: dbUser._id, contactName: name });
            } else if (defaultRole === "tester") {
              await Tester.create({ userId: dbUser._id });
            }
            await setClerkRole(clerkUserId, defaultRole).catch(() => {});
          }
        } catch (err) {
          logger.warn({ err, clerkUserId }, "Auto-provisioning user failed in resolveAuth");
        }
      }

      if (dbUser) {
        // If role was changed in Clerk Dashboard (e.g. to "admin"), automatically sync to MongoDB
        if (metadata?.role && dbUser.role !== metadata.role) {
          logger.info(
            { clerkUserId, oldRole: dbUser.role, newRole: metadata.role },
            "Syncing role from Clerk metadata to MongoDB User",
          );
          dbUser.role = metadata.role;
          await dbUser.save();
          role = metadata.role;

          // Ensure corresponding profile exists if switched to client or tester
          if (metadata.role === "client") {
            const clientExists = await Client.findOne({ userId: dbUser._id });
            if (!clientExists) {
              await Client.create({ userId: dbUser._id, contactName: dbUser.name });
            }
          } else if (metadata.role === "tester") {
            const testerExists = await Tester.findOne({ userId: dbUser._id });
            if (!testerExists) {
              await Tester.create({ userId: dbUser._id });
            }
          }
        } else if (dbUser.role) {
          role = dbUser.role as Role;
          if (!metadata?.role) {
            await setClerkRole(clerkUserId, role).catch(() => {});
          }
        }
      }
    }

    return {
      clerkUserId,
      role,
      sessionId: (claims.sid as string) ?? null,
    };
  } catch {
    throw unauthorized("Invalid or expired session");
  }
}

/** Verifies the Clerk session JWT on every request. Attaches req.auth. */
export const requireAuth = ah(async (req, _res, next) => {
  req.auth = await resolveAuth(req);
  next();
});

/** RBAC — server-side, per route. Ownership filters live in the queries. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role || !roles.includes(role)) {
      next(forbidden(`Requires role: ${roles.join(" | ")}`));
      return;
    }
    next();
  };
}

/** Helper for controllers: guaranteed auth context. */
export function auth(req: Request): AuthContext {
  if (!req.auth) throw unauthorized();
  return req.auth;
}
