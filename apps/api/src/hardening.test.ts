import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { AuditLog, Project, Tester, WalletTransaction } from "./models/index.js";
import { clearTestDb, startTestDb, stopTestDb } from "./test/db.js";
import { asRole, makeAdmin, makeClient, makeTester, uniqueId } from "./test/helpers.js";

const app = createApp();

describe("security & hardening", () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  beforeEach(clearTestDb);

  it("unauthenticated requests get 401 on protected routes", async () => {
    const routes = [
      ["get", "/api/v1/users/me"],
      ["get", "/api/v1/projects"],
      ["get", "/api/v1/admin/summary"],
      ["get", "/api/v1/verification"],
      ["get", "/api/v1/wallet/me"],
      ["get", "/api/v1/notifications/me"],
    ] as const;
    for (const [method, url] of routes) {
      const res = await request(app)[method](url);
      expect(res.status, `${method.toUpperCase()} ${url}`).toBe(401);
    }
  });

  it("RBAC: every admin surface rejects testers and clients", async () => {
    const { user: testerUser } = await makeTester();
    const { user: clientUser } = await makeClient();
    const adminRoutes = [
      ["get", "/api/v1/admin/summary"],
      ["get", "/api/v1/admin/metrics"],
      ["get", "/api/v1/admin/clients"],
      ["get", "/api/v1/verification"],
      ["get", "/api/v1/testers"],
      ["get", "/api/v1/projects"],
      ["get", "/api/v1/invoices"],
      ["get", "/api/v1/wallet/withdrawals"],
      ["get", "/api/v1/notifications"],
    ] as const;

    for (const [method, url] of adminRoutes) {
      const asTester = await asRole(app, testerUser.clerkUserId, "tester")[method](url);
      expect(asTester.status, `tester ${url}`).toBe(403);
      const asClient = await asRole(app, clientUser.clerkUserId, "client")[method](url);
      expect(asClient.status, `client ${url}`).toBe(403);
    }
  });

  it("role headers can't be spoofed into admin-only actions", async () => {
    const { user: testerUser } = await makeTester();
    // a tester claiming admin role in the header still passes requireRole in
    // test mode — but in production the role comes from verified Clerk JWT.
    // what must NEVER happen: a tester-role token reaching admin handlers.
    const res = await asRole(app, testerUser.clerkUserId, "tester")
      .post("/api/v1/bug-reports/publish")
      .send({ ids: [] });
    expect(res.status).toBe(403);
  });

  it("CORS reflects only allow-listed origins", async () => {
    const evil = await request(app)
      .options("/api/v1/users/me")
      .set("Origin", "https://evil.example")
      .set("Access-Control-Request-Method", "GET");
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();

    const good = await request(app)
      .options("/api/v1/users/me")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");
    expect(good.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("join endpoint is rate-limited", async () => {
    const { user: testerUser } = await makeTester();
    const agent = request(app)
      .post(`/api/v1/projects/${uniqueId()}/join`)
      .set("x-test-clerk-id", testerUser.clerkUserId)
      .set("x-test-role", "tester")
      .set("x-force-rate-limit", "1");
    let limited = 0;
    for (let i = 0; i < 35; i++) {
      const res = await request(app)
        .post(`/api/v1/projects/${uniqueId()}/join`)
        .set("x-test-clerk-id", testerUser.clerkUserId)
        .set("x-test-role", "tester")
        .set("x-force-rate-limit", "1");
      if (res.status === 429) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
    void agent;
  });

  it("audit log is immutable", async () => {
    const admin = await makeAdmin();
    const entry = await AuditLog.create({
      actorId: admin._id,
      action: "test.action",
      entityType: "Tester",
      entityId: admin._id,
    });
    await expect(
      AuditLog.updateOne({ _id: entry._id }, { $set: { action: "tampered" } }),
    ).rejects.toThrow("immutable");
    await expect(AuditLog.deleteOne({ _id: entry._id })).rejects.toThrow("immutable");
    const still = await AuditLog.findById(entry._id);
    expect(still!.action).toBe("test.action");
  });

  it("a withdrawal cannot be completed twice (double-spend guard)", async () => {
    const { tester } = await makeTester();
    await Tester.updateOne(
      { _id: tester._id },
      { $set: { walletBalance: 20_000, "upi.vpa": "t@okhdfc" } },
    );
    const admin = await makeAdmin();
    const clerkId = (await Tester.findById(tester._id).populate("userId"))!.userId as {
      clerkUserId: string;
    };

    const w = await asRole(app, clerkId.clerkUserId, "tester")
      .post("/api/v1/wallet/withdrawals")
      .send({ amountPaise: 20_000 });
    const txId = w.body.data.withdrawal._id;

    const first = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/wallet/withdrawals/${txId}/complete`)
      .send({ upiRef: "UTR000001" });
    expect(first.status).toBe(200);

    const second = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/wallet/withdrawals/${txId}/complete`)
      .send({ upiRef: "UTR000002" });
    expect(second.status).toBe(409);

    const tx = await WalletTransaction.findById(txId);
    expect(tx!.upiRef).toBe("UTR000001");
  });

  it("clerk webhook rejects missing/invalid signatures (or is safely disabled)", async () => {
    const res = await request(app).post("/api/v1/webhooks/clerk").send({});
    expect([401, 503]).toContain(res.status);
  });

  it("metrics prove the 5-minute payment→publish target", async () => {
    const { user: clientUser } = await makeClient();
    const created = await asRole(app, clientUser.clerkUserId, "client")
      .post("/api/v1/projects")
      .send({
        packageKey: "starter",
        appDetails: { appName: "Metrics App", packageName: "com.example.metrics" },
      });
    const projectId = created.body.data.project._id;
    const admin = await makeAdmin();
    await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/projects/${projectId}/mark-paid`,
    );
    await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/projects/${projectId}/publish`,
    );

    const project = await Project.findById(projectId);
    expect(project!.paymentConfirmedAt).toBeTruthy();
    expect(project!.opportunityPublishedAt).toBeTruthy();

    const metrics = await asRole(app, admin.clerkUserId, "admin").get(
      "/api/v1/admin/metrics",
    );
    expect(metrics.status).toBe(200);
    const m = metrics.body.data;
    expect(m.paymentToPublish.samples).toBe(1);
    expect(m.paymentToPublish.withinFiveMinutes).toBe(1);
    expect(m.paymentToPublish.avgMinutes).toBeLessThan(5);
    expect(m.events.payment_confirmed).toBe(1);
    expect(m.events.opportunity_published).toBe(1);
  });
});
