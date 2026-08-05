import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PACKAGES } from "@launchops/types";
import { createApp } from "./app.js";
import { Invoice, MetricEvent, Project } from "./models/index.js";
import { clearTestDb, startTestDb, stopTestDb } from "./test/db.js";
import { asRole, makeAdmin, makeClient, makeTester, uniqueId } from "./test/helpers.js";

const app = createApp();

const APP_DETAILS = {
  appName: "Todo Master",
  packageName: "com.example.todomaster",
  description: "A todo app",
};

async function clientCreatesProject(clerkId: string, packageKey = "starter") {
  return asRole(app, clerkId, "client")
    .post("/api/v1/projects")
    .send({ packageKey, appDetails: APP_DETAILS });
}

describe("projects + payments + workflow activation", () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  beforeEach(clearTestDb);

  it("serves the public package catalog", async () => {
    const res = await asRole(app, "", "tester").get("/api/v1/projects/packages");
    expect(res.status).toBe(200);
    expect(res.body.data.packages.length).toBe(PACKAGES.length);
  });

  it("client creates a project → awaiting_payment + GST invoice", async () => {
    const { user: clientUser } = await makeClient();
    const res = await clientCreatesProject(clientUser.clerkUserId);
    expect(res.status).toBe(201);

    const { project, invoice } = res.body.data;
    expect(project.status).toBe("awaiting_payment");
    expect(project.joinState).toBe("closed");

    const pkg = PACKAGES.find((p) => p.key === "starter")!;
    expect(invoice.amountPaise).toBe(pkg.pricePaise);
    expect(invoice.gstPaise).toBe(Math.round(pkg.pricePaise * 0.18));
    expect(invoice.totalPaise).toBe(pkg.pricePaise + invoice.gstPaise);
    expect(invoice.status).toBe("pending");
  });

  it("rejects bad package names and unknown packages", async () => {
    const { user: clientUser } = await makeClient();
    const bad = await asRole(app, clientUser.clerkUserId, "client")
      .post("/api/v1/projects")
      .send({ packageKey: "starter", appDetails: { ...APP_DETAILS, packageName: "Not A Package" } });
    expect(bad.status).toBe(400);

    const unknown = await asRole(app, clientUser.clerkUserId, "client")
      .post("/api/v1/projects")
      .send({ packageKey: "platinum", appDetails: APP_DETAILS });
    expect(unknown.status).toBe(400);
  });

  it("RBAC: testers can't create projects, other clients can't read them", async () => {
    const { user: testerUser } = await makeTester();
    const asTester = await asRole(app, testerUser.clerkUserId, "tester")
      .post("/api/v1/projects")
      .send({ packageKey: "starter", appDetails: APP_DETAILS });
    expect(asTester.status).toBe(403);

    const { user: owner } = await makeClient();
    const created = await clientCreatesProject(owner.clerkUserId);
    const projectId = created.body.data.project._id;

    const { user: intruder } = await makeClient();
    const stolen = await asRole(app, intruder.clerkUserId, "client").get(
      `/api/v1/projects/${projectId}`,
    );
    expect(stolen.status).toBe(403);
  });

  it("admin mark-paid activates the project with the 5-step template cloned", async () => {
    const { user: owner } = await makeClient();
    const created = await clientCreatesProject(owner.clerkUserId, "growth");
    const projectId = created.body.data.project._id;
    const invoiceId = created.body.data.invoice._id;

    const admin = await makeAdmin();
    const res = await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/invoices/${invoiceId}/mark-paid`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.invoice.status).toBe("manual_paid");

    const project = await Project.findById(projectId);
    expect(project!.status).toBe("active");
    expect(project!.steps).toHaveLength(5);
    expect(project!.steps[0].state).toBe("active");
    expect(project!.steps[0].type).toBe("verification");
    expect(project!.steps.slice(1).every((s) => s.state === "locked")).toBe(true);
    expect(project!.requiredTesters).toBe(20); // growth package
    expect(project!.paymentConfirmedAt).toBeTruthy();

    const metric = await MetricEvent.findOne({ type: "payment_confirmed", projectId });
    expect(metric).toBeTruthy();
  });

  it("iOS projects activate with the TestFlight template", async () => {
    const { user: owner } = await makeClient();
    const created = await asRole(app, owner.clerkUserId, "client")
      .post("/api/v1/projects")
      .send({
        packageKey: "starter",
        projectType: "ios_testflight",
        appDetails: { appName: "iOS App", packageName: "com.example.iosapp" },
      });
    expect(created.status).toBe(201);
    expect(created.body.data.project.projectType).toBe("ios_testflight");

    const admin = await makeAdmin();
    await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/invoices/${created.body.data.invoice._id}/mark-paid`,
    );

    const project = await Project.findById(created.body.data.project._id);
    expect(project!.status).toBe("active");
    expect(project!.stepTemplateVersion).toBe("ios_testflight_v1");
    expect(project!.steps).toHaveLength(5);
    expect(project!.steps[0].type).toBe("verification");
    expect(project!.steps[1].type).toBe("testflight_invite");
    expect(project!.steps[0].config.instructions).toContain("Apple");

    // bad project type rejected
    const bad = await asRole(app, owner.clerkUserId, "client")
      .post("/api/v1/projects")
      .send({ packageKey: "starter", projectType: "windows_store", appDetails: APP_DETAILS });
    expect(bad.status).toBe(400);
  });

  it("mark-paid is idempotent — no double activation, no double steps", async () => {
    const { user: owner } = await makeClient();
    const created = await clientCreatesProject(owner.clerkUserId);
    const invoiceId = created.body.data.invoice._id;
    const admin = await makeAdmin();

    await asRole(app, admin.clerkUserId, "admin").post(`/api/v1/invoices/${invoiceId}/mark-paid`);
    const again = await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/invoices/${invoiceId}/mark-paid`,
    );
    expect(again.status).toBe(200);

    const project = await Project.findById(created.body.data.project._id);
    expect(project!.steps).toHaveLength(5);
    expect(
      await MetricEvent.countDocuments({
        type: "payment_confirmed",
        projectId: project!._id,
      }),
    ).toBe(1);
  });

  it("publish opportunity: opens join, stamps metrics, blocks until paid", async () => {
    const { user: owner } = await makeClient();
    const created = await clientCreatesProject(owner.clerkUserId);
    const projectId = created.body.data.project._id;
    const admin = await makeAdmin();

    // before payment → 409
    const early = await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/projects/${projectId}/publish`,
    );
    expect(early.status).toBe(409);

    // pay, then publish
    await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/projects/${projectId}/mark-paid`,
    );
    const pub = await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/projects/${projectId}/publish`,
    );
    expect(pub.status).toBe(200);
    expect(pub.body.data.project.joinState).toBe("open");

    const project = await Project.findById(projectId);
    expect(project!.opportunityPublishedAt).toBeTruthy();
    expect(
      await MetricEvent.countDocuments({ type: "opportunity_published", projectId }),
    ).toBe(1);

    // idempotent republish
    const again = await asRole(app, admin.clerkUserId, "admin").post(
      `/api/v1/projects/${projectId}/publish`,
    );
    expect(again.status).toBe(200);
  });

  it("clients see only their own projects and invoices", async () => {
    const { user: c1 } = await makeClient();
    const { user: c2 } = await makeClient();
    await clientCreatesProject(c1.clerkUserId);
    await clientCreatesProject(c2.clerkUserId, "scale");

    const mine = await asRole(app, c1.clerkUserId, "client").get("/api/v1/projects/me");
    expect(mine.status).toBe(200);
    expect(mine.body.data.projects).toHaveLength(1);
    expect(mine.body.data.projects[0].packageKey).toBe("starter");

    const invoices = await asRole(app, c1.clerkUserId, "client").get("/api/v1/invoices/me");
    expect(invoices.body.data.invoices).toHaveLength(1);

    // admin sees all
    const admin = await makeAdmin(uniqueId("clerk"));
    const all = await asRole(app, admin.clerkUserId, "admin").get("/api/v1/projects");
    expect(all.body.data.projects).toHaveLength(2);
  });
});
