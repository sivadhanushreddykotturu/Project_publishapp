export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

type ApiRequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiRequestError(0, "LaunchOps backend did not respond in time. Check that the backend is running on port 4000.");
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const error = typeof payload === "object" && payload !== null && "error" in payload ? payload.error : null;
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : `Request failed with status ${response.status}`;

    throw new ApiRequestError(response.status, message, error && typeof error === "object" ? error : undefined);
  }

  return payload as T;
}
