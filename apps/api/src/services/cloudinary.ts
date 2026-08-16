import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

if (env.cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!,
  });
}

export type UploadFolder =
  | "proofs"
  | "bug-attachments"
  | "upi-qr"
  | "misc";

const ALLOWED_RESOURCE_TYPES = ["image", "video"] as const;

/** defineux/{env}/{folder}/{entityId} — one bucket-agnostic convention. */
export function cloudinaryFolder(folder: UploadFolder, entityId: string): string {
  return `defineux/${env.NODE_ENV}/${folder}/${entityId}`;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: (typeof ALLOWED_RESOURCE_TYPES)[number];
}

/**
 * Signed client-side uploads — the API never proxies binaries.
 * The client uploads directly to Cloudinary with these params.
 */
export function signUpload(
  folder: UploadFolder,
  entityId: string,
  resourceType: (typeof ALLOWED_RESOURCE_TYPES)[number],
): UploadSignature {
  if (!env.cloudinaryConfigured) {
    throw new ApiError(503, "STORAGE_UNAVAILABLE", "File storage not configured");
  }
  if (!ALLOWED_RESOURCE_TYPES.includes(resourceType)) {
    throw new ApiError(400, "BAD_RESOURCE_TYPE", "resourceType must be image or video");
  }
  const timestamp = Math.round(Date.now() / 1000);
  const targetFolder = cloudinaryFolder(folder, entityId);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: targetFolder },
    env.CLOUDINARY_API_SECRET!,
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder: targetFolder,
    resourceType,
  };
}
