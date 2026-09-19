import { Types } from "mongoose";
import { connectTestDb, disconnectTestDb, clearCollections } from "./setup";
import { User } from "../src/models/User";
import { Client } from "../src/models/Client";
import { Tester } from "../src/models/Tester";
import { Project } from "../src/models/Project";
import { Assignment } from "../src/models/Assignment";
import { Notification } from "../src/models/Notification";
import { createStepsFromTemplate, submitProof, verifyProof } from "../src/services/workflowEngine.service";
import {
  submitEmailsForReview,
  confirmEmailReviewApproved,
  autoAdvanceDueEmailReviews,
  markTestersInvited,
  applyForProduction,
  confirmProductionApproved,
  getVerifiedTesterEmails,
} from "../src/services/playIntegration.service";
import { runInstallPacingSweep } from "../src/jobs/installPacingCron";

async function makeAdmin() {
  return User.create({ clerkUserId: "clerk_admin", role: "admin", name: "Admin", email: "admin@test.com" });
}

async function makeProject() {
  const clientUser = await User.create({ clerkUserId: "clerk_client", role: "client", name: "Client", email: "client@test.com" });
  const client = await Client.create({ userId: clientUser._id, contactName: "Client" });
  const project = new Project({
    clientId: client._id,
    package: "testers_only",
    appDetails: { appName: "Test App", packageName: "com.example.app" },
    requiredTesters: 14,
    status: "active",
  });
  project.steps = createStepsFromTemplate(project);
  await project.save();
  return project;
}

async function makeVerifiedTesterAssignment(project: InstanceType<typeof Project>, adminId: Types.ObjectId) {
  const uniqueSuffix = new Types.ObjectId().toString();
  const user = await User.create({
    clerkUserId: `clerk_${uniqueSuffix}`,
    role: "tester",
    name: "T",
    email: `${uniqueSuffix}@test.com`,
  });
  const tester = await Tester.create({ userId: user._id });
  const assignment = await Assignment.create({
    projectId: project._id,
    testerId: tester._id,
    status: "active",
    currentStep: 1,
    assignedAt: new Date(),
    lastActivityAt: new Date(),
  });
  await submitProof({ assignmentId: assignment._id, step: 1, fileUrl: "r2://proofs/v.png" });
  await verifyProof({ assignmentId: assignment._id, step: 1, approve: true, adminId });
  return { tester, assignment };
}

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await disconnectTestDb();
});
afterEach(async () => {
  await clearCollections();
  jest.useRealTimers();
});

describe("email review milestone", () => {
  it("returns the verified Google Play email submitted by the tester", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const uniqueSuffix = new Types.ObjectId().toString();
    const user = await User.create({ clerkUserId: `clerk_${uniqueSuffix}`, role: "tester", name: "T", email: `${uniqueSuffix}@account.test` });
    const tester = await Tester.create({ userId: user._id });
    const assignment = await Assignment.create({ projectId: project._id, testerId: tester._id, status: "active", currentStep: 1, assignedAt: new Date(), lastActivityAt: new Date() });

    await submitProof({ assignmentId: assignment._id, step: 1, fileUrl: "r2://proofs/v.png", googlePlayEmail: "play.tester@gmail.com" });
    await verifyProof({ assignmentId: assignment._id, step: 1, approve: true, adminId: admin._id });

    await expect(getVerifiedTesterEmails(project._id)).resolves.toEqual(["play.tester@gmail.com"]);
  });

  it("requires verification to be fully cleared before it can be submitted for review", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await expect(submitEmailsForReview(project._id, admin._id)).rejects.toThrow(/verification/i);
  });

  it("starts the review clock and lets the admin confirm it early", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await makeVerifiedTesterAssignment(project, admin._id);

    await submitEmailsForReview(project._id, admin._id);
    let refreshed = await Project.findById(project._id);
    expect(refreshed!.steps.find((s) => s.type === "google_email_review")!.state).toBe("submitted");
    expect(refreshed!.playIntegration.emailReviewExpectedApprovalAt).toBeDefined();

    await confirmEmailReviewApproved(project._id, admin._id);
    refreshed = await Project.findById(project._id);
    expect(refreshed!.steps.find((s) => s.type === "google_email_review")!.state).toBe("verified");
  });

  it("auto-advances via the cron once the expected-approval time has passed, and notifies admins", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await makeVerifiedTesterAssignment(project, admin._id);
    await submitEmailsForReview(project._id, admin._id);

    // Force the expected-approval timestamp into the past instead of waiting 3 real hours.
    await Project.findByIdAndUpdate(project._id, {
      "playIntegration.emailReviewExpectedApprovalAt": new Date(Date.now() - 1000),
    });

    const advanced = await autoAdvanceDueEmailReviews();
    expect(advanced).toBe(1);

    const refreshed = await Project.findById(project._id);
    expect(refreshed!.steps.find((s) => s.type === "google_email_review")!.state).toBe("verified");

    const notif = await Notification.findOne({ recipientId: admin._id, type: "email_review_reminder" });
    expect(notif).not.toBeNull();
  });

  it("blocks markTestersInvited until email review is confirmed", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await makeVerifiedTesterAssignment(project, admin._id);

    await expect(
      markTestersInvited({ projectId: project._id, optInUrl: "https://play.google.com/apps/testing/x", adminId: admin._id })
    ).rejects.toThrow(/email review/i);
  });
});

describe("14-day testing period hard gate", () => {
  async function advanceToTestingPeriod(project: InstanceType<typeof Project>, adminId: Types.ObjectId) {
    const { assignment } = await makeVerifiedTesterAssignment(project, adminId);
    await submitEmailsForReview(project._id, adminId);
    await confirmEmailReviewApproved(project._id, adminId);
    await markTestersInvited({ projectId: project._id, optInUrl: "https://play.google.com/apps/testing/x", adminId });
    await submitProof({ assignmentId: assignment._id, step: 3, fileUrl: "r2://proofs/optin.png" });
    await verifyProof({ assignmentId: assignment._id, step: 3, approve: true, adminId });
    return assignment;
  }

  it("rejects apply-production before the testing period has started", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await expect(applyForProduction(project._id, admin._id)).rejects.toThrow(/hasn't started/i);
  });

  it("rejects apply-production before 14 days have elapsed, and reports days remaining", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await advanceToTestingPeriod(project, admin._id);

    await expect(applyForProduction(project._id, admin._id)).rejects.toThrow(/testing period isn't over yet/i);
  });

  it("allows apply-production once 14 days have genuinely elapsed", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    await advanceToTestingPeriod(project, admin._id);

    await Project.findByIdAndUpdate(project._id, {
      "playIntegration.testingPeriodStartAt": new Date(Date.now() - 15 * 24 * 3_600_000),
    });

    const applied = await applyForProduction(project._id, admin._id);
    expect(applied.steps.find((s) => s.type === "production_review")!.state).toBe("submitted");
    expect(applied.playIntegration.productionAppliedAt).toBeDefined();
  });

  it("completes the project once production is confirmed approved and every tester finished their part", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const assignment = await advanceToTestingPeriod(project, admin._id);

    // Tester finishes their testing_period proof — this is their terminal step.
    await submitProof({ assignmentId: assignment._id, step: 4, fileUrl: "r2://proofs/installed.png" });
    await verifyProof({ assignmentId: assignment._id, step: 4, approve: true, adminId: admin._id });

    await Project.findByIdAndUpdate(project._id, {
      "playIntegration.testingPeriodStartAt": new Date(Date.now() - 15 * 24 * 3_600_000),
    });
    await applyForProduction(project._id, admin._id);
    await confirmProductionApproved(project._id, admin._id);

    const finalProject = await Project.findById(project._id);
    expect(finalProject!.status).toBe("completed");
    expect(finalProject!.steps.find((s) => s.type === "completion")!.state).toBe("verified");
  });
});

describe("staggered install pacing cron", () => {
  it("only notifies testers whose scheduled install day has arrived", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { assignment: dueAssignment } = await makeVerifiedTesterAssignment(project, admin._id);
    const { assignment: futureAssignment } = await makeVerifiedTesterAssignment(project, admin._id);

    await Project.findByIdAndUpdate(project._id, { "playIntegration.testingPeriodStartAt": new Date() });
    dueAssignment.currentStep = 4;
    dueAssignment.scheduledInstallDate = new Date(Date.now() - 3_600_000);
    await dueAssignment.save();
    futureAssignment.currentStep = 4;
    futureAssignment.scheduledInstallDate = new Date(Date.now() + 5 * 24 * 3_600_000);
    await futureAssignment.save();

    const { notified } = await runInstallPacingSweep();
    expect(notified).toBe(1);

    const dueTester = await Tester.findById(dueAssignment.testerId);
    const notif = await Notification.findOne({ recipientId: dueTester!.userId, type: "install_scheduled" });
    expect(notif).not.toBeNull();

    const futureTester = await Tester.findById(futureAssignment.testerId);
    const futureNotif = await Notification.findOne({ recipientId: futureTester!.userId, type: "install_scheduled" });
    expect(futureNotif).toBeNull();
  });
});
