/** Shared API transport. Authentication is supplied by Clerk at each call site;
 * there is intentionally no local or mock authentication fallback. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  token?: string;
  body?: unknown;
};

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, body, ...requestOptions } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...requestOptions.headers,
    },
    body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiRequestError(payload?.error?.message || payload?.message || `API request failed (${response.status})`, response.status);
  }
  return payload as T;
}
