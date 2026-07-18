import { Types } from "mongoose";
import { connectTestDb, disconnectTestDb, clearCollections } from "./setup";
import { User } from "../src/models/User";
import { Tester } from "../src/models/Tester";
import { Client } from "../src/models/Client";
import { Project } from "../src/models/Project";
import { Assignment } from "../src/models/Assignment";
import { createStepsFromTemplate, submitProof, verifyProof, maybeAdvanceProjectGate } from "../src/services/workflowEngine.service";

async function makeAdmin() {
  return User.create({ clerkUserId: "clerk_admin", role: "admin", name: "Admin", email: "admin@test.com" });
}

async function makeTesterAssignment(project: InstanceType<typeof Project>) {
  const user = await User.create({ clerkUserId: `clerk_${new Types.ObjectId()}`, role: "tester", name: "T", email: `${new Types.ObjectId()}@test.com` });
  const tester = await Tester.create({ userId: user._id });
  const assignment = await Assignment.create({
    projectId: project._id,
    testerId: tester._id,
    status: "active",
    currentStep: 1,
    assignedAt: new Date(),
    lastActivityAt: new Date(),
  });
  return { tester, assignment };
}

async function makeProject() {
  const clientUser = await User.create({ clerkUserId: "clerk_client", role: "client", name: "Client", email: "client@test.com" });
  const client = await Client.create({ userId: clientUser._id, contactName: "Client" });
  const project = new Project({
    clientId: client._id,
    package: "testers_only",
    appDetails: { appName: "Test App" },
    requiredTesters: 14,
    status: "active",
  });
  project.steps = createStepsFromTemplate(project);
  await project.save();
  return project;
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

describe("workflowEngine.service", () => {
  it("clones the six-step Play Console template onto a new project, matching the real closed-testing timeline", async () => {
    const project = await makeProject();
    expect(project.steps).toHaveLength(6);
    expect(project.steps.map((s) => s.type)).toEqual([
      "verification",
      "google_email_review",
      "play_store_invite",
      "testing_period",
      "production_review",
      "completion",
    ]);
    expect(project.steps[0].state).toBe("pending");
    // google_email_review, production_review, and completion are admin/project-only
    // milestones — no individual tester ever acts on them.
    expect(project.steps[1].config.perTesterAction).toBe(false);
    expect(project.steps[4].config.perTesterAction).toBe(false);
    expect(project.steps[5].config.perTesterAction).toBe(false);
  });

  it("skips google_email_review when advancing a tester past verification (it has no tester action)", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { assignment } = await makeTesterAssignment(project);

    await submitProof({ assignmentId: assignment._id, step: 1, fileUrl: "r2://proofs/verify.png" });
    const updated = await verifyProof({ assignmentId: assignment._id, step: 1, approve: true, adminId: admin._id });

    expect(updated.currentStep).toBe(3); // play_store_invite, not 2 (google_email_review)
  });

  it("credits the testing_period payout and marks the tester completed — it's their terminal step", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { tester, assignment } = await makeTesterAssignment(project);

    // Fast-forward the tester onto testing_period (order 4), which carries the payout
    // and is per-tester terminal — production_review/completion are admin-only after this.
    assignment.currentStep = 4;
    await assignment.save();
    await submitProof({ assignmentId: assignment._id, step: 4, fileUrl: "r2://proofs/installed.png" });

    const updated = await verifyProof({
      assignmentId: assignment._id,
      step: 4,
      approve: true,
      adminId: admin._id,
    });

    expect(updated.currentStep).toBe(4); // stays — testing_period is terminal for the tester
    expect(updated.status).toBe("completed");
    const refreshedTester = await Tester.findById(tester._id);
    expect(refreshedTester!.walletBalance).toBe(15000);
  });

  it("rejects a submission and keeps the tester on the same step", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { assignment } = await makeTesterAssignment(project);

    await submitProof({ assignmentId: assignment._id, step: 1, fileUrl: "r2://proofs/y.png" });
    const updated = await verifyProof({
      assignmentId: assignment._id,
      step: 1,
      approve: false,
      reason: "Screenshot unreadable",
      adminId: admin._id,
    });

    expect(updated.currentStep).toBe(1);
    expect(updated.proofs[0].status).toBe("rejected");
  });

  it("advances the project-level verification gate only once every active tester has cleared it", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { assignment: a1 } = await makeTesterAssignment(project);
    const { assignment: a2 } = await makeTesterAssignment(project);

    await submitProof({ assignmentId: a1._id, step: 1, fileUrl: "r2://proofs/a.png" });
    await verifyProof({ assignmentId: a1._id, step: 1, approve: true, adminId: admin._id });

    let refreshed = await Project.findById(project._id);
    expect(refreshed!.steps[0].state).toBe("pending"); // a2 hasn't cleared verification yet

    await submitProof({ assignmentId: a2._id, step: 1, fileUrl: "r2://proofs/b.png" });
    await verifyProof({ assignmentId: a2._id, step: 1, approve: true, adminId: admin._id });

    refreshed = await Project.findById(project._id);
    expect(refreshed!.steps[0].state).toBe("verified");

    // Idempotent: calling it again after the gate already advanced is a no-op, not an error.
    await expect(maybeAdvanceProjectGate(project._id, 1)).resolves.not.toThrow();
  });

  it("starts the 14-day testing clock and staggers install dates when play_store_invite closes", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { assignment: a1 } = await makeTesterAssignment(project);
    const { assignment: a2 } = await makeTesterAssignment(project);
    const { assignment: a3 } = await makeTesterAssignment(project);

    for (const a of [a1, a2, a3]) {
      await submitProof({ assignmentId: a._id, step: 1, fileUrl: "r2://proofs/verify.png" });
      await verifyProof({ assignmentId: a._id, step: 1, approve: true, adminId: admin._id });
    }
    // All three are now on play_store_invite (order 3). Clear that gate too.
    for (const a of [a1, a2, a3]) {
      await submitProof({ assignmentId: a._id, step: 3, fileUrl: "r2://proofs/optin.png" });
      await verifyProof({ assignmentId: a._id, step: 3, approve: true, adminId: admin._id });
    }

    const refreshedProject = await Project.findById(project._id);
    expect(refreshedProject!.playIntegration.testingPeriodStartAt).toBeDefined();

    const assignments = await Assignment.find({ projectId: project._id }).sort({ assignedAt: 1 });
    expect(assignments.every((a) => a.scheduledInstallDate)).toBe(true);
    // INSTALLS_PER_DAY defaults to 2 — the 3rd tester lands on day offset 1 (the 2nd day).
    const start = refreshedProject!.playIntegration.testingPeriodStartAt!.getTime();
    expect(assignments[0].scheduledInstallDate!.getTime()).toBe(start);
    expect(assignments[1].scheduledInstallDate!.getTime()).toBe(start);
    expect(assignments[2].scheduledInstallDate!.getTime()).toBe(start + 24 * 3_600_000);
  });
});
