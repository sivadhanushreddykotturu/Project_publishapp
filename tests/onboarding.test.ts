import request from "supertest";

// Bypasses real Clerk JWT verification so we can drive the actual Express routes
// end-to-end in a test — the route/controller/model code below is 100% real,
// only the "is this request signed by Clerk" check is swapped out.
jest.mock("@clerk/express", () => ({
  clerkMiddleware:
    () =>
    (req: any, _res: any, next: any) => {
      const testUserId = req.headers["x-test-user"];
      if (testUserId) req.auth = () => ({ userId: testUserId });
      next();
    },
  getAuth: (req: any) => (typeof req.auth === "function" ? req.auth() : {}),
}));

import { createApp } from "../src/app";
import { connectTestDb, disconnectTestDb, clearCollections } from "./setup";
import { User } from "../src/models/User";
import { Client } from "../src/models/Client";
import { Tester } from "../src/models/Tester";

const app = createApp();

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await disconnectTestDb();
});
afterEach(async () => {
  await clearCollections();
});

describe("client & tester onboarding — real HTTP requests through the actual routes", () => {
  it("POST /users/sync with role=client creates a User and a Client profile", async () => {
    const res = await request(app)
      .post("/api/v1/users/sync")
      .set("x-test-user", "clerk_client_1")
      .send({ role: "client", name: "Priya Founder", email: "priya@startup.dev" });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("client");

    const user = await User.findOne({ clerkUserId: "clerk_client_1" });
    expect(user).not.toBeNull();
    const client = await Client.findOne({ userId: user!._id });
    expect(client).not.toBeNull();
    expect(client!.contactName).toBe("Priya Founder");
  });

  it("POST /users/sync with role=tester creates a User and a stub Tester profile", async () => {
    const res = await request(app)
      .post("/api/v1/users/sync")
      .set("x-test-user", "clerk_tester_1")
      .send({ role: "tester", name: "Ravi Tester", email: "ravi@gmail.com" });

    expect(res.status).toBe(200);
    const user = await User.findOne({ clerkUserId: "clerk_tester_1" });
    const tester = await Tester.findOne({ userId: user!._id });
    expect(tester).not.toBeNull();
    expect(tester!.status).toBe("active");
  });

  it("PUT /testers/me completes the tester profile (devices + UPI)", async () => {
    await request(app)
      .post("/api/v1/users/sync")
      .set("x-test-user", "clerk_tester_2")
      .send({ role: "tester", name: "Anita Tester", email: "anita@gmail.com" });

    const res = await request(app)
      .put("/api/v1/testers/me")
      .set("x-test-user", "clerk_tester_2")
      .send({
        devices: [{ model: "Pixel 7", androidVersion: "14", fingerprint: "fp-abc-123" }],
        experienceLevel: "intermediate",
        upi: { vpa: "anita@upi" },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.upi.vpa).toBe("anita@upi");
    expect(res.body.data.devices).toHaveLength(1);
  });

  it("rejects a second tester registering an already-claimed UPI VPA (fraud defense)", async () => {
    await request(app).post("/api/v1/users/sync").set("x-test-user", "clerk_tester_3").send({
      role: "tester",
      name: "Tester Three",
      email: "three@gmail.com",
    });
    await request(app)
      .put("/api/v1/testers/me")
      .set("x-test-user", "clerk_tester_3")
      .send({ devices: [{ model: "Pixel 6", androidVersion: "13", fingerprint: "fp-1" }], upi: { vpa: "shared@upi" } });

    await request(app).post("/api/v1/users/sync").set("x-test-user", "clerk_tester_4").send({
      role: "tester",
      name: "Tester Four",
      email: "four@gmail.com",
    });
    const res = await request(app)
      .put("/api/v1/testers/me")
      .set("x-test-user", "clerk_tester_4")
      .send({ devices: [{ model: "Pixel 8", androidVersion: "14", fingerprint: "fp-2" }], upi: { vpa: "shared@upi" } });

    expect(res.status).toBe(409);
  });

  it("blocks tester profile writes from an unauthenticated request", async () => {
    const res = await request(app).put("/api/v1/testers/me").send({ devices: [], upi: { vpa: "x@upi" } });
    expect(res.status).toBe(401);
  });
});
