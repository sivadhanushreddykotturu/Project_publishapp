import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { logger } from "../config/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err }, "Request failed");
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err && typeof err === "object" && "name" in err && (err as Error).name === "ValidationError") {
    res.status(400).json({ error: { message: (err as Error).message } });
    return;
  }

  if (err && typeof err === "object" && "name" in err && ["CastError", "BSONError"].includes(String((err as Error).name))) {
    res.status(400).json({ error: { message: "Invalid identifier" } });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: { message: "Internal server error" } });
}
