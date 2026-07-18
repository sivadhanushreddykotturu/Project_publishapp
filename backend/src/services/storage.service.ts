import { randomUUID } from "crypto";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "../config/r2";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

/**
 * Files (R2), Tech Spec §10: presigned PUT/GET only — the API never proxies binaries.
 * Allow-list covers proof screenshots/recordings plus AAB/APK for client bundle uploads.
 * Virus/type scanning happens asynchronously post-upload (out of scope for this endpoint);
 * objects are considered quarantined until a scan-clean webhook flips their status.
 */
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "mp4", "mov", "pdf", "aab", "apk"] as const;
const PUT_URL_EXPIRY_SECONDS = 300;
const GET_URL_EXPIRY_SECONDS = 3600;

function extensionOf(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ext;
}

export function assertAllowedExtension(filename: string) {
  const ext = extensionOf(filename);
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    throw ApiError.badRequest(`File type not allowed: .${ext}`);
  }
  return ext;
}

export async function createUploadUrl(params: { filename: string; contentType: string; scope: string }) {
  const ext = assertAllowedExtension(params.filename);
  const key = `${params.scope}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.r2.bucket,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: PUT_URL_EXPIRY_SECONDS });
  return { uploadUrl, key, expiresIn: PUT_URL_EXPIRY_SECONDS };
}

export async function createDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: env.r2.bucket, Key: key });
  const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: GET_URL_EXPIRY_SECONDS });
  return { downloadUrl, expiresIn: GET_URL_EXPIRY_SECONDS };
}

/**
 * Server-side stream of an R2 object's bytes — used only for the one backend-to-backend
 * hop the Google Play API mode needs (piping a client's uploaded AAB straight to Google's
 * bundle-upload endpoint). Every other file transfer in the app stays presigned
 * client<->R2 per Tech Spec §10; this does not proxy binaries through any client-facing route.
 */
export async function getObjectStream(key: string): Promise<NodeJS.ReadableStream> {
  const command = new GetObjectCommand({ Bucket: env.r2.bucket, Key: key });
  const result = await r2Client.send(command);
  if (!result.Body) throw ApiError.notFound(`R2 object not found: ${key}`);
  return result.Body as NodeJS.ReadableStream;
}
