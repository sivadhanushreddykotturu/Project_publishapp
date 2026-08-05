import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Role } from "@launchops/types";

export function roleHome(role?: string | null): string {
  if (role === "admin") return "/admin";
  if (role === "client") return "/client";
  if (role === "tester") return "/tester";
  return "/onboarding";
}

export type FreshRole =
  | { userId: string; role: Role | null }
  | { error: true }
  | null;

/**
 * Fresh role read from Clerk (not the session JWT, which can lag ~60s behind
 * an onboarding update). Used by role-area layouts and post-auth routing.
 * Returns { error: true } instead of throwing so layouts can fail readable.
 */
export async function getFreshRole(): Promise<FreshRole> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: Role }).role ?? null;
    return { userId, role };
  } catch (error) {
    console.error(
      "getFreshRole failed — check CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY on this environment:",
      error,
    );
    return { error: true };
  }
}
