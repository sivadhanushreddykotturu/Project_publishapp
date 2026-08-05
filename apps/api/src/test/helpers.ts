import type { Express } from "express";
import request from "supertest";
import type { Role } from "@launchops/types";
import { Client, Tester, User, type ClientDoc, type TesterDoc, type UserDoc } from "../models/index.js";

let counter = 0;
export function uniqueId(prefix = "user"): string {
  counter += 1;
  return `${prefix}_${counter}_${Date.now()}`;
}

/** supertest agent pre-authenticated via the test-only headers */
export function asRole(app: Express, clerkId: string, role: Role) {
  const agent = request(app);
  return {
    get: (url: string) => agent.get(url).set("x-test-clerk-id", clerkId).set("x-test-role", role),
    post: (url: string) => agent.post(url).set("x-test-clerk-id", clerkId).set("x-test-role", role),
    patch: (url: string) => agent.patch(url).set("x-test-clerk-id", clerkId).set("x-test-role", role),
  };
}

export async function makeUser(role: Role, clerkId = uniqueId("clerk")): Promise<UserDoc> {
  return User.create({
    clerkUserId: clerkId,
    role,
    name: `Test ${role}`,
    email: `${clerkId}@test.dev`,
  });
}

export async function makeTester(clerkId = uniqueId("clerk")): Promise<{ user: UserDoc; tester: TesterDoc }> {
  const user = await makeUser("tester", clerkId);
  const tester = await Tester.create({ userId: user._id });
  return { user, tester };
}

export async function makeClient(clerkId = uniqueId("clerk")): Promise<{ user: UserDoc; client: ClientDoc }> {
  const user = await makeUser("client", clerkId);
  const client = await Client.create({ userId: user._id, contactName: user.name });
  return { user, client };
}

export async function makeAdmin(clerkId = uniqueId("clerk")): Promise<UserDoc> {
  return makeUser("admin", clerkId);
}
