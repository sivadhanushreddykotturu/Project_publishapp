import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

// Cloudflare R2 is S3-API-compatible; region must be "auto" and the endpoint
// points at the account-scoped R2 URL. Never proxy binaries through the API —
// only issue presigned PUT/GET URLs (see services/storage.service.ts).
export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.r2.endpoint || `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});
