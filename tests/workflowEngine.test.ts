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
  it("clones the five-step Play Store template onto a new project", async () => {
    const project = await makeProject();
    expect(project.steps).toHaveLength(5);
    expect(project.steps.map((s) => s.type)).toEqual([
      "verification",
      "play_store_invite",
      "app_usage",
      "app_testing",
      "completion",
    ]);
    expect(project.steps[0].state).toBe("pending");
  });

  it("advances a tester's step and credits their wallet on verified approval", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { tester, assignment } = await makeTesterAssignment(project);

    // Fast-forward the tester onto Step 3 (app_usage), which carries a payout in the template.
    assignment.currentStep = 3;
    await assignment.save();
    await submitProof({ assignmentId: assignment._id, step: 3, fileUrl: "r2://proofs/x.png" });

    const updated = await verifyProof({
      assignmentId: assignment._id,
      step: 3,
      approve: true,
      adminId: admin._id,
    });

    expect(updated.currentStep).toBe(4);
    const refreshedTester = await Tester.findById(tester._id);
    expect(refreshedTester!.walletBalance).toBe(5000);
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

  it("advances the project-level Step 1 gate only once every active tester has cleared it", async () => {
    const project = await makeProject();
    const admin = await makeAdmin();
    const { assignment: a1 } = await makeTesterAssignment(project);
    const { assignment: a2 } = await makeTesterAssignment(project);

    await submitProof({ assignmentId: a1._id, step: 1, fileUrl: "r2://proofs/a.png" });
    await verifyProof({ assignmentId: a1._id, step: 1, approve: true, adminId: admin._id });

    let refreshed = await Project.findById(project._id);
    expect(refreshed!.steps[0].state).toBe("pending"); // a2 hasn't cleared Step 1 yet

    await submitProof({ assignmentId: a2._id, step: 1, fileUrl: "r2://proofs/b.png" });
    await verifyProof({ assignmentId: a2._id, step: 1, approve: true, adminId: admin._id });

    refreshed = await Project.findById(project._id);
    expect(refreshed!.steps[0].state).toBe("verified");

    // Idempotent: calling it again after the gate already advanced is a no-op, not an error.
    await expect(maybeAdvanceProjectGate(project._id, 1)).resolves.not.toThrow();
  });
});
