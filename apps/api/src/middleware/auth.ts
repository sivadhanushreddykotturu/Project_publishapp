import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "@clerk/backend";
import type { Role } from "@defineux/types";
import { env } from "../config/env.js";
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
    const claims = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
    });
    const metadata = (claims as Record<string, unknown>).metadata as
      | { role?: Role }
      | undefined;
    return {
      clerkUserId: claims.sub,
      role: metadata?.role ?? null,
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
