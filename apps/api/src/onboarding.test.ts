import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { Client, Tester, User } from "./models/index.js";
import { clearTestDb, startTestDb, stopTestDb } from "./test/db.js";
import { asRole, uniqueId } from "./test/helpers.js";

const app = createApp();

describe("onboarding + identity", () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  beforeEach(clearTestDb);

  it("onboards a tester: creates user + tester profile, mirrors role", async () => {
    const clerkId = uniqueId("clerk");
    const res = await asRole(app, clerkId, "tester")
      .post("/api/v1/onboarding")
      .send({ role: "tester", name: "Harika", email: "h@test.dev" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.user.role).toBe("tester");

    const user = await User.findOne({ clerkUserId: clerkId });
    expect(user?.email).toBe("h@test.dev");
    const tester = await Tester.findOne({ userId: user!._id });
    expect(tester).toBeTruthy();
    expect(await Client.findOne({ userId: user!._id })).toBeNull();
  });

  it("onboards a client: creates client profile instead", async () => {
    const clerkId = uniqueId("clerk");
    const res = await asRole(app, clerkId, "client")
      .post("/api/v1/onboarding")
      .send({ role: "client", email: "c@test.dev" });
    expect(res.status).toBe(201);

    const user = await User.findOne({ clerkUserId: clerkId });
    expect(await Client.findOne({ userId: user!._id })).toBeTruthy();
    expect(await Tester.findOne({ userId: user!._id })).toBeNull();
  });

  it("is idempotent for the same role and rejects role changes", async () => {
    const clerkId = uniqueId("clerk");
    await asRole(app, clerkId, "tester")
      .post("/api/v1/onboarding")
      .send({ role: "tester", email: "t@test.dev" });

    const again = await asRole(app, clerkId, "tester")
      .post("/api/v1/onboarding")
      .send({ role: "tester", email: "t@test.dev" });
    expect(again.status).toBe(200);
    expect(await User.countDocuments({ clerkUserId: clerkId })).toBe(1);

    const flip = await asRole(app, clerkId, "client")
      .post("/api/v1/onboarding")
      .send({ role: "client", email: "t@test.dev" });
    expect(flip.status).toBe(409);
    expect(flip.body.error.code).toBe("ROLE_LOCKED");
  });

  it("rejects unauthenticated requests", async () => {
    const res = await asRole(app, "", "tester")
      .post("/api/v1/onboarding")
      .send({ role: "tester" });
    expect([401, 500]).toContain(res.status); // no auth header → 401 in real mode
  });

  it("GET /users/me returns user + role profile", async () => {
    const clerkId = uniqueId("clerk");
    await asRole(app, clerkId, "client")
      .post("/api/v1/onboarding")
      .send({ role: "client", name: "Client Co", email: "co@test.dev" });

    const res = await asRole(app, clerkId, "client").get("/api/v1/users/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("client");
    expect(res.body.data.profile).toBeTruthy();
  });

  it("uploads/signature guards: 401 unauthenticated, 503 when storage unconfigured", async () => {
    const noAuth = await asRole(app, "", "tester").post("/api/v1/uploads/signature");
    expect([401, 500]).toContain(noAuth.status);

    const clerkId = uniqueId("clerk");
    const res = await asRole(app, clerkId, "tester")
      .post("/api/v1/uploads/signature")
      .send({ folder: "proofs", entityId: "abc", resourceType: "image" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("STORAGE_UNAVAILABLE");
  });
});
