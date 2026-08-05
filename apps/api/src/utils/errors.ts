export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (msg: string, code = "BAD_REQUEST") =>
  new ApiError(400, code, msg);
export const unauthorized = (msg = "Authentication required") =>
  new ApiError(401, "UNAUTHORIZED", msg);
export const forbidden = (msg = "Insufficient permissions") =>
  new ApiError(403, "FORBIDDEN", msg);
export const notFound = (what = "Resource") =>
  new ApiError(404, "NOT_FOUND", `${what} not found`);
export const conflict = (msg: string, code = "CONFLICT") =>
  new ApiError(409, code, msg);
