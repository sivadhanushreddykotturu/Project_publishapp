import { connectTestDb, disconnectTestDb, clearCollections } from "./setup";
import { User } from "../src/models/User";
import { Tester } from "../src/models/Tester";
import { Client } from "../src/models/Client";
import { Project } from "../src/models/Project";
import { Assignment } from "../src/models/Assignment";
import { joinProject, replaceInactiveStep1Tester } from "../src/services/matching.service";

async function makeTester(tag: string) {
  const user = await User.create({ clerkUserId: `clerk_${tag}`, role: "tester", name: tag, email: `${tag}@test.com` });
  return Tester.create({ userId: user._id });
}

async function makeProject(requiredTesters: number) {
  const clientUser = await User.create({ clerkUserId: "clerk_client", role: "client", name: "Client", email: "client@test.com" });
  const client = await Client.create({ userId: clientUser._id, contactName: "Client" });
  return Project.create({
    clientId: client._id,
    package: "testers_only",
    appDetails: { appName: "Test App" },
    requiredTesters,
    status: "active",
    joinState: "open",
    steps: [
      { order: 1, type: "verification", state: "pending", config: { gate: "project" } },
      { order: 2, type: "play_store_invite", state: "pending", config: { gate: "project" } },
    ],
  });
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

describe("matching.service", () => {
  it("assigns the first N testers active and queues the rest, in arrival order", async () => {
    const project = await makeProject(2);
    const t1 = await makeTester("t1");
    const t2 = await makeTester("t2");
    const t3 = await makeTester("t3");

    const a1 = await joinProject(project._id, t1._id);
    const a2 = await joinProject(project._id, t2._id);
    const a3 = await joinProject(project._id, t3._id);

    expect(a1.status).toBe("active");
    expect(a2.status).toBe("active");
    expect(a3.status).toBe("queued");
    expect(a3.queuePosition).toBe(1);

    const refreshed = await Project.findById(project._id);
    expect(refreshed!.activeTesterCount).toBe(2);
    expect(refreshed!.joinState).toBe("full");
  });

  it("rejects a tester joining the same project twice", async () => {
    const project = await makeProject(2);
    const t1 = await makeTester("t1");
    await joinProject(project._id, t1._id);
    await expect(joinProject(project._id, t1._id)).rejects.toThrow(/already joined/i);
  });

  it("replaces an inactive Step 1 tester and promotes the queued tester", async () => {
    const project = await makeProject(1);
    const t1 = await makeTester("t1");
    const t2 = await makeTester("t2");

    const a1 = await joinProject(project._id, t1._id);
    const a2 = await joinProject(project._id, t2._id);
    expect(a1.status).toBe("active");
    expect(a2.status).toBe("queued");

    const { removed, promoted } = await replaceInactiveStep1Tester(a1._id);
    expect(removed.status).toBe("removed");
    expect(removed.replacedBy?.toString()).toBe(t2._id.toString());
    expect(promoted?.status).toBe("active");
    expect(promoted?.testerId.toString()).toBe(t2._id.toString());

    const refreshedProject = await Project.findById(project._id);
    expect(refreshedProject!.activeTesterCount).toBe(1);

    const activeCount = await Assignment.countDocuments({ projectId: project._id, status: "active" });
    expect(activeCount).toBe(1);
  });
});
