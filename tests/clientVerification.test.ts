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
import { Project } from "../src/models/Project";
import { Invoice } from "../src/models/Invoice";

const app = createApp();

async function signUpClient(clerkId: string) {
  await request(app)
    .post("/api/v1/users/sync")
    .set("x-test-user", clerkId)
    .send({ role: "client", name: "Founder", email: `${clerkId}@test.com` });
}

async function signUpAdmin() {
  await User.create({ clerkUserId: "clerk_admin", role: "admin", name: "Admin", email: "admin@test.com" });
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

describe("client package verification gate", () => {
  it("testers_only stays self-serve: invoice created immediately, no verification required", async () => {
    await signUpClient("clerk_c1");

    const res = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c1")
      .send({ package: "testers_only", appDetails: { appName: "App One" } });

    expect(res.status).toBe(201);
    expect(res.body.data.invoice).not.toBeNull();
    expect(res.body.data.project.status).toBe("awaiting_payment");
    expect(res.body.data.project.verification.required).toBe(false);
  });

  it("managed_testing blocks payment: no invoice, status pending_verification", async () => {
    await signUpClient("clerk_c2");

    const res = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c2")
      .send({ package: "managed_testing", appDetails: { appName: "App Two" } });

    expect(res.status).toBe(201);
    expect(res.body.data.invoice).toBeNull();
    expect(res.body.data.project.status).toBe("pending_verification");
    expect(res.body.data.project.verification.required).toBe(true);
    expect(res.body.data.project.verification.status).toBe("pending");

    const invoiceCount = await Invoice.countDocuments({ projectId: res.body.data.project._id });
    expect(invoiceCount).toBe(0);
  });

  it("client submits proof, admin approves, and an invoice unlocks payment", async () => {
    await signUpClient("clerk_c3");
    await signUpAdmin();

    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c3")
      .send({ package: "launch_ready", appDetails: { appName: "App Three" } });
    const projectId = createRes.body.data.project._id;

    const submitRes = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/submit`)
      .set("x-test-user", "clerk_c3")
      .send({ proofUrl: "proofs/play-console-screenshot.png" });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.verification.status).toBe("submitted");

    const reviewRes = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/review`)
      .set("x-test-user", "clerk_admin")
      .send({ approve: true });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.invoice).not.toBeNull();

    const refreshed = await Project.findById(projectId);
    expect(refreshed!.status).toBe("awaiting_payment");
    expect(refreshed!.verification.status).toBe("verified");
  });

  it("rejects verification and leaves the project resubmittable", async () => {
    await signUpClient("clerk_c4");
    await signUpAdmin();

    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c4")
      .send({ package: "managed_testing", appDetails: { appName: "App Four" } });
    const projectId = createRes.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/verification/submit`)
      .set("x-test-user", "clerk_c4")
      .send({ proofUrl: "proofs/unclear.png" });

    const rejectRes = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/review`)
      .set("x-test-user", "clerk_admin")
      .send({ approve: false, note: "Screenshot doesn't show ownership — please resend" });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.invoice).toBeNull();

    const refreshed = await Project.findById(projectId);
    expect(refreshed!.status).toBe("pending_verification");
    expect(refreshed!.verification.status).toBe("rejected");

    const resubmitRes = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/submit`)
      .set("x-test-user", "clerk_c4")
      .send({ proofUrl: "proofs/clearer.png" });
    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.data.verification.status).toBe("submitted");
  });

  it("requires customAmount to approve a custom package (no fixed pricing)", async () => {
    await signUpClient("clerk_c5");
    await signUpAdmin();

    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c5")
      .send({ package: "custom", appDetails: { appName: "App Five" } });
    const projectId = createRes.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/verification/submit`)
      .set("x-test-user", "clerk_c5")
      .send({ proofUrl: "proofs/x.png" });

    const missingAmountRes = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/review`)
      .set("x-test-user", "clerk_admin")
      .send({ approve: true });
    expect(missingAmountRes.status).toBe(400);

    const withAmountRes = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/review`)
      .set("x-test-user", "clerk_admin")
      .send({ approve: true, customAmount: 7500000 });
    expect(withAmountRes.status).toBe(200);
    expect(withAmountRes.body.data.invoice.amount).toBe(7500000);
  });

  it("blocks a client from submitting verification proof for someone else's project", async () => {
    await signUpClient("clerk_c6");
    await signUpClient("clerk_c7");

    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("x-test-user", "clerk_c6")
      .send({ package: "managed_testing", appDetails: { appName: "App Six" } });
    const projectId = createRes.body.data.project._id;

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/verification/submit`)
      .set("x-test-user", "clerk_c7")
      .send({ proofUrl: "proofs/x.png" });

    expect(res.status).toBe(403);
  });
});
