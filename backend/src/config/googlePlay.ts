import { google, androidpublisher_v3 } from "googleapis";
import { env } from "./env";
import { ApiError } from "../utils/apiError";

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";

let cachedClient: androidpublisher_v3.Androidpublisher | null = null;

/**
 * Lazily builds an authenticated Android Publisher v3 client from the service
 * account JSON configured for the LaunchOps platform account (Tech Spec §7 API mode).
 * Throws a clear ApiError rather than a raw SDK error when the feature isn't
 * configured, so callers can surface "use manual mode" instead of a stack trace.
 */
export function getAndroidPublisherClient(): androidpublisher_v3.Androidpublisher {
  if (!env.googlePlay.apiModeEnabled) {
    throw ApiError.badRequest("Google Play API mode is disabled (GOOGLE_PLAY_API_MODE_ENABLED=false) — use manual mode");
  }
  if (!env.googlePlay.serviceAccountJson) {
    throw ApiError.badRequest("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured — use manual mode");
  }

  if (cachedClient) return cachedClient;

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(env.googlePlay.serviceAccountJson);
  } catch {
    throw ApiError.badRequest("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });

  cachedClient = google.androidpublisher({ version: "v3", auth });
  return cachedClient;
}

/** Test-only hook to force a fresh client to be built on next call. */
export function _resetAndroidPublisherClientCache(): void {
  cachedClient = null;
}
