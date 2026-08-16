import { createClerkClient, type ClerkClient } from "@clerk/backend";
import type { Role } from "@defineux/types";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let cached: ClerkClient | null = null;

export function getClerk(): ClerkClient | null {
  if (!env.clerkConfigured) return null;
  cached ??= createClerkClient({ secretKey: env.CLERK_SECRET_KEY! });
  return cached;
}

export interface ClerkIdentity {
  email: string;
  name: string;
}

/**
 * Identity (email/name) is always resolved from Clerk server-side — never
 * trusted from the request body. Returns null when Clerk isn't configured
 * (local dev / tests), letting callers fall back to body values.
 */
export async function resolveIdentity(
  clerkUserId: string,
): Promise<ClerkIdentity | null> {
  const clerk = getClerk();
  if (!clerk) return null;
  const user = await clerk.users.getUser(clerkUserId);
  const primary = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  );
  return {
    email: primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
  };
}

/** Role assignment goes through Clerk publicMetadata — the JWT source of truth. */
export async function setClerkRole(
  clerkUserId: string,
  role: Role,
): Promise<void> {
  const clerk = getClerk();
  if (!clerk) {
    logger.warn({ clerkUserId, role }, "clerk not configured — skipping role sync");
    return;
  }
  await clerk.users.updateUser(clerkUserId, { publicMetadata: { role } });
}
