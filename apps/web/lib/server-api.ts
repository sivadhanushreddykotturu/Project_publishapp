import { auth } from "@clerk/nextjs/server";
import { api } from "./api";

/** Server-side API call with the current Clerk session token. */
export async function serverApi<T>(
  path: string,
  opts: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {},
): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();
  return api<T>(path, { ...opts, token });
}

export interface MeResponse {
  user: {
    _id: string;
    clerkUserId: string;
    role: "client" | "tester" | "admin";
    name: string;
    email: string;
    status: string;
  };
  profile: Record<string, unknown> | null;
}
