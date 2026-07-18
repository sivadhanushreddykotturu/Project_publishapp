import { androidpublisher_v3 } from "googleapis";
import { getAndroidPublisherClient } from "../config/googlePlay";
import { ApiError } from "../utils/apiError";

type Client = androidpublisher_v3.Androidpublisher;

/**
 * Thin, individually-testable wrappers around the Android Publisher v3 "edit" lifecycle
 * (Tech Spec §7 API mode): insert -> upload bundle -> update track release -> commit.
 * Each function takes the client explicitly so orchestration (playIntegration.service)
 * can inject a fake client in tests instead of hitting Google's servers.
 */

export async function createEdit(client: Client, packageName: string): Promise<string> {
  const res = await client.edits.insert({ packageName });
  const editId = res.data.id;
  if (!editId) throw new Error("Google Play API did not return an edit id");
  return editId;
}

export async function uploadBundle(
  client: Client,
  packageName: string,
  editId: string,
  bundleStream: NodeJS.ReadableStream
): Promise<number> {
  const res = await client.edits.bundles.upload(
    { packageName, editId, media: { mimeType: "application/octet-stream", body: bundleStream } },
    {}
  );
  const versionCode = res.data.versionCode;
  if (!versionCode) throw new Error("Google Play API did not return a version code for the uploaded bundle");
  return versionCode;
}

/** Rolls the uploaded bundle out to the given track (e.g. "internal", "closed"). */
export async function updateTrackRelease(
  client: Client,
  packageName: string,
  editId: string,
  track: string,
  versionCode: number
): Promise<void> {
  await client.edits.tracks.update({
    packageName,
    editId,
    track,
    requestBody: {
      track,
      releases: [{ versionCodes: [String(versionCode)], status: "completed" }],
    },
  });
}

/**
 * Google Play only lets the API manage a track's testers via a linked Google Group
 * (Schema$Testers has a single field, `googleGroups` — there is no raw-email-list field).
 * Individual Gmail addresses that aren't members of that group still have to be added
 * to the group itself (Workspace Admin SDK, out of LaunchOps's scope) or entered into
 * Play Console by hand. This call automates the part Google's API actually supports.
 */
export async function syncTesterGoogleGroup(
  client: Client,
  packageName: string,
  editId: string,
  track: string,
  groupEmail: string
): Promise<void> {
  await client.edits.testers.update({
    packageName,
    editId,
    track,
    requestBody: { googleGroups: [groupEmail] },
  });
}

export async function commitEdit(client: Client, packageName: string, editId: string): Promise<void> {
  await client.edits.commit({ packageName, editId });
}

export function getClient(): Client {
  try {
    return getAndroidPublisherClient();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest(err instanceof Error ? err.message : "Failed to build Google Play API client");
  }
}
