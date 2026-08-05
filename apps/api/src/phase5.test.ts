import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import {
  Assignment,
  BugReport,
  Client,
  Notification,
  Project,
  SupportTicket,
  Tester,
  WalletTransaction,
} from "./models/index.js";
import { clearTestDb, startTestDb, stopTestDb } from "./test/db.js";
import { asRole, makeAdmin, makeClient, makeTester } from "./test/helpers.js";

const app = createApp();

async function projectWithTesters(n = 2) {
  const { user: clientUser, client } = await makeClient();
  const created = await asRole(app, clientUser.clerkUserId, "client")
    .post("/api/v1/projects")
    .send({
      packageKey: "starter",
      appDetails: { appName: "Buggy App", packageName: "com.example.buggy" },
    });
  const projectId: string = created.body.data.project._id;
  const admin = await makeAdmin();
  await asRole(app, admin.clerkUserId, "admin").post(
    `/api/v1/projects/${projectId}/mark-paid`,
  );
  await asRole(app, admin.clerkUserId, "admin").post(
    `/api/v1/projects/${projectId}/publish`,
  );

  const testers = await Promise.all(Array.from({ length: n }, () => makeTester()));
  for (const t of testers) {
    await asRole(app, t.user.clerkUserId, "tester").post(
      `/api/v1/projects/${projectId}/join`,
    );
  }
  return { projectId, admin, clientUser, client, testers };
}

const BUG = {
  title: "Crash on launch",
  description: "App force-closes immediately on cold start",
  category: "crash",
  severity: "critical",
  device: { platform: "android", model: "Pixel 8a", osVersion: "15" },
  expectedResult: "App opens to home screen",
  actualResult: "App crashes with no error",
  stepsToReproduce: ["Install app", "Open app"],
  attachments: [],
};

describe("bugs, wallet, support, notifications, reports", () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  beforeEach(clearTestDb);

  it("tester files a structured bug; visibility rules hold per role", async () => {
    const { projectId, testers, clientUser } = await projectWithTesters();
    const t = testers[0];

    const res = await asRole(app, t.user.clerkUserId, "tester")
      .post(`/api/v1/projects/${projectId}/bug-reports`)
      .send(BUG);
    expect(res.status).toBe(201);

    // outsider tester can't file
    const outsider = await makeTester();
    const denied = await asRole(app, outsider.user.clerkUserId, "tester")
      .post(`/api/v1/projects/${projectId}/bug-reports`)
      .send(BUG);
    expect(denied.status).toBe(403);

    // client sees nothing until published
    const clientView = await asRole(app, clientUser.clerkUserId, "client").get(
      `/api/v1/projects/${projectId}/bug-reports`,
    );
    expect(clientView.body.data.bugs).toHaveLength(0);

    const admin = await makeAdmin();
    const adminView = await asRole(app, admin.clerkUserId, "admin").get(
      `/api/v1/projects/${projectId}/bug-reports`,
    );
    expect(adminView.body.data.bugs).toHaveLength(1);
  });

  it("merge keeps strongest evidence; publish notifies the client", async () => {
    const { projectId, admin, testers, client } = await projectWithTesters();
    const [t1, t2] = testers;

    const b1 = await asRole(app, t1.user.clerkUserId, "tester")
      .post(`/api/v1/projects/${projectId}/bug-reports`)
      .send(BUG);
    const b2 = await asRole(app, t2.user.clerkUserId, "tester")
      .post(`/api/v1/projects/${projectId}/bug-reports`)
      .send({
        ...BUG,
        title: "Force close on start",
        severity: "medium",
        attachments: [
          {
            url: "https://res.cloudinary.com/x/evidence.png",
            publicId: "p1",
            resourceType: "image",
            bytes: 100,
          },
        ],
      });
    const sourceId = b2.body.data.bug._id;
    const targetId = b1.body.data.bug._id;

    const merge = await asRole(app, admin.clerkUserId, "admin")
      .post("/api/v1/bug-reports/merge")
      .send({ sourceId, targetId });
    expect(merge.status).toBe(200);

    const target = await BugReport.findById(targetId);
    expect(target!.attachments).toHaveLength(1); // evidence moved over
    expect(target!.mergedFrom).toHaveLength(1);
    const source = await BugReport.findById(sourceId);
    expect(source!.status).toBe("duplicate");
    expect(String(source!.duplicateOf)).toBe(targetId);

    // double merge blocked
    const again = await asRole(app, admin.clerkUserId, "admin")
      .post("/api/v1/bug-reports/merge")
      .send({ sourceId, targetId });
    expect(again.status).toBe(409);

    // publish → client sees it, client gets notified
    const pub = await asRole(app, admin.clerkUserId, "admin")
      .post("/api/v1/bug-reports/publish")
      .send({ ids: [targetId] });
    expect(pub.body.data.published).toBe(1);

    const clientOwner = await Client.findById(client._id);
    const notif = await Notification.findOne({
      recipientId: clientOwner!.userId,
      type: "bug_status",
      channel: "in_app",
    });
    expect(notif).toBeTruthy();
  });

  it("wallet: withdrawal holds balance, admin completes with UPI ref, reject refunds", async () => {
    const { user: testerUser, tester } = await makeTester();
    await Tester.updateOne({ _id: tester._id }, { $set: { walletBalance: 50_000, "upi.vpa": "t@okhdfc" } });
    const admin = await makeAdmin();

    const clerkId = testerUser.clerkUserId;

    const tooSmall2 = await asRole(app, clerkId, "tester")
      .post("/api/v1/wallet/withdrawals")
      .send({ amountPaise: 50_00 });
    expect(tooSmall2.status).toBe(400);

    const overdraw = await asRole(app, clerkId, "tester")
      .post("/api/v1/wallet/withdrawals")
      .send({ amountPaise: 999_999_00 });
    expect(overdraw.status).toBe(409);

    const ok1 = await asRole(app, clerkId, "tester")
      .post("/api/v1/wallet/withdrawals")
      .send({ amountPaise: 20_000 });
    expect(ok1.status).toBe(201);
    expect((await Tester.findById(tester._id))!.walletBalance).toBe(30_000); // held

    // complete one, reject another
    const w1 = ok1.body.data.withdrawal._id;
    const ok2 = await asRole(app, clerkId, "tester")
      .post("/api/v1/wallet/withdrawals")
      .send({ amountPaise: 10_000 });
    const w2 = ok2.body.data.withdrawal._id;
    expect((await Tester.findById(tester._id))!.walletBalance).toBe(20_000);

    const complete = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/wallet/withdrawals/${w1}/complete`)
      .send({ upiRef: "UTR123456789" });
    expect(complete.status).toBe(200);
    const paidTx = await WalletTransaction.findById(w1);
    expect(paidTx!.status).toBe("paid");
    expect((await Tester.findById(tester._id))!.walletBalance).toBe(20_000); // no refund on success

    const reject = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/wallet/withdrawals/${w2}/reject`)
      .send({ reason: "UPI handle inactive" });
    expect(reject.status).toBe(200);
    expect((await Tester.findById(tester._id))!.walletBalance).toBe(30_000); // refunded

    // tester notified on both
    const notifs = await Notification.find({
      type: "withdrawal_update",
      channel: "in_app",
    });
    expect(notifs.length).toBeGreaterThanOrEqual(2);

    // ledger is consistent
    const all = await WalletTransaction.find({ testerId: tester._id });
    expect(all.map((t) => t.status).sort()).toEqual(["paid", "rejected"]);
  });

  it("support threads: owner + admin reply, client communication log updates", async () => {
    const { user: clientUser } = await makeClient();
    const admin = await makeAdmin();

    const created = await asRole(app, clientUser.clerkUserId, "client")
      .post("/api/v1/support-tickets")
      .send({ subject: "Where is my report?", body: "It's been a week" });
    expect(created.status).toBe(201);
    const ticketId = created.body.data.ticket._id;

    // other client can't read it
    const other = await makeClient();
    const denied = await asRole(app, other.user.clerkUserId, "client").get(
      `/api/v1/support-tickets/${ticketId}`,
    );
    expect(denied.status).toBe(403);

    // admin replies → notification + communication log
    const reply = await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/support-tickets/${ticketId}/messages`)
      .send({ body: "Your report ships Friday." });
    expect(reply.status).toBe(200);

    const thread = await asRole(app, clientUser.clerkUserId, "client").get(
      `/api/v1/support-tickets/${ticketId}`,
    );
    expect(thread.body.data.ticket.messages).toHaveLength(2);
    expect(thread.body.data.ticket.status).toBe("in_progress");

    const clientDoc = await Client.findOne({ userId: clientUser._id });
    expect(clientDoc!.communications).toHaveLength(1);
    expect(clientDoc!.communications[0].subject).toBe("Where is my report?");

    const notif = await Notification.findOne({
      type: "support_reply",
      recipientId: clientUser._id,
    });
    expect(notif).toBeTruthy();

    // admin closes
    const close = await asRole(app, admin.clerkUserId, "admin")
      .patch(`/api/v1/support-tickets/${ticketId}/status`)
      .send({ status: "resolved" });
    expect(close.body.data.ticket.status).toBe("resolved");
  });

  it("completion report aggregates proofs, bugs, and the metric timeline", async () => {
    const { projectId, clientUser, testers, admin } = await projectWithTesters(2);

    // one verified proof for tester 1
    const t1 = testers[0];
    const assignment = await Assignment.findOne({ projectId, testerId: t1.tester._id });
    await asRole(app, t1.user.clerkUserId, "tester")
      .post(`/api/v1/assignments/${assignment!._id}/proofs`)
      .send({ fileUrl: "https://res.cloudinary.com/x/p.png", fileHash: "h1" });
    const fresh = await Assignment.findById(assignment!._id);
    await asRole(app, admin.clerkUserId, "admin")
      .post(`/api/v1/verification/${assignment!._id}/proofs/${fresh!.proofs[0]._id}/review`)
      .send({ approve: true });

    const report = await asRole(app, clientUser.clerkUserId, "client").get(
      `/api/v1/projects/${projectId}/completion-report`,
    );
    expect(report.status).toBe(200);
    const r = report.body.data.report;
    expect(r.app.appName).toBe("Buggy App");
    expect(r.testers).toHaveLength(2);
    expect(r.timeline.map((e: { type: string }) => e.type)).toContain("payment_confirmed");
    expect(r.timeline.map((e: { type: string }) => e.type)).toContain("opportunity_published");
    const t1Row = r.testers.find(
      (x: { tester: { email: string } }) => x.tester.email === t1.user.email,
    );
    expect(t1Row.proofsVerified).toBe(1);

    // other client blocked
    const other = await makeClient();
    const denied = await asRole(app, other.user.clerkUserId, "client").get(
      `/api/v1/projects/${projectId}/completion-report`,
    );
    expect(denied.status).toBe(403);
  });

  it("client rates testers after completion — once each, averages update", async () => {
    const { projectId, clientUser, testers } = await projectWithTesters(2);

    // not completed yet
    const early = await asRole(app, clientUser.clerkUserId, "client")
      .post(`/api/v1/projects/${projectId}/ratings`)
      .send({ ratings: [{ testerId: String(testers[0].tester._id), rating: 5 }] });
    expect(early.status).toBe(409);

    await Project.updateOne({ _id: projectId }, { $set: { status: "completed" } });

    const rate = await asRole(app, clientUser.clerkUserId, "client")
      .post(`/api/v1/projects/${projectId}/ratings`)
      .send({
        ratings: [
          { testerId: String(testers[0].tester._id), rating: 5 },
          { testerId: String(testers[1].tester._id), rating: 3 },
        ],
      });
    expect(rate.body.data.rated).toBe(2);

    const t0 = await Tester.findById(testers[0].tester._id);
    expect(t0!.ratingAvg).toBe(5);
    expect(t0!.ratingCount).toBe(1);

    // duplicate rating rejected silently (idempotent)
    const again = await asRole(app, clientUser.clerkUserId, "client")
      .post(`/api/v1/projects/${projectId}/ratings`)
      .send({ ratings: [{ testerId: String(testers[0].tester._id), rating: 1 }] });
    expect(again.body.data.rated).toBe(0);
    expect((await Tester.findById(testers[0].tester._id))!.ratingAvg).toBe(5);
  });

  it("notification bell: list own, mark read", async () => {
    const { projectId, testers } = await projectWithTesters(1);
    void projectId;
    const clerkId = testers[0].user.clerkUserId;

    const before = await asRole(app, clerkId, "tester").get("/api/v1/notifications/me");
    expect(before.body.data.unread).toBeGreaterThan(0);

    const first = before.body.data.notifications[0];
    const read = await asRole(app, clerkId, "tester").patch(
      `/api/v1/notifications/${first._id}/read`,
    );
    expect(read.status).toBe(200);

    const after = await asRole(app, clerkId, "tester").get("/api/v1/notifications/me");
    expect(after.body.data.unread).toBe(before.body.data.unread - 1);
  });
});
