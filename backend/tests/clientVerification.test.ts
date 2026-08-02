import request from "supertest";

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
import { Tester } from "../src/models/Tester";
import { Notification } from "../src/models/Notification";
import { Invoice } from "../src/models/Invoice";

const app = createApp();

async function signUpClient(clerkId: string) {
  await request(app)
    .post("/api/v1/users/sync")
    .set("x-test-user", clerkId)
    .send({ role: "client", name: "Founder", email: `${clerkId}@test.com` });
}

async function makeTester(tag: string, model: string, status: "active" | "inactive" = "active") {
  const user = await User.create({ clerkUserId: `clerk_${tag}`, role: "tester", name: tag, email: `${tag}@test.com` });
  await Tester.create({
    userId: user._id,
    status,
    devices: [{ model, androidVersion: "14", fingerprint: `fp-${tag}` }],
  });
  return user;
}

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await disconnectTestDb();
});
afterEach(async () => {
  await clearCollections();
});

describe("externally managed commercial flow", () => {
  it("publishes a client submission immediately without verification or an invoice", async () => {
    await signUpClient("clerk_c1");

    const res = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c1")
      .send({ package: "managed_testing", appDetails: { appName: "App One" } });

    expect(res.status).toBe(201);
    expect(res.body.data.invoice).toBeNull();
    expect(res.body.data.project.status).toBe("active");
    expect(res.body.data.project.joinState).toBe("open");
    expect(res.body.data.project.requiredTesters).toBe(14);
    expect(res.body.data.project.verification).toMatchObject({ required: false, status: "not_required" });
    expect(await Invoice.countDocuments()).toBe(0);
  });

  it("notifies every active tester when no device requirement is supplied", async () => {
    await signUpClient("clerk_c2");
    const first = await makeTester("first", "Pixel 8");
    const second = await makeTester("second", "Galaxy S24");
    await makeTester("inactive", "Pixel 8", "inactive");

    await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c2")
      .send({ package: "testers_only", appDetails: { appName: "App Two" } });

    const notifications = await Notification.find({ type: "project_opportunity" });
    expect(notifications).toHaveLength(2);
    expect(notifications.map((item) => item.recipientId.toString()).sort()).toEqual(
      [first._id.toString(), second._id.toString()].sort()
    );
  });

  it("only notifies active testers whose device matches an optional requirement", async () => {
    await signUpClient("clerk_c3");
    const matching = await makeTester("matching", "Pixel 8");
    await makeTester("other", "Galaxy S24");

    await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c3")
      .send({
        package: "launch_ready",
        requiredDeviceModels: ["Pixel 8"],
        appDetails: { appName: "App Three" },
      });

    const notifications = await Notification.find({ type: "project_opportunity" });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].recipientId.toString()).toBe(matching._id.toString());

    const visibleToOtherTester = await request(app)
      .get("/api/v1/projects/opportunities")
      .set("x-test-user", "clerk_other");
    expect(visibleToOtherTester.status).toBe(200);
    expect(visibleToOtherTester.body.data).toHaveLength(1);
  });

  it("only lets the recipient mark a notification as read", async () => {
    await signUpClient("clerk_owner");
    await signUpClient("clerk_other_client");
    const owner = await User.findOne({ clerkUserId: "clerk_owner" });
    const notification = await Notification.create({
      recipientId: owner!._id,
      type: "project_request",
      channel: "email",
      payload: { appName: "Read Test" },
      status: "sent",
      idempotencyKey: "read-test",
    });

    const forbidden = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set("x-test-user", "clerk_other_client");
    expect(forbidden.status).toBe(404);

    const marked = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set("x-test-user", "clerk_owner");
    expect(marked.status).toBe(200);
    expect(marked.body.data.readAt).toBeTruthy();
  });
});
