import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { createApp } from "./app.js";
import {
  Assignment,
  Invoice,
  MetricEvent,
  Notification,
  Project,
  Tester,
  User,
} from "./models/index.js";
import { clearTestDb, startTestDb, stopTestDb } from "./test/db.js";
import { asRole, makeAdmin, makeClient, makeTester, uniqueId } from "./test/helpers.js";
import { runInactivitySweep } from "./jobs/cron.js";

const app = createApp();

const APP_DETAILS = {
  appName: "Race App",
  packageName: "com.example.race",
};

/** client creates project → admin marks paid → admin publishes */
async function activeProject(packageKey = "starter", projectType?: string) {
  const { user: clientUser } = await makeClient();
  const created = await asRole(app, clientUser.clerkUserId, "client")
    .post("/api/v1/projects")
    .send({ packageKey, projectType, appDetails: APP_DETAILS });
  const projectId: string = created.body.data.project._id;
  const invoiceId: string = created.body.data.invoice._id;

  const admin = await makeAdmin();
  await asRole(app, admin.clerkUserId, "admin").post(
    `/api/v1/invoices/${invoiceId}/mark-paid`,
  );
  await asRole(app, admin.clerkUserId, "admin").post(
    `/api/v1/projects/${projectId}/publish`,
  );
  return { projectId, admin, clientUser };
}

async function joinN(projectId: string, n: number) {
  const testers = await Promise.all(Array.from({ length: n }, () => makeTester()));
  const results = await Promise.all(
    testers.map((t) =>
      asRole(app, t.user.clerkUserId, "tester").post(`/api/v1/projects/${projectId}/join`),
    ),
  );
  return { testers, results };
}

describe("matching, queueing, verification & testing links", () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  beforeEach(clearTestDb);

  it("join cutoff is atomic: exactly 14 active, rest queued, cap enforced", async () => {
    const { projectId } = await activeProject("starter"); // 14 slots, cap 7
    const { results } = await joinN(projectId, 23);

    const statuses = results.map((r) => r.status);
    const created = results.filter((r) => r.status === 201);
    const full = results.filter((r) => r.status === 409);
    expect(created).toHaveLength(21); // 14 active + 7 queued
    expect(full).toHaveLength(2); // beyond waitlist cap

    const project = await Project.findById(projectId);
    expect(project!.activeTesterCount).toBe(14);
    expect(project!.waitlistCount).toBe(7);
    expect(project!.joinState).toBe("full");

    const active = await Assignment.countDocuments({ projectId, status: "active" });
    const queued = await Assignment.countDocuments({ projectId, status: "queued" });
    expect(active).toBe(14);
    expect(queued).toBe(7);

    // queue positions are unique and sequential
    const positions = (
      await Assignment.find({ projectId, status: "queued" }).lean()
    ).map((a) => a.queuePosition!);
    expect([...positions].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(statuses.filter((s) => s === 500)).toHaveLength(0);
  });

  it("rejoining is idempotent and opportunities show membership", async () => {
    const { projectId } = await activeProject();
    const { user: testerUser } = await makeTester();

    const first = await asRole(app, testerUser.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
    const second = await asRole(app, testerUser.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
    expect(first.body.data.assignment._id).toBe(second.body.data.assignment._id);
    expect(await Assignment.countDocuments({ projectId })).toBe(1);

    const opps = await asRole(app, testerUser.clerkUserId, "tester").get(
      "/api/v1/projects/opportunities",
    );
    expect(opps.body.data.opportunities[0].myAssignment.status).toBe("active");
  });

  it("platform gate: iOS project hidden from Android-only tester until they add an iOS device", async () => {
    const { projectId } = await activeProject("starter", "ios_testflight");
    const { user: testerUser, tester } = await makeTester(); // android-only by default

    // invisible in opportunities
    const hidden = await asRole(app, testerUser.clerkUserId, "tester").get(
      "/api/v1/projects/opportunities",
    );
    expect(
      hidden.body.data.opportunities.map((o: { _id: string }) => o._id),
    ).not.toContain(projectId);

    // direct join blocked with a readable error
    const blocked = await asRole(app, testerUser.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe("PLATFORM_MISMATCH");

    // tester registers an iOS device later → opportunity appears, join works
    await Tester.updateOne(
      { _id: tester._id },
      {
        $push: {
          devices: {
            platform: "ios",
            model: "iPhone 15",
            osVersion: "18",
            fingerprint: uniqueId("fp"),
          },
        },
      },
    );

    const visible = await asRole(app, testerUser.clerkUserId, "tester").get(
      "/api/v1/projects/opportunities",
    );
    expect(
      visible.body.data.opportunities.map((o: { _id: string }) => o._id),
    ).toContain(projectId);

    const joined = await asRole(app, testerUser.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
    expect(joined.status).toBe(201);
  });

  it("proof → verify advances the step and credits the wallet exactly once", async () => {
    const { projectId, admin } = await activeProject();
    const { user: testerUser, tester } = await makeTester();
    await asRole(app, testerUser.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
    const assignment = await Assignment.findOne({ projectId, testerId: tester._id });

    // submit step-1 proof
    const proof = await asRole(app, testerUser.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignment!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/proof1.png", fileHash: "hash-1" });
    expect(proof.status).toBe(201);

    // double submit blocked
    const dup = await asRole(app, testerUser.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignment!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/proof2.png", fileHash: "hash-2" });
    expect(dup.status).toBe(409);

    const fresh = await Assignment.findById(assignment!._id);
    const proofId = fresh!.proofs[0]._id;

    // admin approves
    const review = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/verification/${assignment!._id}/proofs/${proofId}/review`)
      .send({ approve: true });
    expect(review.status).toBe(200);

    const after = await Assignment.findById(assignment!._id);
    expect(after!.currentStep).toBe(2);
    expect(after!.proofs[0].status).toBe("verified");

    const credited = await Tester.findById(tester._id);
    expect(credited!.walletBalance).toBe(3_000); // step-1 payout

    // review again → 409, no double credit
    const again = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/verification/${assignment!._id}/proofs/${proofId}/review`)
      .send({ approve: true });
    expect(again.status).toBe(409);
    const still = await Tester.findById(tester._id);
    expect(still!.walletBalance).toBe(3_000);

    // step-2 submission blocked until links distributed (project gate)
    const early = await asRole(app, testerUser.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignment!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/install.png", fileHash: "h3" });
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe("STEP_LOCKED");
  });

  it("reject reopens the step for resubmission with a reason", async () => {
    const { projectId, admin } = await activeProject();
    const { user: testerUser, tester } = await makeTester();
    await asRole(app, testerUser.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
    const assignment = await Assignment.findOne({ projectId, testerId: tester._id });
    await asRole(app, testerUser.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignment!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/blurry.png", fileHash: "h1" });

    let fresh = await Assignment.findById(assignment!._id);
    const review = await asRole(app, admin.clerkUserId, "admin")
      .post(
        `/api/v1/verification/${assignment!._id}/proofs/${fresh!.proofs[0]._id}/review`,
      )
      .send({ approve: false, reason: "Screenshot too blurry" });
    expect(review.status).toBe(200);

    fresh = await Assignment.findById(assignment!._id);
    expect(fresh!.proofs[0].status).toBe("rejected");
    expect(fresh!.currentStep).toBe(1);

    // resubmit works
    const resub = await asRole(app, testerUser.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignment!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/clear.png", fileHash: "h2" });
    expect(resub.status).toBe(201);

    // tester notified about the rejection
    const notif = await Notification.findOne({ type: "step_rejected" });
    expect(notif?.payload.body).toContain("blurry");
  });

  it("fraud defense: the same screenshot hash can't be reused by another tester", async () => {
    const { projectId } = await activeProject();
    const a = await makeTester();
    const b = await makeTester();
    await asRole(app, a.user.clerkUserId, "tester").post(`/api/v1/projects/${projectId}/join`);
    await asRole(app, b.user.clerkUserId, "tester").post(`/api/v1/projects/${projectId}/join`);

    const assignA = await Assignment.findOne({ projectId, testerId: a.tester._id });
    const assignB = await Assignment.findOne({ projectId, testerId: b.tester._id });

    await asRole(app, a.user.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignA!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/same.png", fileHash: "same-hash" });
    const reuse = await asRole(app, b.user.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignB!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/same.png", fileHash: "same-hash" });
    expect(reuse.status).toBe(409);
    expect(reuse.body.error.code).toBe("PROOF_REUSED");
  });

  it("step-1 gate → opt-in URL → per-tester links → redirect logs clicks", async () => {
    const { projectId, admin } = await activeProject();
    const { testers } = await joinN(projectId, 3); // small active set for the gate

    // links before the gate → 409
    const early = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/projects/${projectId}/play-integration`)
      .send({ optInUrl: "https://play.google.com/apps/testing/com.example.race" });
    expect(early.status).toBe(409);

    // everyone submits + gets verified for step 1
    for (const t of testers) {
      const assignment = await Assignment.findOne({ projectId, testerId: t.tester._id });
      await asRole(app, t.user.clerkUserId, "tester")
        .post(`/api/v1/assignments/${assignment!._id}/proofs`)
        .send({ fileUrl: `https://res.cloudinary.com/x/${t.user._id}.png`, fileHash: `h-${t.user._id}` });
      const fresh = await Assignment.findById(assignment!._id);
      const submitted = fresh!.proofs.find((p) => p.status === "submitted")!;
      await asRole(app, admin.clerkUserId, "admin")
        .post(`/api/v1/verification/${assignment!._id}/proofs/${submitted._id}/review`)
        .send({ approve: true });
    }

    let project = await Project.findById(projectId);
    expect(project!.steps.find((s) => s.order === 1)!.state).toBe("verified");

    // verified email list
    const emails = await asRole(app, admin.clerkUserId, "admin").get(
      `/api/v1/projects/${projectId}/verified-tester-emails`,
    );
    expect(emails.body.data.emails).toHaveLength(3);

    // distribute links
    const dist = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/projects/${projectId}/play-integration`)
      .send({ optInUrl: "https://play.google.com/apps/testing/com.example.race" });
    expect(dist.status).toBe(200);

    project = await Project.findById(projectId);
    expect(project!.steps.find((s) => s.order === 2)!.state).toBe("active");

    // each tester got a unique tracked link
    const links = await Notification.find({ type: "testing_link", channel: "in_app" });
    expect(links).toHaveLength(3);
    expect(new Set(links.map((l) => l.payload.link)).size).toBe(3);

    // redirect endpoint 302s and logs the click
    const assignment = await Assignment.findOne({ projectId, status: "active" }).lean();
    const redirect = await asRole(app, "", "tester").get(`/t/${assignment!._id}`);
    expect(redirect.status).toBe(302);
    expect(redirect.headers.location).toBe(
      "https://play.google.com/apps/testing/com.example.race",
    );
    expect(
      await MetricEvent.countDocuments({ type: "testing_link_clicked", projectId }),
    ).toBe(1);
  });

  it("inactivity: step-1 idle tester is auto-replaced from the queue; step-2 idle is only flagged", async () => {
    const { projectId, admin } = await activeProject("starter");
    void admin;
    const { testers } = await joinN(projectId, 16); // 14 active + 2 queued

    const stale = new Date(Date.now() - 49 * 3600 * 1000);
    const active = await Assignment.find({ projectId, status: "active" }).lean();

    // one active tester stuck on step 1, another already on step 2
    await Assignment.updateOne({ _id: active[0]._id }, { $set: { lastActivityAt: stale } });
    await Assignment.updateOne(
      { _id: active[1]._id },
      { $set: { lastActivityAt: stale, currentStep: 2 } },
    );

    const result = await runInactivitySweep();
    expect(result.removed).toBe(1);
    expect(result.flagged).toBe(1);

    // the step-1 tester was replaced by queue position 1
    const removedDoc = await Assignment.findById(active[0]._id);
    expect(removedDoc!.status).toBe("removed");
    expect(removedDoc!.replacedBy).toBeTruthy();

    const queue = await Assignment.find({ projectId, status: "queued" }).lean();
    expect(queue).toHaveLength(1);
    expect(queue[0].queuePosition).toBe(2); // position 1 was promoted

    const promotedDoc = await Assignment.findById(removedDoc!.replacedBy!);
    expect(promotedDoc!.status).toBe("active");
    expect(
      await Assignment.countDocuments({ projectId, status: "active" }),
    ).toBe(14);

    // the step-2 tester was flagged, not removed; admin got the alert
    const flaggedDoc = await Assignment.findById(active[1]._id);
    expect(flaggedDoc!.status).toBe("active");
    expect(flaggedDoc!.inactivityFlag).toBe(true);
    const alert = await Notification.findOne({ type: "inactivity_alert" });
    expect(alert).toBeTruthy();

    // metric recorded
    expect(
      await MetricEvent.countDocuments({ type: "tester_replaced", projectId }),
    ).toBe(1);

    // second sweep: no double-replace, no double-flag
    const second = await runInactivitySweep();
    expect(second.removed).toBe(0);
    expect(second.flagged).toBe(0);
    void testers;
  });

  it("full lifecycle: all five steps for every tester completes the project", async () => {
    const { projectId, admin } = await activeProject("starter");
    const { testers } = await joinN(projectId, 2);

    const verifyCurrentStep = async (clerkId: string, testerId: Types.ObjectId, step: number) => {
      const assignment = await Assignment.findOne({ projectId, testerId });
      const res = await asRole(app, clerkId, "tester")
        .post(`/api/v1/assignments/${assignment!._id}/proofs`)
        .send({
          fileUrl: `https://res.cloudinary.com/x/${testerId}-s${step}.png`,
          fileHash: `h-${testerId}-s${step}`,
        });
      expect(res.status).toBe(201);
      const fresh = await Assignment.findById(assignment!._id);
      const submitted = fresh!.proofs.findLast((p) => p.status === "submitted")!;
      const review = await asRole(app, admin.clerkUserId, "admin")
        .post(`/api/v1/verification/${assignment!._id}/proofs/${submitted._id}/review`)
        .send({ approve: true });
      expect(review.status).toBe(200);
    };

    // step 1 for everyone → gate opens
    for (const t of testers) await verifyCurrentStep(t.user.clerkUserId, t.tester._id, 1);
    await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/projects/${projectId}/play-integration`)
      .send({ optInUrl: "https://play.google.com/apps/testing/com.example.race" });

    // steps 2-5 per tester
    for (const t of testers) {
      await verifyCurrentStep(t.user.clerkUserId, t.tester._id, 2);
      await verifyCurrentStep(t.user.clerkUserId, t.tester._id, 3);
      await verifyCurrentStep(t.user.clerkUserId, t.tester._id, 4);
      await verifyCurrentStep(t.user.clerkUserId, t.tester._id, 5);
    }

    const assignments = await Assignment.find({ projectId }).lean();
    expect(assignments.every((a) => a.status === "completed")).toBe(true);

    const project = await Project.findById(projectId);
    expect(project!.status).toBe("completed");
    expect(project!.completedAt).toBeTruthy();

    // total payout per tester: 30+40+80+100+50 = ₹300
    const tester = await Tester.findById(testers[0].tester._id);
    expect(tester!.walletBalance).toBe(30_000);
    expect(
      await MetricEvent.countDocuments({ type: "project_completed", projectId }),
    ).toBe(1);
  });
});
