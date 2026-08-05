import { api } from "./api";

interface Signature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "image" | "video";
}

export interface UploadedAsset {
  url: string;
  publicId: string;
  hash: string;
  bytes: number;
  resourceType: "image" | "video";
}

/**
 * Browser → Cloudinary direct upload. The API only signs; it never proxies
 * bytes. SHA-256 of the file goes with it — recycled-screenshot defense.
 */
export async function uploadFile(
  file: File,
  folder: "proofs" | "bug-attachments" | "upi-qr" | "misc",
  entityId: string,
  getToken: () => Promise<string | null>,
): Promise<UploadedAsset> {
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const token = await getToken();
  const sig = await api<Signature>("/uploads/signature", {
    token,
    method: "POST",
    body: { folder, entityId, resourceType },
  });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}) ${detail.slice(0, 120)}`);
  }
  const json = (await res.json()) as {
    secure_url: string;
    public_id: string;
    bytes: number;
  };

  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    url: json.secure_url,
    publicId: json.public_id,
    hash,
    bytes: json.bytes,
    resourceType,
  };
}
