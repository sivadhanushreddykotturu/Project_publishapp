const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface ApiOptions {
  token?: string | null;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

/** Typed client for the LaunchOps backend API. Pass a Clerk session token. */
export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;

  if (!res.ok) {
    // Handle backend error shapes: { error: { code, message } } or { message }
    const errObj = json?.error as { code?: string; message?: string } | null | undefined;
    const errMsg =
      errObj?.message ??
      (typeof json?.message === "string" ? json.message : null) ??
      `Request failed (${res.status})`;
    const errCode = errObj?.code ?? "UNKNOWN";
    throw new ApiClientError(res.status, errCode, errMsg);
  }

  // The LaunchOps backend returns { data: T } (not { ok: true, data: T }).
  // Unwrap .data when present, otherwise return the raw payload.
  if (json !== null && typeof json === "object" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}
