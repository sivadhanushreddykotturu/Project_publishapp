import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Role } from "@launchops/types";

export function roleHome(role?: string | null): string {
  if (role === "admin") return "/admin";
  if (role === "client") return "/client";
  if (role === "tester") return "/tester";
  return "/onboarding";
}

/**
 * Fresh role read from Clerk (not the session JWT, which can lag ~60s behind
 * an onboarding update). Used by role-area layouts and post-auth routing.
 */
export async function getFreshRole(): Promise<{
  userId: string;
  role: Role | null;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata as { role?: Role }).role ?? null;
  return { userId, role };
}
