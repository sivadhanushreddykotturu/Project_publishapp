import { Types } from "mongoose";
import { connectTestDb, disconnectTestDb, clearCollections } from "./setup";
import { User } from "../src/models/User";
import { Client } from "../src/models/Client";
import { Project } from "../src/models/Project";
import { Assignment } from "../src/models/Assignment";
import { Tester } from "../src/models/Tester";
import { syncApiModeRelease, ApiModeSyncDeps } from "../src/services/playIntegration.service";
import { ApiError } from "../src/utils/apiError";

async function makeAdmin() {
  return User.create({ clerkUserId: "clerk_admin", role: "admin", name: "Admin", email: "admin@test.com" });
}

async function makeApiModeProject(overrides: Partial<Record<string, unknown>> = {}) {
  const clientUser = await User.create({ clerkUserId: "clerk_client", role: "client", name: "Client", email: "client@test.com" });
  const client = await Client.create({ userId: clientUser._id, contactName: "Client" });

  const project = await Project.create({
    clientId: client._id,
    package: "managed_testing",
    appDetails: { appName: "Test App", packageName: "com.example.app" },
    requiredTesters: 14,
    status: "active",
    steps: [
      { order: 1, type: "verification", state: "verified", config: { gate: "project" } },
      { order: 2, type: "play_store_invite", state: "pending", config: { gate: "project" } },
    ],
    playIntegration: {
      mode: "api",
      track: "internal",
      packageName: "com.example.app",
      aabFileUrl: "aab-uploads/test-build.aab",
      serviceAccountLinked: true,
      ...overrides,
    },
  });
  return project;
}

function fakeDeps(overrides: Partial<ApiModeSyncDeps> = {}): ApiModeSyncDeps {
  return {
    client: {} as ApiModeSyncDeps["client"],
    createEdit: jest.fn().mockResolvedValue("edit-123"),
    uploadBundle: jest.fn().mockResolvedValue(42),
    updateTrackRelease: jest.fn().mockResolvedValue(undefined),
    syncTesterGoogleGroup: jest.fn().mockResolvedValue(undefined),
    commitEdit: jest.fn().mockResolvedValue(undefined),
    getObjectStream: jest.fn().mockResolvedValue("fake-stream" as unknown as NodeJS.ReadableStream),
    ...overrides,
  };
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

describe("playIntegration.service — Google Play API mode", () => {
  it("runs the full edit lifecycle in order and commits the release", async () => {
    const project = await makeApiModeProject();
    const admin = await makeAdmin();
    const deps = fakeDeps();

    const result = await syncApiModeRelease(project._id, admin._id, deps);

    expect(deps.createEdit).toHaveBeenCalledWith(deps.client, "com.example.app");
    expect(deps.uploadBundle).toHaveBeenCalledWith(deps.client, "com.example.app", "edit-123", "fake-stream");
    expect(deps.updateTrackRelease).toHaveBeenCalledWith(deps.client, "com.example.app", "edit-123", "internal", 42);
    expect(deps.commitEdit).toHaveBeenCalledWith(deps.client, "com.example.app", "edit-123");
    expect(result.versionCode).toBe(42);
    expect(result.testerListAutomated).toBe(false);

    const refreshed = await Project.findById(project._id);
    expect(refreshed!.playIntegration.versionCode).toBe(42);
    expect(refreshed!.playIntegration.optInUrl).toBe("https://play.google.com/apps/testing/com.example.app");
    expect(refreshed!.playIntegration.lastApiError).toBeUndefined();
  });

  it("syncs the tester Google Group when one is configured, and reports it as automated", async () => {
    const project = await makeApiModeProject({ testerGoogleGroupEmail: "testers@example.com" });
    const admin = await makeAdmin();
    const deps = fakeDeps();

    const result = await syncApiModeRelease(project._id, admin._id, deps);

    expect(deps.syncTesterGoogleGroup).toHaveBeenCalledWith(deps.client, "com.example.app", "edit-123", "internal", "testers@example.com");
    expect(result.testerListAutomated).toBe(true);
  });

  it("skips the Google Group sync call when no group is configured", async () => {
    const project = await makeApiModeProject();
    const admin = await makeAdmin();
    const deps = fakeDeps();

    await syncApiModeRelease(project._id, admin._id, deps);

    expect(deps.syncTesterGoogleGroup).not.toHaveBeenCalled();
  });

  it("distributes testing links to Step-2 testers after a successful sync", async () => {
    const project = await makeApiModeProject();
    const admin = await makeAdmin();
    const testerUser = await User.create({ clerkUserId: "clerk_t1", role: "tester", name: "T1", email: "t1@test.com" });
    const tester = await Tester.create({ userId: testerUser._id });
    await Assignment.create({
      projectId: project._id,
      testerId: tester._id,
      status: "active",
      currentStep: 2,
      lastActivityAt: new Date(),
    });

    await syncApiModeRelease(project._id, admin._id, fakeDeps());

    const { Notification } = await import("../src/models/Notification");
    const notif = await Notification.findOne({ recipientId: testerUser._id, type: "testing_link" });
    expect(notif).not.toBeNull();
  });

  it("records the failure on the project and throws a 502 pointing to the manual fallback, without committing", async () => {
    const project = await makeApiModeProject();
    const admin = await makeAdmin();
    const deps = fakeDeps({
      uploadBundle: jest.fn().mockRejectedValue(new Error("version code 42 already used")),
    });

    await expect(syncApiModeRelease(project._id, admin._id, deps)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining("Fall back to manual mode"),
    });

    expect(deps.updateTrackRelease).not.toHaveBeenCalled();
    expect(deps.commitEdit).not.toHaveBeenCalled();

    const refreshed = await Project.findById(project._id);
    expect(refreshed!.playIntegration.lastApiError).toContain("version code 42 already used");
    expect(refreshed!.playIntegration.optInUrl).toBeUndefined();
  });

  it("refuses to run when the project isn't configured for API mode", async () => {
    const project = await makeApiModeProject({ mode: "manual" });
    const admin = await makeAdmin();

    await expect(syncApiModeRelease(project._id, admin._id, fakeDeps())).rejects.toThrow(ApiError);
  });

  it("refuses to run when the service account hasn't been linked yet", async () => {
    const project = await makeApiModeProject({ serviceAccountLinked: false });
    const admin = await makeAdmin();

    await expect(syncApiModeRelease(project._id, admin._id, fakeDeps())).rejects.toThrow(/service account/i);
  });

  it("refuses to run when no AAB has been uploaded", async () => {
    const project = await makeApiModeProject({ aabFileUrl: undefined });
    const admin = await makeAdmin();

    await expect(syncApiModeRelease(project._id, admin._id, fakeDeps())).rejects.toThrow(/AAB/i);
  });
});
